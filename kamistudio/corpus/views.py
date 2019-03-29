"""Views of home blueprint."""
import datetime
import json
import os

from kami.data_structures.corpora import KamiCorpus
from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_file)
from flask import current_app as app

from regraph import graph_to_d3_json
from regraph.neo4j import Neo4jHierarchy

from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.definitions import Definition
from kami.aggregation.generators import generate_nugget

from kamistudio.corpus.form_parsing import(parse_interaction)


corpus_blueprint = Blueprint('corpus', __name__, template_folder='templates')


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


def updateLastModified(corpus_id):
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    corpus_json["last_modified"] = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")
    app.mongo.db.kami_corpora.update_one(
        {"_id": corpus_json["_id"]},
        {"$set": corpus_json},
        upsert=False)


def add_new_corpus(corpus_id, creation_time, last_modified, annotation):
    """Add new corpus to the db."""
    app.mongo.db.kami_corpora.insert_one({
        "id": corpus_id,
        "creation_time": creation_time,
        "last_modified": last_modified,
        "meta_data": annotation
    })


@corpus_blueprint.route("/corpus/<corpus_id>")
def corpus_view(corpus_id):
    """View corpus."""
    if app.neo4j_driver is None:
        return render_template(
            "neo4j_connection_failure.html",
            uri=app.config["NEO4J_URI"],
            user=app.config["NEO4J_USER"])
    if app.mongo.db is None:
        return render_template(
            "mongo_connection_failure.html",
            uri=app.config["MONGO_URI"])

    corpus = get_corpus(corpus_id)
    gene_adjacency = corpus.get_gene_pairwise_interactions()

    nuggets = {}
    if corpus is not None:

        for nugget in corpus.nuggets():
            nuggets[nugget] = (
                corpus.get_nugget_desc(nugget),
                corpus.get_nugget_type(nugget)
            )

        genes = {}
        for g in corpus.genes():
            genes[g] = corpus.get_gene_data(g)

        modifications = {}
        for m in corpus.modifications():
            modifications[m] = []

        bindings = {}
        for b in corpus.bindings():
            bindings[b] = []

        raw_defs = app.mongo.db.kami_definitions.find(
            {"corpus_id": corpus_id})

        definitions = {}
        for d in raw_defs:
            definitions[d["id"]] = [
                d["desc"], d["protoform"]["uniprotid"], d["product_names"]]

        return render_template("corpus.html",
                               kb_id=corpus_id,
                               kb=corpus,
                               nuggets=json.dumps(nuggets),
                               genes=json.dumps(genes),
                               gene_adjacency=json.dumps(gene_adjacency),
                               bindings=json.dumps(bindings),
                               modifications=json.dumps(modifications),
                               n_definitons=len(definitions),
                               definitions=json.dumps(definitions),
                               instantaited=False)
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/corpus/<corpus_id>/add-interaction",
                        methods=["GET", "POST"])
def add_interaction(corpus_id, add_agents=True,
                    anatomize=True, apply_semantics=True):
    """Handle interaction addition."""
    if request.method == 'GET':
        return render_template(
            "add_interaction.html",
            corpus_id=corpus_id)
    elif request.method == 'POST':
        corpus = get_corpus(corpus_id)
        interaction = parse_interaction(request.form)
        nugget, nugget_type = generate_nugget(
            corpus, interaction)
        corpus.add_nugget(
            nugget, nugget_type,
            add_agents=add_agents,
            anatomize=anatomize,
            apply_semantics=apply_semantics)
        return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/nugget-preview",
                        methods=["POST"])
def preview_nugget(corpus_id):
    """Generate nugget, store in the session and redirect to nugget preview."""
    interaction = parse_interaction(request.form)
    corpus = get_corpus(corpus_id)
    nugget, nugget_type = generate_nugget(corpus, interaction)

    session["nugget"] = nugget
    session["nugget_type"] = nugget_type
    session.modified = True

    template_relation = {}
    for k, v in nugget.template_rel.items():
        for vv in v:
            template_relation[vv] = k

    desc = interaction.desc
    rate = interaction.rate

    return render_template(
        "nugget_preview.html",
        new_nugget=True,
        corpus_id=corpus_id,
        corpus=corpus,
        nugget_graph=json.dumps(graph_to_d3_json(nugget.graph)),
        nugget_type=nugget_type,
        nugget_meta_typing=json.dumps(nugget.meta_typing),
        nugget_meta_typing_json=nugget.meta_typing,
        nugget_ag_typing=json.dumps(nugget.ag_typing),
        nugget_template_rel=json.dumps(template_relation),
        nugget_desc=desc,
        nugget_rate=rate,
        nugget_nodes=nugget.graph.nodes(),
        nugget_ag_typing_dict=nugget.ag_typing)


