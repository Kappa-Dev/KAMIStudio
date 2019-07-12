"""."""
import json
from flask import Blueprint, jsonify, request

from kamistudio.utils import authenticate
from kamistudio.corpus.views import get_corpus, update_last_modified
from kamistudio.model.views import get_model

from regraph import graph_to_d3_json, get_node
from regraph.utils import attrs_to_json


nuggets_blueprint = Blueprint('nuggets', __name__, template_folder='templates')


@nuggets_blueprint.route("/corpus/<corpus_id>/nugget/<nugget_id>")
def corpus_nugget_view(corpus_id, nugget_id):
    """Handle nugget view."""
    return("Lets see the nugget")


@nuggets_blueprint.route("/model/<model_id>/nugget/<nugget_id>")
def model_nugget_view(corpus_id, nugget_id):
    """Handle nugget view."""
    return("Lets see the nugget")


@nuggets_blueprint.route("/corpus/<corpus_id>/nuggets")
def get_corpus_nuggets(corpus_id):
    corpus = get_corpus(corpus_id)
    nuggets = {}
    for nugget in corpus.nuggets():
            nuggets[nugget] = (
                corpus.get_nugget_desc(nugget),
                corpus.get_nugget_type(nugget)
            )
    data = {}
    data["nuggets"] = nuggets
    return jsonify(data), 200


@nuggets_blueprint.route("/model/<model_id>/nuggets")
def get_model_nuggets(model_id):
    model = get_model(model_id)
    nuggets = {}
    for nugget in model.nuggets():
            nuggets[nugget] = (
                model.get_nugget_desc(nugget),
                model.get_nugget_type(nugget)
            )
    data = {}
    data["nuggets"] = nuggets
    return jsonify(data), 200


def get_nugget(knowledge_obj, nugget_id, instantiated=False):
    data = {}
    data["nuggetJson"] = graph_to_d3_json(knowledge_obj.nugget[nugget_id])
    data["nuggetType"] = knowledge_obj.get_nugget_type(nugget_id)
    data["metaTyping"] = {
        k: knowledge_obj.get_action_graph_typing()[v]
        for k, v in knowledge_obj.get_nugget_typing(nugget_id).items()
    }
    data["agTyping"] = {}
    ag_typing = knowledge_obj.get_nugget_typing(nugget_id)

    for k, v in ag_typing.items():
        attrs = attrs_to_json(get_node(knowledge_obj.action_graph, v))
        data["agTyping"][k] = [v, attrs]
    data["semantics"] = {}
    # try:
    if not instantiated:
        semantic_nugget_rels = knowledge_obj.get_nugget_semantic_rels(nugget_id)
        print("\n\n", semantic_nugget_rels)
        for k, v in semantic_nugget_rels.items():
            data["semantics"][k] = {
                kk: list(vv)
                for kk, vv in v.items()
            }
    # except:
    #     pass

    data["templateRelation"] = {}

    for k, v in knowledge_obj.get_nugget_template_rel(nugget_id).items():
        for vv in v:
            data["templateRelation"][vv] = k
    return jsonify(data), 200


@nuggets_blueprint.route("/corpus/<corpus_id>/raw-nugget/<nugget_id>")
def corpus_nugget_json(corpus_id, nugget_id):
    corpus = get_corpus(corpus_id)
    return get_nugget(corpus, nugget_id)


@nuggets_blueprint.route("/model/<model_id>/raw-nugget/<nugget_id>")
def model_nugget_json(model_id, nugget_id):
    model = get_model(model_id)
    return get_nugget(model, nugget_id, instantiated=True)


