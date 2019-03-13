"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from kamistudio.corpus.views import get_corpus

from regraph import graph_to_d3_json


action_graph_blueprint = Blueprint(
    'action_graph', __name__, template_folder='templates')


@action_graph_blueprint.route("/corpus/<corpus_id>/raw-action-graph")
def raw_action_graph_json(corpus_id, attrs=True):
    """Handle the raw json action graph representation."""
    corpus = get_corpus(corpus_id)
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    # load positions of AG nodes if available
    if "node_positioning" in corpus_json.keys():
        node_positioning = corpus_json["node_positioning"]
    else:
        node_positioning = {}

    data = {}

    if (corpus.action_graph):
        data["actionGraph"] = graph_to_d3_json(
            corpus.action_graph, attrs)
    else:
        data["actionGraph"] = {"links": [], "nodes": []}

    data["metaTyping"] = corpus.get_action_graph_typing()
    data["nodePosition"] = node_positioning
    return jsonify(data), 200


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
    return jsonify(data, 200)


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
    return jsonify(data, 200)
