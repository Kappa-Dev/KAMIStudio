"""Set of utility functions for the corpus blueprint."""
import os
import datetime
import json

from flask import jsonify, redirect, url_for
from flask import current_app as app

from regraph.utils import attrs_to_json

from kami.data_structures.corpora import KamiCorpus
from kami.data_structures.interactions import Interaction
from kami.data_structures.annotations import CorpusAnnotation


def _generate_unique_model_id(corpus_id, model_name):
    name = corpus_id + "_model_" + model_name
    name = name.replace(
        " ", "_").replace(",", "_").replace("/", "_")
    existing_models = [
        el["id"] for el in app.mongo.db.kami_models.find(
            {}, {"id": 1, "_id": 0})]
    if name not in existing_models:
        return name
    else:
        i = 1
        new_name = name + "_{}".format(i)
        while new_name in existing_models:
            i += 1
            new_name = name + "_{}".format(i)
        return new_name


def _generate_unique_variant_name(record, name):
    if name not in record.keys():
        return name
    else:
        i = 1
        new_name = name + "_{}".format(i)
        while new_name in record.keys():
            i += 1
            new_name = name + "_{}".format(i)
        return new_name


def get_corpus(corpus_id):
    """Retreive corpus from the db."""
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    if corpus_json and app.neo4j_driver:
        return KamiCorpus(
            corpus_id,
            annotation=CorpusAnnotation.from_json(corpus_json["meta_data"]),
            creation_time=corpus_json["creation_time"],
            last_modified=corpus_json["last_modified"],
            backend="neo4j",
            driver=app.neo4j_driver,
        )


def update_last_modified(corpus_id):
    """Update the last modified field."""
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    corpus_json["last_modified"] = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")
    app.mongo.db.kami_corpora.update_one(
        {"_id": corpus_json["_id"]},
        {"$set": corpus_json},
        upsert=False)


def add_new_corpus(corpus_id, creation_time, last_modified,
                   annotation, ag_node_positions=None):
    """Add new corpus to the db."""
    d = {
        "id": corpus_id,
        "creation_time": creation_time,
        "last_modified": last_modified,
        "meta_data": annotation
    }
    if ag_node_positions:
        d["node_positioning"] = ag_node_positions
    app.mongo.db.kami_corpora.insert_one(d)


def imported_interactions(filename, corpus_id):
    """Internal handler of already imported interactions."""
    path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(path_to_file):
        # try:
        corpus = get_corpus(corpus_id)
        with open(path_to_file, "r+") as f:
            json_data = json.loads(f.read())
            for i, el in enumerate(json_data):
                corpus.add_interaction(Interaction.from_json(el))
        update_last_modified(corpus_id)
        corpus.print_revision_history()
        # except:
        # return render_template("500.html")
    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


def get_action_graph(knowledge_obj, json_repr, attrs):
    """Retreive action graph from the knowledge object."""
    # load positions of AG nodes if available
    if "node_positioning" in json_repr.keys():
        node_positioning = json_repr["node_positioning"]
    else:
        node_positioning = {}

    data = {}

    if (knowledge_obj.action_graph):
        data["actionGraph"] = knowledge_obj.action_graph.to_d3_json(
            attrs)
        try:
            data["connectedComponents"] =\
                knowledge_obj.action_graph.find_connected_components()
        except:
            data["connectedComponents"] = {}
        data["semantics"] = {
            k: list(v)
            for k, v in knowledge_obj._hierarchy.get_relation(
                knowledge_obj._action_graph_id, "semantic_action_graph").items()
        }
    else:
        data["actionGraph"] = {"links": [], "nodes": []}
        data["connectedComponents"] = {}
        data["semantics"] = {}

    data["metaTyping"] = knowledge_obj.get_action_graph_typing()
    data["nodePosition"] = node_positioning
    return jsonify(data), 200


def merge_ag_nodes(kb, data):
    """Merge nodes of the action graph."""
    kb.merge_ag_nodes(data["nodes"])


def update_protein_definition(corpus_id, uniprot, name, product):
    """Add new protein def."""
    if name is None:
        name = "no_name"
    if product["desc"] is None:
        product["desc"] = ""

    existing_def = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": uniprot
    })

    if existing_def:
        new_name = _generate_unique_variant_name(existing_def, name)
        existing_def["products"][new_name] = product
        app.mongo.db.kami_new_definitions.update_one(
            {"_id": existing_def["_id"]},
            {"$set": existing_def},
            upsert=False)
    else:
        d = {
            "corpus_id": corpus_id,
            "protoform": uniprot,
            "products": {
                name: product
            }
        }
        app.mongo.db.kami_new_definitions.insert_one(d)


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