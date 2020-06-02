"""Views of corpus blueprint."""
import datetime
import json
import os

from werkzeug.utils import secure_filename

from flask import (render_template, request, session, redirect,
                   url_for, send_file, Blueprint)
from flask import current_app as app, jsonify

from regraph import graph_to_d3_json
from regraph.utils import attrs_to_json, attrs_from_json
from regraph import Neo4jHierarchy

from kami.data_structures.annotations import CorpusAnnotation
from kami.data_structures.definitions import Definition
from kami.aggregation.generators import generate_nugget
from kami.aggregation.identifiers import EntityIdentifier
from kami.exceptions import KamiError

from kamistudio.utils import authenticate, check_dbs

from kamistudio.corpus.form_parsing import parse_interaction
from kamistudio.corpus.utils import (get_corpus, update_last_modified,
                                     _generate_unique_model_id,
                                     imported_interactions,
                                     update_protein_definition,
                                     update_revision_history,
                                     get_action_graph, merge_ag_nodes,
                                     get_nugget, add_new_model,
                                     update_last_modified_model,
                                     get_model)


corpus_blueprint = Blueprint(
    'corpus', __name__,
    template_folder='templates',
    static_folder='static')


@corpus_blueprint.route("/<corpus_id>")
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
        for g in corpus.protoforms():
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
        model_id = None
        if "model_id" in request.args:
            model_id = request.args["model_id"]
            model_json = app.mongo.db.kami_models.find(
                {"id": model_id})
            if not model_json:
                model_id = None
        return render_template("corpus.html",
                               kb_id=corpus_id,
                               kb=corpus,
                               n_nuggets=n_nuggets,
                               n_definitons=n_defs,
                               genes=json.dumps(genes),
                               bindings=json.dumps(bindings),
                               modifications=json.dumps(modifications),
                               instantaited=False,
                               model_id=model_id,
                               readonly=app.config["READ_ONLY"])
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/<corpus_id>/add-interaction",
                        methods=["GET", "POST"])
@check_dbs
def add_interaction(corpus_id, add_agents=True,
                    anatomize=True, apply_semantics=True):
    """Handle interaction addition."""
    corpus = get_corpus(corpus_id)
    if request.method == 'GET':
        return render_template(
            "add_interaction.html",
            corpus=corpus,
            readonly=app.config["READ_ONLY"])
    elif request.method == 'POST':
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            corpus = get_corpus(corpus_id)
            interaction = parse_interaction(request.form)
            corpus.add_interaction(interaction)
            update_revision_history(corpus)
            update_last_modified(corpus_id)
            return redirect(url_for('corpus.corpus_view', corpus_id=corpus._id))