@nuggets_blueprint.route("/corpus/<corpus_id>/raw-nugget/<nugget_id>")
def raw_nugget_json(corpus_id, nugget_id):
    corpus = get_corpus(corpus_id)

    data = {}
    data["nuggetJson"] = graph_to_d3_json(corpus.nugget[nugget_id])
    data["nuggetType"] = corpus.get_nugget_type(nugget_id)
    data["metaTyping"] = {
        k: corpus.get_action_graph_typing()[v]
        for k, v in corpus.get_nugget_typing(nugget_id).items()
    }
    data["agTyping"] = corpus.get_nugget_typing(nugget_id)

    data["templateRelation"] = {}
    for k, v in corpus.get_nugget_template_rel(nugget_id).items():
        for vv in v:
            data["templateRelation"][vv] = k
    return jsonify(data), 200


@nuggets_blueprint.route("/corpus/<corpus_id>/nugget/<nugget_id>/update-nugget-desc",
                         methods=["POST"])
@authenticate
def update_corpus_nugget(corpus_id, nugget_id):
    json_data = request.get_json()
    corpus = get_corpus(corpus_id)
    corpus.set_nugget_desc(nugget_id, json_data["desc"])
    response = json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}

    return response


# @nuggets_blueprint.route("/model/<model_id>/nugget/<nugget_id>/update-nugget-desc",
#                          methods=["POST"])
# @authenticate
# def update_model_nugget(model_id, nugget_id):
#     json_data = request.get_json()
#     model = get_model(model_id)
#     model.set_nugget_desc(nugget_id, json_data["desc"])
#     response = json.dumps(
#         {'success': True}), 200, {'ContentType': 'application/json'}

#     return response


@nuggets_blueprint.route("/corpus/<corpus_id>/nugget-table")
def nugget_table(corpus_id):
    """Generate a nugget table."""
    data = {}
    data["meta_data"] = dict()
    data["pairs"] = []

    corpus = get_corpus(corpus_id)

    # retreive all the genes from the action graph
    for g in corpus.genes():
        uniprotid = None
        hgnc_symbol = None
        node = corpus.get_ag_node(g)
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

    for nugget_id in corpus.nuggets():
        nugget = corpus.nugget[nugget_id]
        nugget_typing = corpus.get_nugget_typing(nugget_id)
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


@nuggets_blueprint.route("/corpus/<corpus_id>/nugget/<nugget_id>/update-node-attrs",
                         methods=["POST"])
@authenticate
def update_node_attrs(corpus_id, nugget_id):
    """Handle update of node attrs."""

    json_data = request.get_json()
    node_id = json_data["id"]
    node_attrs = json_data["attrs"]

    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:

        if nugget_id in corpus.nuggets() and\
           node_id in corpus.nugget[nugget_id].nodes():
            try:
                # Here I actually need to generate rewriting rule
                corpus.update_nugget_node_attr_from_json(
                    nugget_id, node_id, node_attrs)

                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                update_last_modified(corpus_id)
            except:
                pass
    return response


@nuggets_blueprint.route("/corpus/<corpus_id>/nugget/<nugget_id>/update-edge-attrs",
                         methods=["POST"])
@authenticate
def update_edge_attrs(corpus_id, nugget_id):
    """Handle update of node attrs."""

    json_data = request.get_json()
    source = json_data["source"]
    target = json_data["target"]
    node_attrs = json_data["attrs"]

    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:

        if (source, target) in corpus.action_graph.edges() and\
           nugget_id in corpus.nuggets():
            # try:
                # Here I actually need to generate rewriting rule
            corpus.update_nugget_edge_attr_from_json(
                nugget_id, source, target, node_attrs)

            response = json.dumps(
                {'success': True}), 200, {'ContentType': 'application/json'}
            update_last_modified(corpus_id)
            # except:
            #     pass
    return response


@nuggets_blueprint.route("/corpus/<corpus_id>/remove-nugget/<nugget_id>")
@authenticate
def remove_nugget_from_corpus(corpus_id, nugget_id):
    corpus = get_corpus(corpus_id)
    corpus.remove_nugget(nugget_id)
    return jsonify({"success": True}), 200


@nuggets_blueprint.route("/model/<model_id>/remove-nugget/<nugget_id>")
@authenticate
def remove_nugget_from_model(model_id, nugget_id):
    pass
