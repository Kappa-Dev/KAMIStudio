"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from regraph import graph_to_d3_json


action_graph_blueprint = Blueprint(
    'action_graph', __name__, template_folder='templates')


@action_graph_blueprint.route("/model/<hierarchy_id>/raw-action-graph")
def raw_action_graph_json(hierarchy_id):
    hierarchy = app.hierarchies[hierarchy_id]

    data = {}
    data["actionGraph"] = graph_to_d3_json(hierarchy.action_graph)
    data["metaTyping"] = hierarchy.action_graph_typing

    return jsonify(data), 200
