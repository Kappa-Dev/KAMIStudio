"""Views of corpus blueprint."""
import datetime
import json
import os

from kami.data_structures.corpora import KamiCorpus
from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_file)
from flask import current_app as app, jsonify

from regraph import graph_to_d3_json
from regraph.neo4j import Neo4jHierarchy

from werkzeug.utils import secure_filename

from kami.data_structures.interactions import Interaction
from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.definitions import Definition
from kami.aggregation.generators import generate_nugget

from kamistudio.utils import authenticate
from kamistudio.corpus.form_parsing import(parse_interaction)


corpus_blueprint = Blueprint('corpus', __name__, template_folder='templates')


def _generate_unique_model_id(corpus_id):
    name = corpus_id + "_model"
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
                d["protoform"]["uniprotid"], list(d["products"].keys())]

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
                               instantaited=False,
                               readonly=app.config["READ_ONLY"])
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
            corpus_id=corpus_id,
            readonly=app.config["READ_ONLY"])
    elif request.method == 'POST':
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            corpus = get_corpus(corpus_id)
            interaction = parse_interaction(request.form)
            corpus.add_interaction(interaction)
            return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/nugget-preview",
                        methods=["POST"])
def preview_nugget(corpus_id):
    """Generate nugget, store in the session and redirect to nugget preview."""
    interaction = parse_interaction(request.form)
    corpus = get_corpus(corpus_id)
    (nugget, nugget_type, template_rels, des) = generate_nugget(
        corpus, interaction, app.config["READ_ONLY"])

    session["nugget"] = nugget
    session["nugget_type"] = nugget_type
    session["template_rels"] = template_rels
    session.modified = True

    template_relation = {}
    template_rel = {}
    if nugget_type == "mod" and "mod_template" in template_rels:
        template_rel = template_rels["mod_template"]
    elif nugget_type == "bnd" and "bnd_template" in template_rels:
        template_rel = template_rels["bnd_template"]
    for k, v in template_rel.items():
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
        nugget_ag_typing=json.dumps(nugget.reference_typing),
        nugget_template_rel=json.dumps(template_relation),
        nugget_desc=desc,
        nugget_rate=rate,
        nugget_nodes=nugget.graph.nodes(),
        nugget_ag_typing_dict=nugget.reference_typing,
        readonly=app.config["READ_ONLY"])


@corpus_blueprint.route("/corpus/<corpus_id>/instantiate",
                        methods=["GET", "POST"])
def instantiate(corpus_id):
    """Handle corpus instantiation."""
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        return render_template(
            "instantiation.html",
            corpus=corpus,
            readonly=app.config["READ_ONLY"])
    else:
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            json_data = request.get_json()
            corpus = get_corpus(corpus_id)

            if corpus:
                model_name = json_data["name"]
                model_desc = json_data["desc"]

                definitions = []
                for element in json_data["choices"]:
                    uniprotid = element["uniprotid"]
                    definition_json = app.mongo.db.kami_definitions.find_one({
                        "corpus_id": corpus_id,
                        "protoform.uniprotid": uniprotid
                    })
                    if definition_json is not None:
                        selected_products = element["selectedVariants"]
                        new_def = {
                            "id": definition_json["id"],
                            "corpus_id": definition_json["corpus_id"],
                            "protoform": definition_json["protoform"],
                            "products": {}
                        }
                        for p in selected_products:
                            new_def["products"][p] = definition_json["products"][p]
                        definitions.append(Definition.from_json(new_def))
                model_id = _generate_unique_model_id(corpus._id)
                corpus.instantiate(
                    model_id,
                    definitions,
                    annotation=CorpusAnnotation.from_json({
                        "name": model_name,
                        "desc": model_desc,
                        "organism": corpus.annotation.organism
                    })
                )
                return redirect(url_for('model.model_view', model_id=model_id))


@corpus_blueprint.route("/corpus/<corpus_id>/add-generated-nugget",
                        methods=["GET"])
@authenticate
def add_nugget_from_session(corpus_id, add_agents=True,
                            anatomize=True, apply_semantics=True):
    """Add nugget stored in session to the corpus."""
    corpus = get_corpus(corpus_id)
    corpus.add_nugget(
        session["nugget"], session["nugget_type"],
        session["template_rels"],
        add_agents=add_agents,
        anatomize=anatomize,
        apply_semantics=apply_semantics)

    if "nugget" in session.keys():
        session.pop("nugget", None)
    if "nugget_type" in session.keys():
        session.pop("nugget_type", None)

    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/import-json-interactions",
                        methods=["GET", "POST"])
@authenticate
def import_json_interactions(corpus_id):
    """Handle import of json interactions."""
    if request.method == "GET":
        return render_template('import_interactions.html',
                               corpus_id=corpus_id)
    else:
        if 'file' not in request.files:
            raise ValueError('No file part')
            return redirect(request.url)
        file = request.files['file']
        # if user does not select file, browser also
        # submit a empty part without filename
        if file.filename == '':
            raise ValueError('No selected file')
            return redirect(request.url)
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return imported_interactions(filename, corpus_id)


def imported_interactions(filename, corpus_id):
    """Internal handler of already imported interactions."""
    path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(path_to_file):
        # try:
        corpus = get_corpus(corpus_id)
        # corpus.load_interactions_from_json(path_to_file)
        with open(path_to_file, "r+") as f:
            json_data = json.loads(f.read())
            for i, el in enumerate(json_data):
                print("Adding interaction", i + 1)
                corpus.add_interaction(Interaction.from_json(el))
        #     try:
        #         interactions = [
        #             el for el in json_data
        #         ]
        updateLastModified(corpus_id)
        # except:
            # return render_template("500.html")
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
@authenticate
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
@authenticate
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
@authenticate
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
@authenticate
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
@authenticate
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


@corpus_blueprint.route("/corpus/<corpus_id>/genes")
def get_genes(corpus_id):
    """Handle get genes request."""
    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:
        gene_nodes = corpus.genes()
        data = {
            "genes": []
        }
        for g in gene_nodes:
            uniprotid, hgnc, syn, _ = corpus.get_gene_data(g)
            data["genes"].append([uniprotid, hgnc, syn])
        response = jsonify(data), 200
    return response
