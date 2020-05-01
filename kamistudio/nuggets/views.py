"""."""
import json
from flask import Blueprint, jsonify, request

from kamistudio.utils import authenticate
from kamistudio.corpus.views import get_corpus, update_last_modified
from kamistudio.model.views import get_model

from regraph.utils import attrs_to_json


nuggets_blueprint = Blueprint(
    'nuggets', __name__, template_folder='templates',
    static_folder='static')


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
    data["nuggetJson"] = knowledge_obj.get_nugget(nugget_id).to_d3_json()

    data["nuggetType"] = knowledge_obj.get_nugget_type(nugget_id)
    data["metaTyping"] = {
        k: knowledge_obj.get_action_graph_typing()[v]
        for k, v in knowledge_obj.get_nugget_typing(nugget_id).items()
    }

    ag_typing = knowledge_obj.get_nugget_typing(nugget_id)
    data["agTyping"] = ag_typing

    data["agNodeAttrs"] = {}
    for v in ag_typing.values():
        data["agNodeAttrs"][v] = attrs_to_json(
            knowledge_obj.action_graph.get_node(v))

    data["agEdgeAttrs"] = []
    for s, t in knowledge_obj.get_nugget(nugget_id).edges():
        edge_data = {}
        edge_data["source"] = ag_typing[s]
        edge_data["target"] = ag_typing[t]
        edge_data["attrs"] = attrs_to_json(
            knowledge_obj.action_graph.get_edge(
                ag_typing[s],
                ag_typing[t]))
        data["agEdgeAttrs"].append(edge_data)

    data["semantics"] = {}
    # try:
    if not instantiated:
        semantic_nugget_rels = knowledge_obj.get_nugget_semantic_rels(
            nugget_id)
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
    data["nuggetJson"] = corpus.get_nugget(nugget_id).to_d3_json()
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


def get_gene_adjacency(kb):
    data = {}
    data["interactions"] = kb.get_protoform_pairwise_interactions()
    # Precompute labels for a geneset
    geneset = set()
    for k, v in data["interactions"].items():
        geneset.add(k)
        for kk in v.keys():
            geneset.add(kk)

    def generate_gene_label(node_id):
        label = kb.get_hgnc_symbol(node_id)
        if label is None:
            label = kb.get_uniprot(node_id)
        return label

    data["geneLabels"] = {
        g: generate_gene_label(g) for g in geneset
    }

    # normalize data to be JSON-serializable
    for k in data["interactions"].keys():
        for kk, vv in data["interactions"][k].items():
            new_vv = []
            for vvv in vv:
                new_vv.append(list(vvv))
            data["interactions"][k][kk] = new_vv
    return data


@nuggets_blueprint.route("/corpus/<corpus_id>/get-gene-adjacency",
                         methods=["GET"])
def get_corpus_gene_adjacency(corpus_id):
    """Generate a nugget table."""
    corpus = get_corpus(corpus_id)
    data = get_gene_adjacency(corpus)
    print(data)
    return jsonify(data), 200


@nuggets_blueprint.route("/model/<model_id>/get-gene-adjacency",
                         methods=["GET"])
def get_model_gene_adjacency(model_id):
    model = get_model(model_id)
    data = get_gene_adjacency(model)
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
           node_id in corpus.get_nugget(nugget_id).nodes():
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


@nuggets_blueprint.route("/corpus/<corpus_id>/get-action-nuggets/<action_id>")
def get_corpus_action_nuggets(corpus_id, action_id):
    corpus = get_corpus(corpus_id)
    nuggets = corpus.get_mechanism_nuggets(action_id)
    data = {}
    for n in nuggets:
        data[n] = (
            corpus.get_nugget_desc(n),
            corpus.get_nugget_type(n)
        )
    return jsonify(data), 200


@nuggets_blueprint.route("/model/<model_id>/get-action-nuggets/<action_id>")
def get_model_action_nuggets(model_id, action_id):
    model = get_model(model_id)
    nuggets = model.get_mechanism_nuggets(action_id)
    data = {}
    for n in nuggets:
        data[n] = (
            model.get_nugget_desc(n),
            model.get_nugget_type(n)
        )
    return jsonify(data), 200
