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


@nuggets_blueprint.route("/model/<hierarchy_id>/nugget-table")
def nugget_table(hierarchy_id):
    """Generate a nugget table."""
    data = {}
    data["meta_data"] = dict()
    data["pairs"] = []

    hierarchy = app.hierarchies[hierarchy_id]

    # retreive all the genes from the action graph
    for g in hierarchy.genes():
        uniprotid = None
        hgnc_symbol = None
        node = hierarchy.action_graph.node[g]
        if "uniprotid" in node:
            uniprotid = list(node["uniprotid"])[0]
        if "hgnc_symbol" in node:
            hgnc_symbol = list(node["hgnc_symbol"])[0]
        data["meta_data"][g] = (uniprotid, hgnc_symbol)

    table = dict()
    for g1 in data["meta_data"].keys():
        for g2 in data["meta_data"].keys():
            table[(g1, g2)] = []
            table[(g2, g1)] = []
            # if g1 not in data["table"].keys():
            #     data["table"][g1] = dict()
            # data["table"][g1][g2] = []
            # if g2 not in data["table"].keys():
            #     data["table"][g2] = dict()
            # data["table"][g2][g1] = []

    for nugget_id in hierarchy.nuggets():
        nugget = hierarchy.nugget[nugget_id]
        nugget_typing = hierarchy.typing[nugget_id]["action_graph"]
        mentioned_genes = list()
        for n in nugget.nodes():
            if nugget_typing[n] in data["meta_data"].keys():
                mentioned_genes.append(nugget_typing[n])
        for i, g1 in enumerate(mentioned_genes):
            for j in range(i + 1, len(mentioned_genes)):
                g2 = mentioned_genes[j]
                table[(g1, g2)].append(nugget_id)
                table[(g2, g1)].append(nugget_id)

    for s, t in table.keys():
        data["pairs"].append({
            "source": s,
            "target": t,
            "nuggets": table[(s, t)]
        })
    return jsonify(data), 200
