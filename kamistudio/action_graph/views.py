"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from regraph import graph_to_d3_json


action_graph_blueprint = Blueprint(
    'action_graph', __name__, template_folder='templates')


@action_graph_blueprint.route("/model/<model_id>/raw-action-graph")
def raw_action_graph_json(model_id, attrs=False):
    """Handle the raw json action graph representation."""
    model = app.models[model_id]
    ag_attrs = dict()
    if (model.action_graph):
        ag_attrs = model.get_action_graph_attrs()

    # load positions of AG nodes if available
    if "node_positioning" in ag_attrs.keys():
        node_positioning = list(ag_attrs["node_positioning"].fset)
    else:
        node_positioning = {}

    data = {}

    if (model.action_graph):
        data["actionGraph"] = graph_to_d3_json(
            model.action_graph, attrs, ["hgnc_symbol"])
    else:
        data["actionGraph"] = {"links": [], "nodes": []}

    data["metaTyping"] = model.get_action_graph_typing()
    data["nodePosition"] = node_positioning
    return jsonify(data), 200


@action_graph_blueprint.route(
    "/model/<model_id>/get-ag-elements-by-type/<element_type>")
def get_ag_node_by_type(model_id, element_type):
    """."""
    data = {"elements": []}
    ag_nodes = app.models[model_id].nodes_of_type(element_type)
    for n in ag_nodes:
        element = {"id": n}
        element["attrs"] = {
            k: list(v)
            for k, v in app.models[model_id].get_ag_node_data(n).items()
        }
        data["elements"].append(element)
    return jsonify(data, 200)


@action_graph_blueprint.route(
    "/model/<model_id>/get-ag-element-by-id/<element_id>")
def get_ag_node_by_id(model_id, element_id):
    """."""
    data = {
        k: list(v)
        for k, v in app.models[model_id].get_ag_node_data(
            element_id).items()
    }
    return jsonify(data, 200)
