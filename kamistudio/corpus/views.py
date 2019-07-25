"""Views of corpus blueprint."""
import datetime
import json
import os
import warnings

from kami.data_structures.corpora import KamiCorpus
from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_file)
from flask import current_app as app, jsonify

from regraph import graph_to_d3_json
from regraph.primitives import (attrs_to_json,
                                get_node,
                                get_edge,
                                attrs_from_json,
                                set_node_attrs)
from regraph.neo4j import Neo4jHierarchy

from werkzeug.utils import secure_filename

import kami.data_structures.entities as entities
from kami.data_structures.interactions import Interaction
from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.definitions import NewDefinition
from kami.aggregation.generators import generate_nugget
from kami.aggregation.identifiers import EntityIdentifier
from kami.exceptions import KamiError

from kamistudio.utils import authenticate, check_dbs
from kamistudio.corpus.form_parsing import(parse_interaction)
from kamistudio.model.views import add_new_model


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


def add_new_corpus(corpus_id, creation_time, last_modified, annotation):
    """Add new corpus to the db."""
    app.mongo.db.kami_corpora.insert_one({
        "id": corpus_id,
        "creation_time": creation_time,
        "last_modified": last_modified,
        "meta_data": annotation
    })


@corpus_blueprint.route("/corpus/<corpus_id>")
@check_dbs
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
    try:
        corpus = get_corpus(corpus_id)
    except:
        return render_template(
            "neo4j_connection_failure.html",
            uri=app.config["NEO4J_URI"],
            user=app.config["NEO4J_USER"])

    if corpus is not None:

        n_nuggets = len(corpus.nuggets())

        genes = {}
        for g in corpus.genes():
            genes[g] = []

        modifications = {}
        for m in corpus.modifications():
            modifications[m] = []

        bindings = {}
        for b in corpus.bindings():
            bindings[b] = []

        raw_defs = app.mongo.db.kami_new_definitions.find(
            {"corpus_id": corpus_id})

        n_defs = len(list(raw_defs))

        return render_template("corpus.html",
                               kb_id=corpus_id,
                               kb=corpus,
                               n_nuggets=n_nuggets,
                               n_definitons=n_defs,
                               genes=json.dumps(genes),
                               bindings=json.dumps(bindings),
                               modifications=json.dumps(modifications),
                               instantaited=False,
                               readonly=app.config["READ_ONLY"])
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/corpus/<corpus_id>/add-interaction",
                        methods=["GET", "POST"])
@check_dbs
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
            update_last_modified(corpus_id)
            return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/nugget-preview",
                        methods=["POST"])
@check_dbs
def preview_nugget(corpus_id):
    """Generate nugget, store in the session and redirect to nugget preview."""
    interaction = parse_interaction(request.form)
    corpus = get_corpus(corpus_id)
    try:
        (nugget, nugget_type, template_rels, desc) = generate_nugget(
            corpus, interaction, app.config["READ_ONLY"])

        session["nugget"] = nugget
        session["nugget_desc"] = desc
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

        reference_genes = {}
        for n in nugget.graph.nodes():
            if nugget.meta_typing[n] == "mod":
                reference_genes[n] = []
                if "enzyme" in template_relation and\
                   template_relation["enzyme"] in nugget.reference_typing:
                    reference_genes[n].append(
                        nugget.reference_typing[template_relation["enzyme"]])
                nugget_gene = template_relation["substrate"]
                if nugget_gene and nugget_gene in nugget.reference_typing:
                    reference_genes[n].append(
                        nugget.reference_typing[nugget_gene])

            elif nugget.meta_typing[n] == "bnd":
                reference_genes[n] = []
                nugget_gene = template_relation["left_partner"]
                if nugget_gene and nugget_gene in nugget.reference_typing:
                    reference_genes[n].append(
                        nugget.reference_typing[nugget_gene])
                nugget_gene = template_relation["right_partner"]
                if nugget_gene and nugget_gene in nugget.reference_typing:
                    reference_genes[n].append(
                        nugget.reference_typing[nugget_gene])
            else:
                identifier = EntityIdentifier(nugget.graph, nugget.meta_typing)
                nugget_gene = identifier.get_gene_of(n)
                if nugget_gene and nugget_gene in nugget.reference_typing:
                    reference_genes[n] = [
                        nugget.reference_typing[nugget_gene]
                    ]
                else:
                    reference_genes[n] = []

        ag_node_attrs = {}
        for v in nugget.reference_typing.values():
            attrs = attrs_to_json(get_node(corpus.action_graph, v))
            ag_node_attrs[v] = attrs

        ag_edge_attrs = []
        for s, t in nugget.edges():
            if s in nugget.reference_typing and\
               t in nugget.reference_typing:
                edge_data = {}
                edge_data["source"] = nugget.reference_typing[s]
                edge_data["target"] = nugget.reference_typing[t]
                edge_data["attrs"] = attrs_to_json(
                    get_edge(corpus.action_graph,
                             nugget.reference_typing[s],
                             nugget.reference_typing[t]))
                ag_edge_attrs.append(edge_data)

        desc = desc if desc is not None else ""

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
            ag_node_attrs=json.dumps(ag_node_attrs),
            ag_edge_attrs=json.dumps(ag_edge_attrs),
            nugget_template_rel=json.dumps(template_relation),
            nugget_desc=desc,
            nugget_rate=rate,
            reference_genes=json.dumps(reference_genes),
            nugget_nodes=nugget.graph.nodes(),
            readonly=app.config["READ_ONLY"])
    except KamiError:
        return jsonify({}), 200


