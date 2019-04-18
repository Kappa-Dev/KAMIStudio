from flask import current_app as app
from flask import (Blueprint, jsonify)
from kami.data_structures.definitions import NewDefinition

from regraph import graph_to_d3_json

from kamistudio.corpus.views import get_corpus


definitions_blueprint = Blueprint('definitions', __name__, template_folder='templates')


@definitions_blueprint.route("/corpus/<corpus_id>/raw-definition/<gene_id>")
def fetch_definition(corpus_id, gene_id):
    """Retreive raw definition graphs."""
    definition_json = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": gene_id
    })

    corpus = get_corpus(corpus_id)

    if corpus is not None and definition_json is not None:
        definition = NewDefinition.from_json(definition_json)
        print(definition)
        # protoform_graph, _, product_graphs = definition._generate_graphs(
        #     corpus.action_graph,
        #     corpus.get_action_graph_typing())
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
        print(data)

        return jsonify(data), 200
    return jsonify({"success": False}), 404


@definitions_blueprint.route("/corpus/<corpus_id>/variants/uniprot/<uniprot_id>")
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
def get_definitions(corpus_id):
    raw_defs = app.mongo.db.kami_new_definitions.find(
        {"corpus_id": corpus_id})

    definitions = {}
    for d in raw_defs:
        definitions[d["protoform"]] = list(d["products"].keys())

    data = {}
    data["definitions"] = definitions
    return jsonify(data), 200
