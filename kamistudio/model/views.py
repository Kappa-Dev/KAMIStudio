"""Views of home blueprint."""
import os
import json

from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_from_directory, send_file)
from flask import current_app as app

from regraph import graph_to_d3_json
from regraph.neo4j import Neo4jHierarchy

from kami.aggregation.generators import generate_nugget
from kami.data_structures.models import KamiModel
from kami.exporters.old_kami import ag_to_edge_list

from kamistudio.model.form_parsing import(parse_interaction)
from kamistudio.corpus.views import get_corpus

model_blueprint = Blueprint('model', __name__, template_folder='templates')


def get_model(model_id):
    """Retreive corpus from the db."""
    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    print(model_json)
    return KamiModel(
        model_id,
        annotation=model_json["meta_data"],
        creation_time=model_json["creation_time"],
        last_modified=model_json["last_modified"],
        corpus_id=model_json["origin"]["corpus_id"],
        seed_genes=model_json["origin"]["seed_genes"],
        definitions=model_json["origin"]["definitions"],
        backend="neo4j",
        driver=app.neo4j_driver
    )


def add_new_model(model_obj):
    """Add new model to the db."""
    app.mongo.db.kami_models.insert_one({
        "id": model_obj._id,
        "creation_time": model_obj.creation_time,
        "last_modified": model_obj.last_modified,
        "meta_data": model_obj.annotation,
        "origin": {
            "corpus_id": model_obj._corpus_id,
            "definitions": model_obj._definitions,
            "seed_genes": model_obj._seed_genes,
        },
        "kappa_models": []
    })


@model_blueprint.route("/model/<model_id>")
def model_view(model_id):
    """View model."""
    model = get_model(model_id)
    corpus = None
    if model._corpus_id is not None:
        corpus = get_corpus(model._corpus_id)

    nugget_desc = {}
    for nugget in model.nuggets():
        nugget_desc[nugget] = model.get_nugget_desc(nugget)

    return render_template("model.html",
                           model_id=model_id,
                           model=model,
                           corpus=corpus,
                           nugget_desc=nugget_desc)


@model_blueprint.route("/model/<model_id>/add-interaction",
                       methods=["GET", "POST"])
def add_interaction(model_id, add_agents=True,
                    anatomize=True, apply_semantics=True):
    """Handle interaction addition."""
    pass
    # model = get_model(model_id)
    # if request.method == 'GET':
    #     return render_template(
    #         "add_interaction.html",
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


@model_blueprint.route("/model/<model_id>/import-json-interactions",
                       methods=["GET"])
def import_json_interactions(model_id):
    """Handle import of json interactions."""
    pass


@model_blueprint.route("/model/<model_id>/download", methods=["GET"])
def download_model(model_id):
    """Handle model download."""
    model = get_model(model_id)
    filename = model_id.replace(" ", "_") + ".json"
    model.export_json(
        os.path.join(app.root_path, "uploads/" + filename))
    return send_file(
        os.path.join(app.root_path, "uploads/" + filename),
        as_attachment=True,
        mimetype='application/json',
        attachment_filename=filename)


@model_blueprint.route("/model/<model_id>/update-ag-node-positioning",
                       methods=["POST"])
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

    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}


@model_blueprint.route("/model/<model_id>/delete")
def delete_model(model_id):
    """Handle removal of the model."""
    model = get_model(model_id)

    # connect to db
    h = Neo4jHierarchy(driver=app.neo4j_driver)

    # remove nuggets
    for n in model.nuggets():
        h.remove_graph(n)
    # remove the ag
    h.remove_graph(model._action_graph_id)

    # drop from mongo db
    app.mongo.db.kami_models.remove({"id": model_id})