@corpus_blueprint.route("/corpus/<corpus_id>/instantiate",
                        methods=["GET", "POST"])
@check_dbs
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

                default_bnd_rate = None
                default_brk_rate = None
                default_mod_rate = None
                if "default_bnd_rate" in json_data:
                    default_bnd_rate = json_data["default_bnd_rate"]
                if "default_brk_rate" in json_data:
                    default_brk_rate = json_data["default_brk_rate"]
                if "default_mod_rate" in json_data:
                    default_mod_rate = json_data["default_mod_rate"]

                definitions = []
                definition_ids = []
                for element in json_data["choices"]:
                    uniprotid = element["uniprotid"]
                    definition_json = app.mongo.db.kami_new_definitions.find_one({
                        "corpus_id": corpus_id,
                        "protoform": uniprotid
                    })
                    if definition_json is not None:
                        # definition_ids.append([definition_json["id"]])
                        selected_products = element["selectedVariants"]
                        new_def = {
                            "corpus_id": definition_json["corpus_id"],
                            "protoform": definition_json["protoform"],
                            "products": {}
                        }
                        for p in selected_products:
                            new_def["products"][p] = definition_json["products"][p]
                        definitions.append(NewDefinition.from_json(new_def))

                model_id = _generate_unique_model_id(corpus._id)
                annotation = {
                    "name": model_name,
                    "desc": model_desc,
                    "organism": corpus.annotation.organism
                }
                model = corpus.instantiate(
                    model_id,
                    definitions,
                    annotation=CorpusAnnotation.from_json(annotation),
                    default_bnd_rate=default_bnd_rate,
                    default_brk_rate=default_brk_rate,
                    default_mod_rate=default_mod_rate
                )
                add_new_model(model_id, model.creation_time,
                              model.last_modified, annotation,
                              corpus_id=corpus._id,
                              definitions=definition_ids,
                              seed_genes=[],
                              default_bnd_rate=default_bnd_rate,
                              default_brk_rate=default_brk_rate,
                              default_mod_rate=default_mod_rate)
                data = {
                    "redirect": url_for('model.model_view', model_id=model_id)
                }
                return jsonify(data), 200


@corpus_blueprint.route("/corpus/<corpus_id>/add-generated-nugget",
                        methods=["POST"])
