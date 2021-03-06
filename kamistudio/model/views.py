"""Views of home blueprint."""
import datetime
import os
import json

from flask import (render_template, Blueprint, request, redirect,
                   url_for, send_file, jsonify)
from flask import current_app as app

from regraph import Neo4jHierarchy

from kami.exporters.kappa import ModelKappaGenerator

from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.models import KamiModel

from kamistudio.utils import authenticate, check_dbs

model_blueprint = Blueprint('model', __name__, template_folder='templates')


def get_model(model_id):
    """Retreive corpus from the db."""
    try:
        model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    except:
        model_json = None
    if model_json and app.neo4j_driver:
        corpus_id = None
        if "corpus_id" in model_json["origin"].keys():
            corpus_id = model_json["origin"]["corpus_id"]
        seed_genes = None
        if "seed_genes" in model_json["origin"].keys():
            seed_genes = model_json["origin"]["seed_genes"]
        definitions = None
        if "definitions" in model_json["origin"].keys():
            definitions = model_json["origin"]["definitions"]
        default_bnd_rate = None
        default_brk_rate = None
        default_mod_rate = None
        if "default_bnd_rate" in model_json.keys():
            default_bnd_rate = model_json["default_bnd_rate"]
        if "default_brk_rate" in model_json.keys():
            default_brk_rate = model_json["default_brk_rate"]
        if "default_mod_rate" in model_json.keys():
            default_mod_rate = model_json["default_mod_rate"]
        return KamiModel(
            model_id,
            annotation=CorpusAnnotation.from_json(model_json["meta_data"]),
            creation_time=model_json["creation_time"],
            last_modified=model_json["last_modified"],
            corpus_id=corpus_id,
            seed_genes=seed_genes,
            definitions=definitions,
            backend="neo4j",
            driver=app.neo4j_driver,
            default_bnd_rate=default_bnd_rate,
            default_brk_rate=default_brk_rate,
            default_mod_rate=default_mod_rate
        )


@check_dbs
def update_last_modified(model_id):
    """Update Lasti modified field of the model."""
    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    model_json["last_modified"] = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")
    app.mongo.db.kami_models.update_one(
        {"_id": model_json["_id"]},
        {"$set": model_json},
        upsert=False)


def add_new_model(model_id, creation_time, last_modified, annotation,
                  corpus_id=None, seed_genes=None, definitions=None,
                  default_bnd_rate=None, default_brk_rate=None,
                  default_mod_rate=None, ag_node_positions=None):
    """Add new model to the db."""
    json_data = {
        "id": model_id,
        "creation_time": creation_time,
        "last_modified": last_modified,
        "meta_data": annotation,
        "origin": {},
        "default_bnd_rate": default_bnd_rate,
        "default_brk_rate": default_brk_rate,
        "default_mod_rate": default_mod_rate,
        "kappa_models": []
    }
    json_data["origin"]["corpus_id"] = corpus_id
    json_data["origin"]["seed_genes"] = seed_genes
    json_data["origin"]["definitions"] = definitions
    if ag_node_positions is not None:
        json_data["node_positioning"] = ag_node_positions
    app.mongo.db.kami_models.insert_one(json_data)


@model_blueprint.route("/model/<model_id>")
@check_dbs
def model_view(model_id):
    """View model."""
    try:
        model = get_model(model_id)
    except:
        return render_template(
            "neo4j_connection_failure.html",
            uri=app.config["NEO4J_URI"],
            user=app.config["NEO4J_USER"])
    nuggets = {}
    if model is not None:
        corpus = None

        corpus_name = None

        if model._corpus_id is not None:
            corpus = app.mongo.db.kami_corpora.find_one({"id": model._corpus_id})
            if corpus:
                corpus_name = corpus["meta_data"]["name"]

        proteins = {}
        for p in model.proteins():
            proteins[p] = model.get_gene_data(p)

        modifications = {}
        for m in model.modifications():
            modifications[m] = []

        bindings = {}
        for b in model.bindings():
            bindings[b] = []

        for nugget in model.nuggets():
            nuggets[nugget] = (
                model.get_nugget_desc(nugget),
                model.get_nugget_type(nugget)
            )

        return render_template("model.html",
                               kb_id=model_id,
                               kb=model,
                               corpus_id=model._corpus_id,
                               corpus_name=corpus_name,
                               n_nuggets=len(model.nuggets()),
                               proteins=json.dumps(proteins),
                               modifications=json.dumps(modifications),
                               bindings=json.dumps(bindings),
                               instantiated=True,
                               readonly=app.config["READ_ONLY"])
    else:
        return render_template("model_not_found.html",
                               model_id=model_id)


