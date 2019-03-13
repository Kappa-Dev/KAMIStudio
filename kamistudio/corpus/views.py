"""Views of home blueprint."""
import os
import json

from kami.data_structures.corpora import KamiCorpus
from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_from_directory, send_file)
from flask import current_app as app

from regraph import graph_to_d3_json

from kami.exporters.old_kami import ag_to_edge_list
from kami.aggregation.generators import generate_nugget

from kamistudio.corpus.form_parsing import(parse_interaction)


corpus_blueprint = Blueprint('corpus', __name__, template_folder='templates')


def get_corpus(corpus_id):
    corpus_json = app.mongo.db.kami_corpora.find_one({"id": corpus_id})
    return KamiCorpus(
        corpus_id,
        annotation=corpus_json["meta_data"],
        creation_time=corpus_json["creation_date"],
        last_modified=corpus_json["last_modified"],
        backend="neo4j",
        driver=app.neo4j_driver
    )


@corpus_blueprint.route("/corpus/<corpus_id>")
def corpus_view(corpus_id):
    """View corpus."""
    corpus = get_corpus(corpus_id)
    if not corpus.empty():
        edgelist = ag_to_edge_list(corpus)
        nodelist = set()
        for u, v in edgelist:
            nodelist.add(u)
            nodelist.add(v)
        nodelist = list(nodelist)
        nodedict = dict()
        for i, n in enumerate(nodelist):
            nodedict[n] = i + 1

        new_nodelist = [(i, l) for l, i in nodedict.items()]
        new_edgelist = [(nodedict[u], nodedict[v]) for u, v in edgelist]
    else:
        new_edgelist = []
        new_nodelist = []

    nugget_desc = {}
    for nugget in corpus.nuggets():
        nugget_desc[nugget] = corpus.get_nugget_desc(nugget)

    return render_template("corpus.html",
                           corpus_id=corpus_id,
                           corpus=corpus,
                           action_graph_edgelist=new_edgelist,
                           action_graph_nodelist=new_nodelist,
                           nugget_desc=nugget_desc)


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
    pass


@corpus_blueprint.route("/corpus/<corpus_id>/download", methods=["GET"])
def download_corpus(corpus_id):
    filename = corpus_id.replace(" ", "_") + ".json"
    corpus = get_corpus(corpus_id)
    corpus.export_json(
        os.path.join(app.root_path, "uploads/" + filename))
    return send_file(
        os.path.join(app.root_path, "uploads/" + filename),
        as_attachment=True,
        mimetype='application/json',
        attachment_filename=filename)


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

    return json.dumps(
        {'success': True}), 200, {'ContentType': 'application/json'}
