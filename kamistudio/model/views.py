"""Views of home blueprint."""
import os
import json

from flask import (render_template, Blueprint, request, session, redirect,
                   url_for, send_from_directory, send_file)
from flask import current_app as app

from regraph import graph_to_d3_json

from kami.exporters.old_kami import ag_to_edge_list
from kami.aggregation.generators import generate_from_interaction

from kamistudio.model.form_parsing import(parse_interaction)


model_blueprint = Blueprint('model', __name__, template_folder='templates')


@model_blueprint.route("/model/<model_id>")
def model_view(model_id):
    """View model."""
    if not app.models[model_id].empty():
        edgelist = ag_to_edge_list(app.models[model_id])
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
    for nugget in app.models[model_id].nuggets():
        nugget_desc[nugget] = app.models[model_id].get_nugget_desc(nugget)

    return render_template("model.html",
                           model_id=model_id,
                           models=app.models,
                           action_graph_edgelist=new_edgelist,
                           action_graph_nodelist=new_nodelist,
                           nugget_desc=nugget_desc)


@model_blueprint.route("/model/<model_id>/add-interaction",
                       methods=["GET", "POST"])
def add_interaction(model_id, add_agents=True,
                    anatomize=True, apply_semantics=True):
    """Handle interaction addition."""
    if request.method == 'GET':
        return render_template(
            "add_interaction.html",
            model_id=model_id)
    elif request.method == 'POST':
        interaction = parse_interaction(request.form)
        nugget, nugget_type = generate_from_interaction(
            app.models[model_id], interaction)
        app.models[model_id].add_nugget(
            nugget, nugget_type,
            add_agents=add_agents,
            anatomize=anatomize,
            apply_semantics=apply_semantics)
        return redirect(url_for('model.model_view', model_id=model_id))


@model_blueprint.route("/model/<model_id>/nugget-preview",
                       methods=["POST"])
def preview_nugget(model_id):
    """Generate nugget, store in the session and redirect to nugget preview."""
    interaction = parse_interaction(request.form)
    nugget, nugget_type = generate_from_interaction(
        app.models[model_id], interaction)

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
        model_id=model_id,
        models=app.models,
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


@model_blueprint.route("/model/<model_id>/add-generated-nugget",
                       methods=["GET"])
def add_nugget_from_session(model_id, add_agents=True,
                            anatomize=True, apply_semantics=True):
    """Add nugget stored in session to the model."""
    app.models[model_id].add_nugget(
        session["nugget"], session["nugget_type"],
        add_agents=add_agents,
        anatomize=anatomize,
        apply_semantics=apply_semantics)

    if "nugget" in session.keys():
        session.pop("nugget", None)
    if "nugget_type" in session.keys():
        session.pop("nugget_type", None)

    return redirect(url_for('model.model_view', model_id=model_id))


@model_blueprint.route("/model/<model_id>/import-json-interactions",
                       methods=["GET"])
def import_json_interactions(model_id):
    """Handle import of json interactions."""
    pass


@model_blueprint.route("/model/<model_id>/download", methods=["GET"])
def download_model(model_id):
    filename = model_id.replace(" ", "_") + ".json"
    app.models[model_id].export_json(
        os.path.join(app.root_path, "uploads/" + filename))
    print(os.path.join(app.root_path, "uploads"))
    return send_file(
        os.path.join(app.root_path, "uploads/" + filename),
        as_attachment=True,
        mimetype='application/json',
        attachment_filename=filename)


@model_blueprint.route("/model/<model_id>/update-ag-node-positioning",
                       methods=["POST"])
def update_ag_node_positioning(model_id):
    """Retrieve node positioning from post request."""
    json_data = request.get_json()
    model = app.models[model_id]

    if "node_positioning" in json_data.keys() and\
       len(json_data["node_positioning"]) > 0:
        ag_attrs = model.get_action_graph_attrs()

        if "node_positioning" in ag_attrs.keys():
            position_dict = {
                k: (v1, v2)
                for k, v1, v2 in ag_attrs["node_positioning"]
            }
        else:
            position_dict = {}
        for k, v in json_data["node_positioning"].items():
            position_dict[k] = (v[0], v[1])

        app.models[model_id].set_action_graph_attrs({
            "node_positioning":
                set([(k, v[0], v[1])for k, v in position_dict.items()])
        })

    # bastard = "O75449_region_AAA _ATPase_IPR003593_241_383_AAA _ATPase"

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
