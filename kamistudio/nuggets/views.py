"""."""
from flask import Blueprint, jsonify
from flask import current_app as app

from regraph import graph_to_d3_json


nuggets_blueprint = Blueprint('nuggets', __name__, template_folder='templates')


@nuggets_blueprint.route("/model/<model_id>/nugget/<nugget_id>")
def nugget_view(model_id, nugget_id):
    """Handle nugget view."""
    return("Lets see the nugget")


@nuggets_blueprint.route("/model/<model_id>/raw-nugget/<nugget_id>")
def raw_nugget_json(model_id, nugget_id):
    model = app.models[model_id]

    data = {}
    data["nuggetJson"] = graph_to_d3_json(model.nugget[nugget_id])
    data["nuggetType"] = model.get_nugget_type(nugget_id)
    data["metaTyping"] = {
        k: model.get_action_graph_typing()[v]
        for k, v in model.get_nugget_typing(nugget_id).items()
    }
    data["agTyping"] = model.get_nugget_typing(nugget_id)

    data["templateRelation"] = {}
    for k, v in model.get_nugget_template_rel(nugget_id).items():
        for vv in v:
            data["templateRelation"][vv] = k
    return jsonify(data), 200


@nuggets_blueprint.route("/model/<model_id>/nugget-table")
def nugget_table(model_id):
    """Generate a nugget table."""
    data = {}
    data["meta_data"] = dict()
    data["pairs"] = []

    model = app.models[model_id]

    # retreive all the genes from the action graph
    for g in model.genes():
        uniprotid = None
        hgnc_symbol = None
        node = model.get_ag_node(g)
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

    for nugget_id in model.nuggets():
        nugget = model.nugget[nugget_id]
        nugget_typing = model.get_nugget_typing(nugget_id)
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
