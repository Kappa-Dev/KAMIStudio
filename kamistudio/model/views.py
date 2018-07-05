"""Views of home blueprint."""
import json

from flask import render_template, Blueprint, request, redirect, url_for
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
            nugget_desc[nugget] = list(
                app.hierarchies[hierarchy_id].node[nugget].attrs['desc'])[0]
        else:
            nugget_desc[nugget] = ""

    return render_template("hierarchy.html",
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
        return render_template(
            "nugget_editor.html",
            new_nugget=True,
            hierarchy_id=hierarchy_id,
            hierarchies=app.hierarchies,
            nugget_graph=json.dumps(graph_to_d3_json(nugget.graph)),
            nugget_meta_typing=json.dumps(nugget.meta_typing),
            nugget_ag_typing=nugget.ag_typing,
            nugget_template_rel=nugget.template_rel)