@check_dbs
@authenticate
def add_nugget_from_session(corpus_id, add_agents=True,
                            anatomize=True, apply_semantics=True):
    """Add nugget stored in session to the corpus."""
    json_data = request.get_json()

    corpus = get_corpus(corpus_id)
    if "nugget" not in session:
        return render_template("session_expired.html")

    # Apply the update of description
    if "nugget_desc" in json_data["updatedNuggetInfo"]:
        session["nugget_desc"] = json_data["updatedNuggetInfo"]["nugget_desc"][0]

    # Apply the update of meta-data update
    for k, v in json_data["updatedNuggetMetaData"].items():
        set_node_attrs(session["nugget"].graph, k, v, update=False)

    # Apply the update of reference nodes
    for k, v in json_data["updatedReferenceElements"].items():
        if v is not None:
            session["nugget"].reference_typing[k] = v

    corpus.add_nugget(
        session["nugget"], session["nugget_type"],
        session["template_rels"],
        desc=session["nugget_desc"],
        add_agents=add_agents,
        anatomize=anatomize,
        apply_semantics=apply_semantics)

    if "nugget" in session.keys():
        session.pop("nugget", None)
    if "nugget_type" in session.keys():
        session.pop("nugget_type", None)

    data = {
        "redirect": url_for('corpus.corpus_view', corpus_id=corpus_id)
    }
    return jsonify(data), 200


@corpus_blueprint.route("/corpus/<corpus_id>/import-json-interactions",
                        methods=["GET", "POST"])
@check_dbs
@authenticate
def import_json_interactions(corpus_id):
    """Handle import of json interactions."""
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        return render_template('import_interactions.html',
                               corpus_id=corpus_id,
                               corpus_name=corpus.annotation.name)
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
                corpus.add_interaction(Interaction.from_json(el))
        #     try:
        #         interactions = [
        #             el for el in json_data
        #         ]
        update_last_modified(corpus_id)
        # except:
            # return render_template("500.html")
    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/corpus/<corpus_id>/download", methods=["GET"])
@check_dbs
def download_corpus(corpus_id):
    """Handle corpus download."""
    filename = corpus_id.replace(" ", "_") + ".json"
    corpus = get_corpus(corpus_id)
    if corpus:
        corpus.export_json(
            os.path.join(app.config["UPLOAD_FOLDER"], filename))
        return send_file(
            os.path.join(app.config["UPLOAD_FOLDER"], filename),
            as_attachment=True,
            mimetype='application/json',
            attachment_filename=filename)
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/corpus/<corpus_id>/update-ag-node-positioning",
                        methods=["POST"])
@authenticate
@check_dbs
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
    update_last_modified(corpus_id)
    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}


@corpus_blueprint.route("/corpus/<corpus_id>/delete")
@authenticate
@check_dbs
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
@check_dbs
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
                update_last_modified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/corpus/<corpus_id>/update-edge-attrs",
                        methods=["POST"])
@authenticate
@check_dbs
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
                update_last_modified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/corpus/<corpus_id>/update-meta-data",
                        methods=["POST"])
@authenticate
@check_dbs
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


@corpus_blueprint.route("/corpus/<corpus_id>/add-variant/<gene_node_id>",
                        methods=["GET", "POST"])
@check_dbs
def add_variant(corpus_id, gene_node_id):
    """Handle addition of protein variants."""
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        graph = graph_to_d3_json(
            corpus.action_graph,
            nodes=corpus.subcomponent_nodes(gene_node_id))
        ag_typing = corpus.get_action_graph_typing()
        meta_typing = {
            n["id"]: ag_typing[n["id"]] for n in graph["nodes"]
        }
        try:
            canonical_sequence = corpus.get_canonical_sequence(
                gene_node_id)
        except:
            canonical_sequence = None
        return render_template(
            "add_variant.html",
            corpus=corpus,
            graph_repr=json.dumps(graph),
            meta_typing_repr=json.dumps(meta_typing),
            canonical_sequence=canonical_sequence,
            gene_id=gene_node_id,
            readonly=app.config["READ_ONLY"])
    else:
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            json_data = request.get_json()

            variant_name = json_data["variant_name"]
            desc = json_data["desc"]
            wt = json_data["wt"]
            raw_removed_components = json_data["removedComponents"]
            raw_selected_aa = json_data["selectedAA"]

            # Create a variant record
            corpus = get_corpus(corpus_id)
            gene_uniprot = corpus.get_uniprot(gene_node_id)

            components = {
                "regions": [],
                "sites": [],
                "residues": [],
                "states": []
            }

            # TODO: think about removal of states
            for [c_id, c, c_type] in raw_removed_components:
                attrs = {k: v["data"] for k, v in c.items()}
                if c_type == "region":
                    components["regions"].append(attrs)
                elif c_type == "site":
                    components["sites"].append(attrs)
                elif c_type == "residue":
                    loc = corpus.get_residue_location(c_id)
                    if loc is not None:
                        attrs["loc"] = loc
                    components["residues"].append(attrs)

            residues = []
            for [c_id, c, aa] in raw_selected_aa:
                attrs = {k: v["data"] for k, v in c.items()}
                loc = corpus.get_residue_location(c_id)
                if loc is not None:
                    attrs["loc"] = loc
                attrs["aa"] = aa
                residues.append(attrs)

            product = {
                "desc": desc,
                "wild_type": wt,
                "removed_components": components,
                "residues": residues
            }

            update_protein_definition(
                corpus_id, gene_uniprot, variant_name, product)

            data = {
                "redirect": url_for('corpus.corpus_view', corpus_id=corpus_id)
            }
            return jsonify(data), 200


