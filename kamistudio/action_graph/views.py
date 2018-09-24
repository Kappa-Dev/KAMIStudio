"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from regraph import graph_to_d3_json


action_graph_blueprint = Blueprint(
    'action_graph', __name__, template_folder='templates')


@action_graph_blueprint.route("/model/<hierarchy_id>/raw-action-graph")
def raw_action_graph_json(hierarchy_id, attrs=False):
    """Handle the raw json action graph representation."""
    hierarchy = app.hierarchies[hierarchy_id]

    if "node_positioning" in hierarchy.attrs.keys():
        node_positioning = list(hierarchy.attrs["node_positioning"].fset)

    else:
        node_positioning = {}

    data = {}

    if (hierarchy.action_graph):
        data["actionGraph"] = graph_to_d3_json(
            hierarchy.action_graph, attrs, ["hgnc_symbol"])
    else:
        data["actionGraph"] = {"links": [], "nodes": []}

    data["metaTyping"] = hierarchy.action_graph_typing
    data["nodePosition"] = node_positioning
    return jsonify(data), 200


@action_graph_blueprint.route(
    "/model/<hierarchy_id>/get-ag-elements-by-type/<element_type>")
def get_ag_node_by_type(hierarchy_id, element_type):
    """."""
    data = {"elements": []}
    ag_nodes = app.hierarchies[hierarchy_id].nodes_of_type(element_type)
    for n in ag_nodes:
        element = {"id": n}
        element["attrs"] = {
            k: list(v)
            for k, v in app.hierarchies[hierarchy_id].get_ag_node_data(n).items()
        }
        data["elements"].append(element)
    return jsonify(data, 200)


@action_graph_blueprint.route(
    "/model/<hierarchy_id>/get-ag-element-by-id/<element_id>")
def get_ag_node_by_id(hierarchy_id, element_id):
    """."""
    data = {
        k: list(v)
        for k, v in app.hierarchies[hierarchy_id].get_ag_node_data(
            element_id).items()
    }
    return jsonify(data, 200)
