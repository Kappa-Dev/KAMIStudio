"""Views of home blueprint."""
import json

from flask import (render_template, Blueprint, request, session, redirect,
                   url_for)
from flask import current_app as app

from regraph import graph_to_d3_json

from kami.export.old_kami import ag_to_edge_list
from kami.aggregation.generators import generate_from_interaction

from kamistudio.model.form_parsing import(parse_interaction)


model_blueprint = Blueprint('model', __name__, template_folder='templates')


@model_blueprint.route("/model/<hierarchy_id>")
def model_view(hierarchy_id):
    """View model."""
    if not app.hierarchies[hierarchy_id].empty():
        edgelist = ag_to_edge_list(app.hierarchies[hierarchy_id])
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
    for nugget in app.hierarchies[hierarchy_id].nuggets():
        if 'desc' in app.hierarchies[hierarchy_id].node[nugget].attrs.keys():
            if type(app.hierarchies[hierarchy_id].node[nugget].attrs['desc']) == str:
                nugget_desc[nugget] = app.hierarchies[hierarchy_id].node[nugget].attrs['desc']
            else:
                nugget_desc[nugget] = list(
                    app.hierarchies[hierarchy_id].node[nugget].attrs['desc'])[0]
        else:
            nugget_desc[nugget] = ""

    return render_template("model.html",
                           hierarchy_id=hierarchy_id,
                           hierarchies=app.hierarchies,
                           action_graph_edgelist=new_edgelist,
                           action_graph_nodelist=new_nodelist,
                           nugget_desc=nugget_desc)


@model_blueprint.route("/model/<hierarchy_id>/add_interaction",
                       methods=["GET", "POST"])
def add_interaction(hierarchy_id):
    """Add interaction to the hierarchy."""
    if request.method == 'GET':
        return render_template(
            "add_interaction.html",
            hierarchy_id=hierarchy_id)
    elif request.method == 'POST':
        interaction = parse_interaction(request.form)
        nugget, nugget_type = generate_from_interaction(
            app.hierarchies[hierarchy_id], interaction)

        session["nugget"] = nugget
        session["nugget_type"] = nugget_type
        session.modified = True

        template_relation = {}
        for k, v in nugget.template_rel.items():
            for vv in v:
                template_relation[vv] = k

        return render_template(
            "nugget_preview.html",
            new_nugget=True,
            hierarchy_id=hierarchy_id,
            hierarchies=app.hierarchies,
            nugget_graph=json.dumps(graph_to_d3_json(nugget.graph)),
            nugget_type=nugget_type,
            nugget_meta_typing=json.dumps(nugget.meta_typing),
            nugget_ag_typing=json.dumps(nugget.ag_typing),
            nugget_template_rel=json.dumps(template_relation))


@model_blueprint.route("/model/<hierarchy_id>/add_nugget",
                       methods=["GET"])
def add_nugget(hierarchy_id, add_agents=True,
               anatomize=True, apply_semantics=True):
    nugget_id = app.hierarchies[hierarchy_id].add_nugget(
        session["nugget"], session["nugget_type"],
        add_agents=add_agents,
        anatomize=anatomize,
        apply_semantics=apply_semantics)
    session.pop('nugget', None)
    session.pop('nugget_type', None)
    return redirect(url_for('model.model_view', hierarchy_id=hierarchy_id))
