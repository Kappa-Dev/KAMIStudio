"""."""
from flask import Blueprint, jsonify, request
from flask import current_app as app

from regraph import graph_to_d3_json

from kamistudio.corpus.views import get_corpus
from kamistudio.model.views import get_model
from kamistudio.utils import authenticate

action_graph_blueprint = Blueprint(
    'action_graph', __name__, template_folder='templates')


def get_action_graph(knowledge_obj, json_repr, attrs):
    # load positions of AG nodes if available
    if "node_positioning" in json_repr.keys():
        node_positioning = json_repr["node_positioning"]
    else:
        node_positioning = {}

    data = {}

    if (knowledge_obj.action_graph):
        data["actionGraph"] = graph_to_d3_json(
            knowledge_obj.action_graph, attrs)
        data["connectedComponents"] =\
            knowledge_obj.action_graph.find_connected_components()
    else:
        data["actionGraph"] = {"links": [], "nodes": []}
        data["connectedComponents"] = {}

    data["metaTyping"] = knowledge_obj.get_action_graph_typing()
    data["nodePosition"] = node_positioning
    return jsonify(data), 200


@action_graph_blueprint.route("/model/<model_id>/raw-action-graph")
def get_model_action_graph(model_id, attrs=True):
    """Handle the raw json action graph representation."""
    model = get_model(model_id)
    model_json = app.mongo.db.kami_models.find_one({"id": model_id})
    return get_action_graph(model, model_json, attrs)


@action_graph_blueprint.route("/corpus/<corpus_id>/raw-action-graph")
def get_corpus_action_graph(corpus_id, attrs=True):
    """Handle the raw json action graph representation."""
    corpus = get_corpus(corpus_id)
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    return get_action_graph(corpus, corpus_json, attrs)


@action_graph_blueprint.route(
    "/corpus/<corpus_id>/get-ag-elements-by-type/<element_type>")
def get_ag_node_by_type(corpus_id, element_type):
    """."""
    data = {"elements": []}
    corpus = get_corpus(corpus_id)
    ag_nodes = corpus.nodes_of_type(element_type)
    for n in ag_nodes:
        element = {"id": n}
        element["attrs"] = {
            k: list(v)
            for k, v in corpus.get_ag_node_data(n).items()
        }
        data["elements"].append(element)
    return jsonify(data), 200


@action_graph_blueprint.route(
    "/corpus/<corpus_id>/get-ag-element-by-id/<element_id>")
def get_ag_node_by_id(corpus_id, element_id):
    """."""
    corpus = get_corpus(corpus_id)
    data = {
        k: list(v)
        for k, v in corpus.get_ag_node_data(
            element_id).items()
    }
    return jsonify(data), 200


def merge_ag_nodes(kb, data):
    kb.merge_ag_nodes(data["nodes"])


@action_graph_blueprint.route("/corpus/<corpus_id>/merge-action-graph-nodes",
                              methods=["POST"])
@authenticate
def merge_corpus_ag_nodes(corpus_id):
    merge_ag_nodes(get_corpus(corpus_id), request.get_json())
    return jsonify({"success": True}), 200


@action_graph_blueprint.route("/model/<model_id>/merge-action-graph-nodes",
                              methods=["POST"])
@authenticate
def merge_model_ag_nodes(model_id):
    merge_ag_nodes(get_model(model_id), request.get_json())
    return jsonify({"success": True}), 200