@corpus_blueprint.route("/<corpus_id>/nugget-preview",
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
                nugget_gene = identifier.get_protoform_of(n)
                if nugget_gene and nugget_gene in nugget.reference_typing:
                    reference_genes[n] = [
                        nugget.reference_typing[nugget_gene]
                    ]
                else:
                    reference_genes[n] = []

        ag_node_attrs = {}
        for v in nugget.reference_typing.values():
            attrs = attrs_to_json(corpus.action_graph.get_node(v))
            ag_node_attrs[v] = attrs

        ag_edge_attrs = []
        for s, t in nugget.edges():
            if s in nugget.reference_typing and\
               t in nugget.reference_typing:
                edge_data = {}
                edge_data["source"] = nugget.reference_typing[s]
                edge_data["target"] = nugget.reference_typing[t]
                edge_data["attrs"] = attrs_to_json(
                    corpus.action_graph.get_edge(
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


@corpus_blueprint.route("/<corpus_id>/add-generated-nugget",
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
        session["nugget"].graph.set_node_attrs(k, v, update=False)

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


@corpus_blueprint.route("/<corpus_id>/import-json-interactions",
                        methods=["GET", "POST"])
@check_dbs
@authenticate
def import_json_interactions(corpus_id):
    """Handle import of json interactions."""
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        return render_template('import_interactions.html',
                               corpus=corpus)
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


@corpus_blueprint.route("/<corpus_id>/download", methods=["GET"])
@check_dbs
def download_corpus(corpus_id):
    """Handle corpus download."""
    filename = corpus_id.replace(" ", "_") + ".json"
    corpus = get_corpus(corpus_id)
    if corpus:
        # Get action graph layout
        node_positioning = None
        json_repr = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
        if "node_positioning" in json_repr.keys():
            node_positioning = json_repr["node_positioning"]

        corpus_json = corpus.to_json()
        if node_positioning is not None:
            corpus_json["node_positioning"] = node_positioning

        with open(os.path.join(app.config["UPLOAD_FOLDER"], filename), 'w') as f:
            json.dump(corpus_json, f)

        return send_file(
            os.path.join(app.config["UPLOAD_FOLDER"], filename),
            as_attachment=True,
            mimetype='application/json',
            attachment_filename=filename)
    else:
        return render_template("corpus_not_found.html",
                               corpus_id=corpus_id)


@corpus_blueprint.route("/<corpus_id>/update-ag-node-positioning",
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


@corpus_blueprint.route("/<corpus_id>/delete")
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
        return jsonify({"success": True}), 200
    else:
        return render_template("corpus_not_found.html", corpus_id=corpus_id)


@corpus_blueprint.route("/<corpus_id>/update-ag-node-attrs",
                        methods=["POST"])
@authenticate
@check_dbs
def update_action_graph_node_attrs(corpus_id):
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
                for k, v in node_attrs.items():
                    new_v = []
                    for vv in v["data"]:
                        new_v.append(vv.strip())
                    node_attrs[k]["data"] = new_v
                attrs = attrs_from_json(node_attrs)
                corpus.action_graph.set_node_attrs(node_id, attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                update_last_modified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/<corpus_id>/update-edge-attrs",
                        methods=["POST"])
@authenticate
@check_dbs
def update_action_graph_edge_attrs(corpus_id):
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
                corpus.action_graph.set_edge_attrs_from_json(
                    source, target, edge_attrs)
                response = json.dumps(
                    {'success': True}), 200, {'ContentType': 'application/json'}
                update_last_modified(corpus_id)
            except:
                pass
    return response


@corpus_blueprint.route("/<corpus_id>/edit-meta-data",
                        methods=["GET", "POST"])
@check_dbs
def edit_meta_data(corpus_id):
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        return render_template("edit_meta_data.html", corpus=corpus)
    else:
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            json_data = request.form

            corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
            for k in json_data.keys():
                corpus_json["meta_data"][k] = json_data[k]

            app.mongo.db.kami_corpora.update_one(
                {"_id": corpus_json["_id"]},
                {"$set": corpus_json},
                upsert=False)

            return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@corpus_blueprint.route("/<corpus_id>/genes")
def get_genes(corpus_id):
    """Handle get genes request."""
    corpus = get_corpus(corpus_id)

    response = json.dumps(
        {'success': False}), 404, {'ContentType': 'application/json'}
    if corpus is not None:
        gene_nodes = corpus.protoforms()
        data = {
            "genes": []
        }
        for g in gene_nodes:
            uniprotid, hgnc, syn, _ = corpus.get_protoform_data(g)
            data["genes"].append([uniprotid, hgnc, syn])
        response = jsonify(data), 200
    return response


@corpus_blueprint.route("/<corpus_id>/get-variants-data",
                        methods=["POST"])
@check_dbs
def get_variants_data(corpus_id):
    json_data = request.get_json()
    definitions_data = {}
    for k, v in json_data.items():
        record = app.mongo.db.kami_new_definitions.find_one({
            "corpus_id": corpus_id,
            "protoform": k
        })
        definitions_data[k] = {}
        for vv in v:
            definitions_data[k][vv] = [
                record["products"][vv]["desc"],
                record["products"][vv]["wild_type"]
            ]
    return jsonify(definitions_data), 200


@corpus_blueprint.route("/<corpus_id>/add-variant/<gene_node_id>",
                        methods=["GET", "POST"])
@check_dbs
def add_variant(corpus_id, gene_node_id):
    """Handle addition of protein variants."""
    if request.method == "GET":
        try:
            corpus = get_corpus(corpus_id)
            graph = corpus.action_graph.to_d3_json(
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
        except:
            return jsonify({"success": False}), 200
    else:
        if app.config["READ_ONLY"]:
            return render_template("403.html")
        else:
            try:
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
                    # attrs = {k: v["data"] for k, v in c.items()}
                    if c_type == "region":
                        # start, end = corpus.get_fragment_location(c_id)
                        # if start is not None:
                        #     attrs["start"] = start
                        # if end is not None:
                        #     attrs["end"] = end
                        components["regions"].append(c_id)
                    elif c_type == "site":
                        # start, end = corpus.get_fragment_location(c_id)
                        # if start is not None:
                        #     attrs["start"] = start
                        # if end is not None:
                        #     attrs["end"] = end
                        components["sites"].append(c_id)
                    elif c_type == "residue":
                        # loc = corpus.get_residue_location(c_id)
                        # if loc is not None:
                        #     attrs["loc"] = loc
                        components["residues"].append(c_id)

                residues = {}
                for [c_id, c, aa] in raw_selected_aa:
                    # attrs = {k: v["data"] for k, v in c.items()}
                    # loc = corpus.get_residue_location(c_id)
                    # if loc is not None:
                        # attrs["loc"] = loc
                    # attrs["aa"] = aa
                    residues[c_id] = aa

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
            except:
                return jsonify({"success": False}), 200


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
                    node_attrs = corpus.action_graph.get_node(c)
                    data["candidates"][c] = (
                        "Enzymes: {}, substrates: {}".format(
                            " / ".join(
                                format_gene_data(
                                    corpus.action_graph.get_node(p))
                                for p in enzymes),
                            " / ".join(
                                format_gene_data(
                                    corpus.action_graph.get_node(p))
                                for p in substrates)),
                        attrs_to_json(node_attrs)
                    )
        elif element_type == "bnd":
            candidates = corpus.get_attached_bnd(gene, False)
            for c in candidates:
                if c != original_ref_el:
                    node_attrs = corpus.action_graph.get_node(c)
                    partners = corpus.get_protoforms_of_bnd(c)
                    data["candidates"][c] = (
                        "Bindind partners: " + " / ".join(
                            format_gene_data(
                                corpus.action_graph.get_node(p))
                            for p in partners),
                        attrs_to_json(node_attrs)
                    )
        else:
            candidates = corpus.ag_predecessors_of_type(
                gene, element_type)
            for c in candidates:
                if c != original_ref_el:
                    node_attrs = corpus.action_graph.get_node(c)
                    edge_attrs = corpus.action_graph.get_edge(c, gene)
                    data["candidates"][c] = (
                        format_fragment_data(node_attrs, edge_attrs),
                        attrs_to_json(node_attrs))

    return jsonify(data), 200


@corpus_blueprint.route("/generate-kappa-from-corpus/<corpus_id>",
                        methods=["GET"])
def kappa_from_corpus(corpus_id):
    """Generate Kappa directly from the corpus."""
    pass


@corpus_blueprint.route("/<corpus_id>/raw-action-graph")
def get_corpus_action_graph(corpus_id, attrs=True):
    """Handle the raw json action graph representation."""
    corpus = get_corpus(corpus_id)
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    return get_action_graph(corpus, corpus_json, attrs)


@corpus_blueprint.route(
    "/<corpus_id>/get-ag-elements-by-type/<element_type>")
def get_ag_node_by_type(corpus_id, element_type):
    """Add action graph nodes by type."""
    data = {"elements": []}
    corpus = get_corpus(corpus_id)
    ag_nodes = corpus.nodes_of_type(element_type)
    for n in ag_nodes:
        element = {"id": n}
        element["attrs"] = {
            k: list(v)
            for k, v in corpus.get_ag_node_data(n).items()
        }
        data["elements"].append(element)
    return jsonify(data), 200


@corpus_blueprint.route(
    "/<corpus_id>/get-ag-element-by-id/<element_id>")
def get_ag_node_by_id(corpus_id, element_id):
    """Get action graph node by id."""
    corpus = get_corpus(corpus_id)
    data = {
        k: list(v)
        for k, v in corpus.get_ag_node_data(
            element_id).items()
    }
    return jsonify(data), 200


@corpus_blueprint.route("/<corpus_id>/merge-action-graph-nodes",
                        methods=["POST"])
@authenticate
def merge_corpus_ag_nodes(corpus_id):
    merge_ag_nodes(get_corpus(corpus_id), request.get_json())
    return jsonify({"success": True}), 200

# @corpus_blueprint.route("/model/<model_id>/raw-action-graph")
# def get_model_action_graph(model_id, attrs=True):
#     """Handle the raw json action graph representation."""
#     model = get_model(model_id)
#     model_json = app.mongo.db.kami_models.find_one({"id": model_id})
#     return get_action_graph(model, model_json, attrs)


# @corpus_blueprint.route("/model/<model_id>/merge-action-graph-nodes",
#                               methods=["POST"])
# @authenticate
# def merge_model_ag_nodes(model_id):
#     merge_ag_nodes(get_model(model_id), request.get_json())
#     return jsonify({"success": True}), 200


@corpus_blueprint.route("/<corpus_id>/nugget/<nugget_id>")
def corpus_nugget_view(corpus_id, nugget_id):
    """Handle nugget view."""
    return("Lets see the nugget")


# @corpus_blueprint.route("/model/<model_id>/nugget/<nugget_id>")
# def model_nugget_view(corpus_id, nugget_id):
#     """Handle nugget view."""
#     return("Lets see the nugget")


@corpus_blueprint.route("/<corpus_id>/nuggets")
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


@corpus_blueprint.route("/<corpus_id>/raw-nugget/<nugget_id>")
def corpus_nugget_json(corpus_id, nugget_id):
    corpus = get_corpus(corpus_id)
    return get_nugget(corpus, nugget_id)


@corpus_blueprint.route("/model/<model_id>/raw-nugget/<nugget_id>")
def model_nugget_json(model_id, nugget_id):
    model = get_model(model_id)
    return get_nugget(model, nugget_id, instantiated=True)


@corpus_blueprint.route("/<corpus_id>/raw-nugget/<nugget_id>")
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


@corpus_blueprint.route("/<corpus_id>/nugget/<nugget_id>/update-nugget-desc",
                        methods=["POST"])
@authenticate
def update_corpus_nugget(corpus_id, nugget_id):
    json_data = request.get_json()
    corpus = get_corpus(corpus_id)
    corpus.set_nugget_desc(nugget_id, json_data["desc"])
    response = json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}

    return response


# @corpus_blueprint.route("/model/<model_id>/nugget/<nugget_id>/update-nugget-desc",
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


@corpus_blueprint.route("/<corpus_id>/get-gene-adjacency",
                        methods=["GET"])
def get_corpus_gene_adjacency(corpus_id):
    """Generate a nugget table."""
    corpus = get_corpus(corpus_id)
    data = get_gene_adjacency(corpus)
    return jsonify(data), 200


# @corpus_blueprint.route("/model/<model_id>/get-gene-adjacency",
#                          methods=["GET"])
# def get_model_gene_adjacency(model_id):
#     model = get_model(model_id)
#     data = get_gene_adjacency(model)
#     return jsonify(data), 200


@corpus_blueprint.route("/<corpus_id>/nugget/<nugget_id>/update-node-attrs",
                        methods=["POST"])
@authenticate
def update_nugget_node_attrs(corpus_id, nugget_id):
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


@corpus_blueprint.route("/<corpus_id>/nugget/<nugget_id>/update-edge-attrs",
                        methods=["POST"])
@authenticate
def update_nugget_edge_attrs(corpus_id, nugget_id):
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


@corpus_blueprint.route("/<corpus_id>/remove-nugget/<nugget_id>")
@authenticate
def remove_nugget_from_corpus(corpus_id, nugget_id):
    corpus = get_corpus(corpus_id)
    corpus.remove_nugget(nugget_id)
    return jsonify({"success": True}), 200


# @corpus_blueprint.route("/model/<model_id>/remove-nugget/<nugget_id>")
# @authenticate
# def remove_nugget_from_model(model_id, nugget_id):
#     pass


@corpus_blueprint.route("/<corpus_id>/get-action-nuggets/<action_id>")
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

# @corpus_blueprint.route("/model/<model_id>/get-action-nuggets/<action_id>")
# def get_model_action_nuggets(model_id, action_id):
#     model = get_model(model_id)
#     nuggets = model.get_mechanism_nuggets(action_id)
#     data = {}
#     for n in nuggets:
#         data[n] = (
#             model.get_nugget_desc(n),
#             model.get_nugget_type(n)
#         )
#     return jsonify(data), 200


@corpus_blueprint.route("/<corpus_id>/raw-definition/<gene_id>")
@check_dbs
def fetch_definition(corpus_id, gene_id):
    """Retreive raw definition graphs."""
    definition_json = app.mongo.db.kami_new_definitions.find_one({
        "corpus_id": corpus_id,
        "protoform": gene_id
    })
    del definition_json["_id"]

    corpus = get_corpus(corpus_id)

    if corpus is not None and definition_json is not None:
        gene_node_id = corpus.get_protoform_by_uniprot(gene_id)

        # Find all the subcomponents of the protoform and the graph they induce
        protoform_subcomponents = corpus.subcomponent_nodes(gene_node_id)
        protoform_graph = corpus.action_graph.to_d3_json(
            nodes=protoform_subcomponents)
        ag_meta_typing = corpus.get_action_graph_typing()
        protoform_meta_typing = {
            c: ag_meta_typing[c] for c in protoform_subcomponents
        }

        definition_json["protoform_graph"] = protoform_graph
        definition_json["protoform_meta_typing"] = protoform_meta_typing

        return jsonify(definition_json), 200
    return jsonify({"success": False}), 404
    # if corpus is not None and definition_json is not None:
    #     definition = Definition.from_json(definition_json)

    #     protoform_graph, gene_node = definition._generate_protoform_graph(
    #         corpus.action_graph, corpus.get_action_graph_typing())
    #     product_graphs = {}
    #     for el in definition.products:
    #         product_graphs[el.name] = el.generate_graph(
    #             protoform_graph, gene_node)

    #     data = {}
    #     wild_type_name = None
    #     for k, v in definition_json["products"].items():
    #         if v["wild_type"]:
    #             wild_type_name = k
    #     data["wild_type"] = wild_type_name
    #     data["protoform_graph"] = graph_to_d3_json(protoform_graph.graph)
    #     data["protoform_graph_meta_typing"] = protoform_graph.meta_typing
    #     data["product_graphs"] = {}
    #     data["product_graphs_meta_typing"] = {}
    #     for k, v in product_graphs.items():
    #         data["product_graphs"][k] = graph_to_d3_json(v.graph)
    #         data["product_graphs_meta_typing"][k] = v.meta_typing


@corpus_blueprint.route("/<corpus_id>/variants/uniprot/<uniprot_id>")
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


@corpus_blueprint.route("/<corpus_id>/definitions")
@check_dbs
def get_definitions(corpus_id):
    raw_defs = app.mongo.db.kami_new_definitions.find(
        {"corpus_id": corpus_id})
    corpus = get_corpus(corpus_id)

    definitions = {}
    for d in raw_defs:
        node_attrs = corpus.action_graph.get_node(
            corpus.get_protoform_by_uniprot(d["protoform"]))

        definitions[d["protoform"]] = {}
        definitions[d["protoform"]]["attrs"] = attrs_to_json(
            node_attrs)
        definitions[d["protoform"]]["variants"] = [
            [k, v["desc"], v["wild_type"]]
            for k, v in d["products"].items()
        ]
    return jsonify(definitions), 200


@corpus_blueprint.route("/<corpus_id>/remove-variant/<definition_id>/<variant_id>",
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


@corpus_blueprint.route("<corpus_id>/new-model", methods=["GET", "POST"])
@authenticate
@check_dbs
def new_model(corpus_id):
    """New model handler."""
    if request.method == "GET":
        corpus = get_corpus(corpus_id)
        return render_template(
            "add_model.html",
            corpus=corpus,
            readonly=app.config["READ_ONLY"])
    else:
        if not app.config["READ_ONLY"]:
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

                definitions = {}
                for element in json_data["variantChoices"]:
                    uniprotid = element["uniprotid"]
                    definition_json = app.mongo.db.kami_new_definitions.find_one({
                        "corpus_id": corpus_id,
                        "protoform": uniprotid
                    })
                    if definition_json is not None:
                        definitions[uniprotid] = element["selectedVariants"]

                model_id = _generate_unique_model_id(model_name, corpus._id)
                annotation = {
                    "name": model_name,
                    "desc": model_desc,
                    "organism": corpus.annotation.organism
                }
                creation_time = last_modified = datetime.datetime.now().strftime(
                    "%d-%m-%Y %H:%M:%S")
                add_new_model(model_id, creation_time,
                              last_modified, annotation,
                              corpus_id=corpus._id,
                              definitions=definitions,
                              seed_genes=json_data["seedGenes"],
                              default_bnd_rate=default_bnd_rate,
                              default_brk_rate=default_brk_rate,
                              default_mod_rate=default_mod_rate)
                data = {
                    "redirect": url_for(
                        'corpus.corpus_view', corpus_id=corpus_id,
                        model_id=model_id)
                }
                return jsonify(data), 200
        else:
            return render_template("403.html")


@corpus_blueprint.route("<corpus_id>/models", methods=["GET"])
@check_dbs
def get_models(corpus_id):
    """Get models of the corpus."""
    models = list(app.mongo.db.kami_models.find(
        {"corpus_id": corpus_id}).sort(
        "last_modified", -1))
    data = {"items": []}
    for model in models:
        del model["_id"]
        data["items"].append(model)
    return jsonify(data), 200


@corpus_blueprint.route("<corpus_id>/get-gene-data", methods=["POST"])
def get_gene_data(corpus_id):
    """Get HGNC symbols and synonyms of genes."""
    json_data = request.get_json()
    data = {"items": {}}
    corpus = get_corpus(corpus_id)
    for up in json_data["uniprots"]:
        gene_id = corpus.get_protoform_by_uniprot(up)
        data["items"][up] = [
            corpus.get_hgnc_symbol(gene_id),
            corpus.get_synonyms(gene_id)
        ]
    return jsonify(data), 200


@corpus_blueprint.route("<corpus_id>/update-model/<model_id>", methods=["POST"])
def update_model_data(corpus_id, model_id):
    """Update model data."""
    json_data = request.get_json()
    if "updated" in json_data:
        app.mongo.db.kami_models.update_one(
            {"id": model_id, "corpus_id": corpus_id},
            {"$set": json_data["updated"]})
        return jsonify({"success": True}), 200
    return jsonify({"success": False}), 200


@corpus_blueprint.route("<corpus_id>/import-model", methods=['GET', 'POST'])
@authenticate
@check_dbs
def import_model(corpus_id):
    """Handler of model import."""
    if request.method == "GET":
        failed = request.args.get('failed')
        corpus = get_corpus(corpus_id)
        return render_template(
            'import_model.html',
            corpus=corpus, failed=failed)
    else:
        # check if the post request has the file part
        annotation = {}
        if request.form["name"]:
            annotation["name"] = request.form["name"]
        if request.form["desc"]:
            annotation["desc"] = request.form["desc"]
        if request.form["organism"]:
            annotation["organism"] = request.form["organism"]
        # TODO: handle annotation

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
            return imported_model(filename, annotation)


@corpus_blueprint.route("/<corpus_id>/delete-model/<model_id>")
@authenticate
@check_dbs
def delete_model(corpus_id, model_id):
    """Handle removal of the model."""
    try:
        app.mongo.db.kami_models.remove({"id": model_id})
        return jsonify({"success": True}), 200
    except:
        return render_template("model_not_found.html", model_id=model_id)


@corpus_blueprint.route("<corpus_id>/model/<model_id>/instantiate-ag")
@check_dbs
def instantiate_ag(corpus_id, model_id):
    """Return instantiated action graph."""
    corpus = get_corpus(corpus_id)
    model = get_model(corpus, model_id)
    ag_rule, ag_instance = model.action_graph_instantiation_rule()
    rule = {}
    rule["cloned_nodes"] = {}
    for lhs_node, p_nodes in ag_rule.cloned_nodes().items():
        rule["cloned_nodes"][lhs_node] = list(p_nodes)
    rule["removed_edges"] = list(ag_rule.removed_edges())

    rule["added_node_attrs"] = {}
    for n, attrs in ag_rule.added_node_attrs().items():
        rule["added_node_attrs"][n] = attrs_to_json(attrs)
    rule["removed_nodes"] = list(ag_rule.removed_nodes())
    rule["removed_node_attrs"] = {}
    for n, attrs in ag_rule.removed_node_attrs().items():
        rule["removed_node_attrs"][n] = attrs_to_json(attrs)
    rule["instance"] = ag_instance
    response = {
        "rule": rule,
        "instance": ag_instance
    }
    return jsonify(response), 200
