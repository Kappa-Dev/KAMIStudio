from flask import current_app as app
from flask import (Blueprint, jsonify)
from kami.data_structures.definitions import Definition

from regraph import graph_to_d3_json

from kamistudio.corpus.views import get_corpus


definitions_blueprint = Blueprint('definitions', __name__, template_folder='templates')


@definitions_blueprint.route("/corpus/<corpus_id>/raw-definition/<definition_id>")
def fetch_definition(corpus_id, definition_id):
    """Retreive raw definition graphs."""
    definition_json = app.mongo.db.kami_definitions.find_one({
        "corpus_id": corpus_id,
        "id": definition_id
    })

    corpus = get_corpus(corpus_id)

    if corpus is not None:
        definition = Definition.from_json(definition_json)
        protoform_graph, _, product_graphs = definition._generate_graphs(
            corpus.action_graph,
            corpus.get_action_graph_typing())

        data = {}
        data["protoform_graph"] = graph_to_d3_json(protoform_graph.graph)
        data["protoform_graph_meta_typing"] = protoform_graph.meta_typing
        data["product_graphs"] = {}
        data["product_graphs_meta_typing"] = {}
        for k, v in product_graphs.items():
            data["product_graphs"][k] = graph_to_d3_json(v.graph)
            data["product_graphs_meta_typing"][k] = v.meta_typing
        return jsonify(data), 200
    return jsonify({"success": False}), 404
