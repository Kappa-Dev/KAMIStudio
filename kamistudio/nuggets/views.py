"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from regraph import graph_to_d3_json


nuggets_blueprint = Blueprint('nuggets', __name__, template_folder='templates')


@nuggets_blueprint.route("/model/<hierarchy_id>/nugget/<nugget_id>")
def nugget_view(hierarchy_id, nugget_id):
    """Handle nugget view."""
    return("Lets see the nugget")


@nuggets_blueprint.route("/model/<hierarchy_id>/raw-nugget/<nugget_id>")
def raw_nugget_json(hierarchy_id, nugget_id):
    hierarchy = app.hierarchies[hierarchy_id]

    data = {}
    data["nuggetJson"] = graph_to_d3_json(hierarchy.nugget[nugget_id])
    data["nuggetType"] = hierarchy.get_nugget_type(nugget_id)
    data["metaTyping"] = {
        k: hierarchy.action_graph_typing[v]
        for k, v in hierarchy.typing[nugget_id]["action_graph"].items()
    }
    data["agTyping"] = hierarchy.typing[nugget_id]["action_graph"]

    data["templateRelation"] = {}
    for k, v in hierarchy.get_nugget_template_rel(nugget_id).items():
        for vv in v:
            data["templateRelation"][vv] = k
    return jsonify(data), 200