@corpus_blueprint.route("/corpus/<corpus_id>/add-generated-nugget",
                        methods=["GET"])
def add_nugget_from_session(corpus_id, add_agents=True,
                            anatomize=True, apply_semantics=True):
    """Add nugget stored in session to the corpus."""
    app.corpus[corpus_id].add_nugget(
        session["nugget"], session["nugget_type"],
        add_agents=add_agents,
        anatomize=anatomize,
        apply_semantics=apply_semantics)

    if "nugget" in session.keys():
        session.pop("nugget", None)
    if "nugget_type" in session.keys():
        session.pop("nugget_type", None)

    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/import-json-interactions",
                        methods=["GET"])
def import_json_interactions(corpus_id):
    """Handle import of json interactions."""
    with open('data/sh2_pY_interactions.json', 'w') as f:
        json.dump(json_rep, f)
    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/download", methods=["GET"])
def download_corpus(corpus_id):
    """Handle corpus download."""
    filename = corpus_id.replace(" ", "_") + ".json"
    corpus = get_corpus(corpus_id)
    if corpus:
        corpus.export_json(
            os.path.join(app.root_path, "uploads/" + filename))
        return send_file(
            os.path.join(app.root_path, "uploads/" + filename),
            as_attachment=True,
            mimetype='application/json',
            attachment_filename=filename)
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/corpus/<corpus_id>/update-ag-node-positioning",
                        methods=["POST"])
def update_ag_node_positioning(corpus_id):
    """Retrieve node positioning from post request."""
    json_data = request.get_json()
    # corpus = get_corpus(corpus_id)

    if "node_positioning" in json_data.keys() and\
       len(json_data["node_positioning"]) > 0:
        attrs = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
        if "node_positioning" in attrs.keys():
            position_dict = attrs["node_positioning"]
        else:
            position_dict = {}

        # update positions from json data in the request
        for k, v in json_data["node_positioning"].items():
            position_dict[k] = [v[0], v[1]]

        app.mongo.db.kami_corpora.update(
            {'id': corpus_id},
            {'$set': {'node_positioning': position_dict}})
    updateLastModified(corpus_id)
    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}


@corpus_blueprint.route("/corpus/<corpus_id>/delete")
def delete_corpus(corpus_id):
    """Handle removal of the corpus."""
    corpus = get_corpus(corpus_id)

    if corpus is not None:
        # connect to db
        h = Neo4jHierarchy(driver=app.neo4j_driver)
        # remove nuggets
        for n in corpus.nuggets():
            h.remove_graph(n)
        # remove the ag
        h.remove_graph(corpus._action_graph_id)
        # drop from mongo db
        app.mongo.db.kami_corpora.remove({"id": corpus_id})
        return redirect(url_for("home.index"))
    else:
        return render_template("corpus_not_found.html", corpus_id=corpus_id)


@corpus_blueprint.route("/corpus/<corpus_id>/update-node-attrs",
                        methods=["POST"])
def update_node_attrs(corpus_id):
    """Handle update of node attrs."""
    json_data = request.get_json()
    node_id = json_data["id"]
    node_attrs = json_data["attrs"]
    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:
        if node_id in corpus.action_graph.nodes():
            try:
                corpus.action_graph.set_node_attrs_from_json(node_id, node_attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                updateLastModified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/corpus/<corpus_id>/update-edge-attrs",
                        methods=["POST"])
def update_edge_attrs(corpus_id):
    """Handle update of node attrs."""
    json_data = request.get_json()
    source = json_data["source"]
    target = json_data["target"]
    edge_attrs = json_data["attrs"]
    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:
        if (source, target) in corpus.action_graph.edges():
            try:
                corpus.action_graph.set_edge_attrs_from_json(source, target, edge_attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                updateLastModified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/corpus/<corpus_id>/update-meta-data",
                        methods=["POST"])
def update_meta_data(corpus_id):
    """Handle update of edge attrs."""
    json_data = request.get_json()

    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    for k in json_data.keys():
        corpus_json["meta_data"][k] = json_data[k]

    app.mongo.db.kami_corpora.update_one(
        {"_id": corpus_json["_id"]},
        {"$set": corpus_json},
        upsert=False)

    response = json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}

    return response