@corpus_blueprint.route("/fetch-reference-candidates/<corpus_id>/<element_type>",
                        methods=["POST"])
def get_reference_candidates(corpus_id, element_type):
    """Fetch candidates for the reference node."""
    json_data = request.get_json()

    reference_genes = json_data["genes"]

    original_ref_el = json_data["originalRefElement"]

    data = {
        "candidates": {}
    }

    corpus = get_corpus(corpus_id)

    def format_gene_data(attrs):
        uniprot = list(attrs["uniprotid"])[0]
        synonyms = []
        if "hgnc_symbol" in attrs:
            synonyms.append(list(attrs["hgnc_symbol"])[0])
        return "{} ({})".format(uniprot, ", ".join(synonyms))

    def format_fragment_data(node_attrs, edge_attrs):
        data = []
        if "name" in node_attrs:
            data += list(node_attrs["name"])
        if "interproid" in node_attrs:
            data += list(node_attrs["interproid"])
        if "start" in edge_attrs and "end" in edge_attrs:
            data.append("interval {}-{}".format(
                list(edge_attrs["start"])[0],
                list(edge_attrs["end"])[0]))
        if "order" in edge_attrs:
            data.append(
                "order {}".format(list(edge_attrs["order"])[0]))
        return ", ".join(data)

    for gene in reference_genes:
        if element_type == "mod":
            candidates = corpus.get_attached_mod(gene, False, True)
            for c in candidates:
                if c != original_ref_el:
                    enzymes = corpus.get_enzymes_of_mod(c)
                    substrates = corpus.get_substrates_of_mod(c)
                    node_attrs = get_node(corpus.action_graph, c)
                    data["candidates"][c] = (
                        "Enzymes: {}, substrates: {}".format(
                            " / ".join(
                                format_gene_data(
                                    get_node(corpus.action_graph, p))
                                for p in enzymes),
                            " / ".join(
                                format_gene_data(
                                    get_node(corpus.action_graph, p))
                                for p in substrates)),
                        attrs_to_json(node_attrs)
                    )
        elif element_type == "bnd":
            candidates = corpus.get_attached_bnd(gene, False)
            print("----> ", gene, candidates)
            for c in candidates:
                if c != original_ref_el:
                    node_attrs = get_node(corpus.action_graph, c)
                    partners = corpus.get_genes_of_bnd(c)
                    data["candidates"][c] = (
                        "Bindind partners: " + " / ".join(
                            format_gene_data(
                                get_node(corpus.action_graph, p))
                            for p in partners),
                        attrs_to_json(node_attrs)
                    )
        else:
            candidates = corpus.ag_predecessors_of_type(
                gene, element_type)
            for c in candidates:
                if c != original_ref_el:
                    node_attrs = get_node(corpus.action_graph, c)
                    edge_attrs = get_edge(corpus.action_graph, c, gene)
                    data["candidates"][c] = (
                        format_fragment_data(node_attrs, edge_attrs),
                        attrs_to_json(node_attrs))

    return jsonify(data), 200
