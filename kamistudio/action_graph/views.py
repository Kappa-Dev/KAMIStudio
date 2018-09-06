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
