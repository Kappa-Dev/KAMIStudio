"""Views of home blueprint."""
import datetime
import os
import json

from flask import (render_template, Blueprint, request, redirect,
                   url_for, send_file)
from flask import current_app as app

from regraph.neo4j import Neo4jHierarchy

from kami.exporters import kappa_exporters

from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.models import KamiModel

from kamistudio.utils import authenticate

model_blueprint = Blueprint('model', __name__, template_folder='templates')


def get_model(model_id):
    """Retreive corpus from the db."""
    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
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
    else:
        return None


def updateLastModified(model_id):
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
                  default_mod_rate=None):
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
    # if corpus_id:
    json_data["origin"]["corpus_id"] = corpus_id
    # if seed_genes:
    json_data["origin"]["seed_genes"] = seed_genes
    # if definitions:
    json_data["origin"]["definitions"] = definitions

    app.mongo.db.kami_models.insert_one(json_data)


@model_blueprint.route("/model/<model_id>")
def model_view(model_id):
    """View model."""
    if app.neo4j_driver is None:
        return render_template(
            "neo4j_connection_failure.html",
            uri=app.config["NEO4J_URI"],
            user=app.config["NEO4J_USER"])

    model = get_model(model_id)
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
                               nuggets=json.dumps(nuggets),
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
    model.export_json(
        os.path.join(app.config["UPLOAD_FOLDER"], filename))
    return send_file(
        os.path.join(app.config["UPLOAD_FOLDER"], filename),
        as_attachment=True,
        mimetype='application/json',
        attachment_filename=filename)


@model_blueprint.route("/model/<model_id>/delete")
@authenticate
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
        return redirect(url_for("home.index"))
    else:
        return render_template("model_not_found.html", model_id=model_id)


# @model_blueprint.route("/model/<model_id>/add-interaction",
#                        methods=["GET", "POST"])
# @authenticate
# def add_interaction(model_id, add_agents=True,
#                     anatomize=True, apply_semantics=True):
#     """Handle interaction addition."""
#     pass
    # model = get_model(model_id)
    # if request.method == 'GET':
    #     return render_template(
    #         "add_model_interaction.html",
    #         model_id=model_id)
    # elif request.method == 'POST':
    #     interaction = parse_interaction(request.form)
    #     nugget, nugget_type = generate_nugget(
    #         model, interaction)
    #     model.add_nugget(
    #         nugget, nugget_type,
    #         add_agents=add_agents,
    #         anatomize=anatomize,
    #         apply_semantics=apply_semantics)
    #     return redirect(url_for('model.model_view', model_id=model_id))


# @model_blueprint.route("/model/<model_id>/nugget-preview",
#                        methods=["POST"])
# def preview_nugget(model_id):
#     """Generate nugget, store in the session and redirect to nugget preview."""
#     model = get_model(model_id)
#     interaction = parse_interaction(request.form)
#     nugget, nugget_type = generate_nugget(
#         model, interaction)

#     session["nugget"] = nugget
#     session["nugget_type"] = nugget_type
#     session.modified = True

#     template_relation = {}
#     for k, v in nugget.template_rel.items():
#         for vv in v:
#             template_relation[vv] = k

#     desc = interaction.desc
#     rate = interaction.rate

#     return render_template(
#         "nugget_preview.html",
#         new_nugget=True,
#         model_id=model_id,
#         models=app.models,
#         nugget_graph=json.dumps(graph_to_d3_json(nugget.graph)),
#         nugget_type=nugget_type,
#         nugget_meta_typing=json.dumps(nugget.meta_typing),
#         nugget_meta_typing_json=nugget.meta_typing,
#         nugget_ag_typing=json.dumps(nugget.ag_typing),
#         nugget_template_rel=json.dumps(template_relation),
#         nugget_desc=desc,
#         nugget_rate=rate,
#         nugget_nodes=nugget.graph.nodes(),
#         nugget_ag_typing_dict=nugget.ag_typing)


# @model_blueprint.route("/model/<model_id>/add-generated-nugget",
#                        methods=["GET"])
# def add_nugget_from_session(model_id, add_agents=True,
#                             anatomize=True, apply_semantics=True):
#     """Add nugget stored in session to the model."""
#     model = get_model(model_id)
#     model.add_nugget(
#         session["nugget"], session["nugget_type"],
#         add_agents=add_agents,
#         anatomize=anatomize,
#         apply_semantics=apply_semantics)

#     if "nugget" in session.keys():
#         session.pop("nugget", None)
#     if "nugget_type" in session.keys():
#         session.pop("nugget_type", None)

#     return redirect(url_for('model.model_view', model_id=model_id))

# @model_blueprint.route("/model/<model_id>/import-json-interactions",
#                        methods=["GET"])
# @authenticate
# def import_json_interactions(model_id):
#     """Handle import of json interactions."""
#     pass


@model_blueprint.route("/model/<model_id>/update-ag-node-positioning",
                       methods=["POST"])
@authenticate
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
    updateLastModified(model_id)
    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}


@model_blueprint.route("/model/<model_id>/update-node-attrs",
                       methods=["POST"])
@authenticate
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
                updateLastModified(model_id)
            except:
                pass
    return response


@model_blueprint.route("/model/<model_id>/update-edge-attrs",
                       methods=["POST"])
@authenticate
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
                updateLastModified(model_id)
            except:
                pass
    return response


@model_blueprint.route("/model/<model_id>/update-meta-data",
                       methods=["POST"])
@authenticate
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
def generate_kappa(model_id):
    """Serve generated Kappa file."""
    model = get_model(model_id)
    if model:
        filename = model_id.replace(" ", "_") + ".kappa"
        kappa_str = kappa_exporters.generate_kappa(model)
        print(kappa_str)
        with open(os.path.join(app.config["UPLOAD_FOLDER"], filename), "w+") as f:
            f.write(kappa_str)
            return send_file(
                os.path.join(app.config["UPLOAD_FOLDER"], filename),
                as_attachment=True,
                # mimetype='application/json',
                attachment_filename=filename)
    else:
        return render_template("model_not_found.html", model_id=model_id)
