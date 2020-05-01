from flask import current_app as app
from flask import (Blueprint, jsonify)

from regraph import graph_to_d3_json, get_node
from regraph.utils import attrs_to_json

from kami.data_structures.definitions import Definition

from kamistudio.corpus.views import get_corpus
from kamistudio.utils import authenticate, check_dbs


definitions_blueprint = Blueprint(
    'definitions', __name__,
    template_folder='templates',
    static_folder='static')


@definitions_blueprint.route("/corpus/<corpus_id>/raw-definition/<gene_id>")
@check_dbs
def fetch_definition(corpus_id, gene_id):
    """Retreive raw definition graphs."""
    definition_json = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": gene_id
    })

    corpus = get_corpus(corpus_id)

    if corpus is not None and definition_json is not None:
        definition = Definition.from_json(definition_json)

        protoform_graph, gene_node = definition._generate_protoform_graph(
            corpus.action_graph, corpus.get_action_graph_typing())
        product_graphs = {}
        for el in definition.products:
            product_graphs[el.name] = el.generate_graph(
                protoform_graph, gene_node)

        data = {}
        wild_type_name = None
        for k, v in definition_json["products"].items():
            if v["wild_type"]:
                wild_type_name = k
        data["wild_type"] = wild_type_name
        data["protoform_graph"] = graph_to_d3_json(protoform_graph.graph)
        data["protoform_graph_meta_typing"] = protoform_graph.meta_typing
        data["product_graphs"] = {}
        data["product_graphs_meta_typing"] = {}
        for k, v in product_graphs.items():
            data["product_graphs"][k] = graph_to_d3_json(v.graph)
            data["product_graphs_meta_typing"][k] = v.meta_typing

        return jsonify(data), 200
    return jsonify({"success": False}), 404


@definitions_blueprint.route("/corpus/<corpus_id>/variants/uniprot/<uniprot_id>")
@check_dbs
def fetch_variant_by_uniprot(corpus_id, uniprot_id):
    """Retreive raw variants by uniprot id."""
    definition_json = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": uniprot_id
    })
    if definition_json:
        data = {}
        data["products"] = {
            k: [v["desc"], v["wild_type"]]
            for k, v in definition_json["products"].items()
        }
        return jsonify(data), 200
    return jsonify({"success": False}), 404


@definitions_blueprint.route("/corpus/<corpus_id>/definitions")
@check_dbs
def get_definitions(corpus_id):
    raw_defs = app.mongo.db.kami_new_definitions.find(
        {"corpus_id": corpus_id})
    corpus = get_corpus(corpus_id)

    definitions = {}
    for d in raw_defs:
        node_attrs = get_node(
            corpus.action_graph,
            corpus.get_protoform_by_uniprot(d["protoform"]))

        definitions[d["protoform"]] = {}
        definitions[d["protoform"]]["attrs"] = attrs_to_json(
            node_attrs)
        definitions[d["protoform"]]["variants"] = [
            [k, v["desc"], v["wild_type"]]
            for k, v in d["products"].items()
        ]
    return jsonify(definitions), 200


@definitions_blueprint.route("/corpus/<corpus_id>/remove-variant/<definition_id>/<variant_id>",
                             methods=["GET"])
@authenticate
@check_dbs
def remove_variant(corpus_id, definition_id, variant_id):
    definition_json = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": definition_id
    })
    if variant_id in definition_json["products"]:
        del definition_json["products"][variant_id]
        app.mongo.db.kami_new_definitions.update_one(
            {"_id": definition_json["_id"]},
            {"$set": definition_json})
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False}), 200
