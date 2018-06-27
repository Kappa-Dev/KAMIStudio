"""Views of home blueprint."""
import re

from flask import render_template, Blueprint, request
from flask import current_app as app

from kami.export.old_kami import ag_to_edge_list

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
        return added_interaction(hierarchy_id, request)


# @model_blueprint.route(
#     "/model/<hierarchy_id>/added_interaction", methods=["POST"])
def added_interaction(hierarchy_id, request):
    """Add interaction to the hierarchy."""
    print(request.form)
    if request.form['modorbnd'] == 'mod':

        print("\n\nCreating modification object...")

        if request.form['modType'] == "Modification":
            modification = {"type": "Modification"}
            # retrieve enzyme gene
            modification["enzyme"] = {"type": "gene", "data": {}}
            modification["substrate"] = {"type": "gene", "data": {}}

            actors = {"enzyme", "substrate"}
            for actor_name in actors:
                actor = {}
                gene_data_dict = {
                    "uniprotid": "UniprotAC",
                    "hgnc_symbol": "HgncSymbol",
                    "synonyms": "Synonyms",
                    "location": "Location",
                }
                for k, v in gene_data_dict.items():
                    if request.form[actor_name + v] != "":
                        actor[k] = request.form[actor_name + v]
                actor["regions"] = []

                # Look for region related fields
                region_data_dict = {
                    "name": "Name",
                    "interproid": "Interpro",
                    "start": "Start",
                    "end": "End",
                    "order": "Order"
                }
                region_ids = set()
                regex = actor_name + "RegionName(.*)"
                for field_name, value in request.form.items():
                    match = re.match(regex, field_name)
                    if match is not None:
                        region_ids.add(match.groups()[0])

                for region_id in region_ids:
                    region = {}
                    for k, v in region_data_dict.items():

                        field_name = actor_name + "Region" + v + region_id
                        if request.form[field_name] != "":
                            region[k] = request.form[field_name]

                    actor["regions"].append(region)

                actor["sites"] = []

                # Look for site related fields
                site_data_dict = {
                    "name": "Name",
                    "interproid": "Interpro",
                    "start": "Start",
                    "end": "End",
                    "order": "Order"
                }
                site_ids = set()
                regex = actor_name + "SiteName(.*)"
                for field_name, value in request.form.items():
                    match = re.match(regex, field_name)
                    if match is not None:
                        site_ids.add(match.groups()[0])

                for site_id in site_ids:
                    site = {}
                    for k, v in site_data_dict.items():
                        field_name = actor_name + "Site" + v + site_id
                        if request.form[field_name] != "":
                            site[k] = request.form[field_name]

                    actor["sites"].append(site)

                actor["residues"] = []
                # Look for residue related fields
                residue_data_dict = {
                    "aa": "AA",
                    "loc": "Loc",
                    "test": "Test"
                }

                residue_ids = set()
                regex = actor_name + "ResidueAA(.*)"
                for field_name, value in request.form.items():
                    match = re.match(regex, field_name)
                    if match is not None:
                        residue_ids.add(match.groups()[0])

                for residue_id in residue_ids:
                    residue = {}
                    for k, v in residue_data_dict.items():
                        field_name = actor_name + "Residue" + v + residue_id
                        if request.form[field_name] != "":
                            if k == "test":
                                if request.form[field_name] == 'true':
                                    residue[k] = True
                                else:
                                    residue[k] = False
                            else:
                                residue[k] = request.form[field_name]

                    actor["residues"].append(residue)

                actor["states"] = []

                # Look for residue related fields
                state_data_dict = {
                    "name": "Name",
                    "test": "Test"
                }

                state_ids = set()
                regex = actor_name + "StateName(.*)"
                for field_name, value in request.form.items():
                    match = re.match(regex, field_name)
                    if match is not None:
                        state_ids.add(match.groups()[0])

                for state_id in state_ids:
                    state = {}
                    for k, v in state_data_dict.items():
                        field_name = actor_name + "State" + v + state_id
                        if request.form[field_name] != "":
                            if k == "test":
                                if request.form[field_name] == 'true':
                                    state[k] = True
                                else:
                                    state[k] = False
                            state[k] = request.form[field_name]

                    actor["states"].append(state)

                print(actor)
                modification[actor_name]["data"] = actor

            print(modification)

        elif request.form['modType'] == "AnonymousModification":
            print("\tCreating 'AnonymousModification'...")
        elif request.form['modType'] == "SelfModification":
            print("\tCreating 'SelfModification'...")
        elif request.form['modType'] == "LigandModification":
            print("\tCreating 'LigandModification'...")

    else:
        print("\n\nCreating binding object...")