@model_blueprint.route("/model/<model_id>/download", methods=["GET"])
def download_model(model_id):
    """Handle model download."""
    model = get_model(model_id)
    filename = model_id.replace(" ", "_") + ".json"

    if model:
        # Get action graph layout
        node_positioning = None
        json_repr = app.mongo.db.kami_models.find_one({"id": model_id})
        if "node_positioning" in json_repr.keys():
            node_positioning = json_repr["node_positioning"]

        model_json = model.to_json()
        if node_positioning is not None:
            model_json["node_positioning"] = node_positioning

        with open(os.path.join(app.config["UPLOAD_FOLDER"], filename), 'w') as f:
            json.dump(model_json, f)

        return send_file(
            os.path.join(app.config["UPLOAD_FOLDER"], filename),
            as_attachment=True,
            mimetype='application/json',
            attachment_filename=filename)
    else:
        return render_template("model_not_found.html",
                               model_id=model_id)



@model_blueprint.route("/model/<model_id>/delete")
@authenticate
@check_dbs
def delete_model(model_id):
    """Handle removal of the model."""
    model = get_model(model_id)
    if model is not None:
        # connect to db
        h = Neo4jHierarchy(driver=app.neo4j_driver)
        # remove nuggets
        for n in model.nuggets():
            h.remove_graph(n)
        # remove the ag
        h.remove_graph(model._action_graph_id)
        # drop from mongo db
        app.mongo.db.kami_models.remove({"id": model_id})
        return jsonify({"success": True}), 200
    else:
        return render_template("model_not_found.html", model_id=model_id)


@model_blueprint.route("/model/<model_id>/update-ag-node-positioning",
                       methods=["POST"])
@authenticate
@check_dbs
def update_ag_node_positioning(model_id):
    """Retrieve node positioning from post request."""
    json_data = request.get_json()
    # corpus = get_corpus(corpus_id)

    if "node_positioning" in json_data.keys() and\
       len(json_data["node_positioning"]) > 0:
        attrs = app.mongo.db.kami_models.find_one({"id": model_id})
        if "node_positioning" in attrs.keys():
            position_dict = attrs["node_positioning"]
        else:
            position_dict = {}

        # update positions from json data in the request
        for k, v in json_data["node_positioning"].items():
            position_dict[k] = [v[0], v[1]]

        app.mongo.db.kami_models.update(
            {'id': model_id},
            {'$set': {'node_positioning': position_dict}})
    update_last_modified(model_id)
    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}


@model_blueprint.route("/model/<model_id>/update-node-attrs",
                       methods=["POST"])
@authenticate
@check_dbs
def update_node_attrs(model_id):
    """Handle update of node attrs."""
    json_data = request.get_json()
    node_id = json_data["id"]
    node_attrs = json_data["attrs"]
    model = get_model(model_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if model is not None:
        if node_id in model.action_graph.nodes():
            try:
                model.action_graph.set_node_attrs_from_json(node_id, node_attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                update_last_modified(model_id)
            except:
                pass
    return response


@model_blueprint.route("/model/<model_id>/update-edge-attrs",
                       methods=["POST"])
@authenticate
@check_dbs
def update_edge_attrs(model_id):
    """Handle update of edge attrs."""
    json_data = request.get_json()
    source = json_data["source"]
    target = json_data["target"]
    edge_attrs = json_data["attrs"]
    model = get_model(model_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if model is not None:
        if (source, target) in model.action_graph.edges():
            try:
                model.action_graph.set_edge_attrs_from_json(source, target, edge_attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                update_last_modified(model_id)
            except:
                pass
    return response


@model_blueprint.route("/model/<model_id>/update-meta-data",
                       methods=["POST"])
@authenticate
@check_dbs
def update_meta_data(model_id):
    """Handle update of meta data."""
    json_data = request.get_json()

    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    for k in json_data.keys():
        model_json["meta_data"][k] = json_data[k]

    app.mongo.db.kami_models.update_one(
        {"_id": model_json["_id"]},
        {"$set": model_json},
        upsert=False)

    response = json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}

    return response


@model_blueprint.route("/model/<model_id>/update-rate-data",
                       methods=["POST"])
@authenticate
@check_dbs
def update_rate_data(model_id):
    """Handle update of rate data."""
    json_data = request.get_json()

    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    if "default_bnd_rate" in json_data:
        model_json["default_bnd_rate"] = json_data["default_bnd_rate"]
    if "default_mod_rate" in json_data:
        model_json["default_mod_rate"] = json_data["default_mod_rate"]
    if "default_brk_rate" in json_data:
        model_json["default_brk_rate"] = json_data["default_brk_rate"]

    app.mongo.db.kami_models.update_one(
        {"_id": model_json["_id"]},
        {"$set": model_json},
        upsert=False)

    response = json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}

    return response


@model_blueprint.route("/model/<model_id>/generate-kappa", methods=["GET"])
@check_dbs
def generate_kappa(model_id):
    """Serve generated Kappa file."""
    model = get_model(model_id)
    if model:
        filename = model_id.replace(" ", "_") + ".kappa"
        path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        if not os.path.isfile(path) or not app.config["READ_ONLY"]:
            generator = ModelKappaGenerator(model)
            kappa_str = generator.generate()
            with open(path, "w+") as f:
                f.write(kappa_str)
        return send_file(
            path,
            as_attachment=True,
            attachment_filename=filename)
    else:
        return render_template("model_not_found.html", model_id=model_id)
