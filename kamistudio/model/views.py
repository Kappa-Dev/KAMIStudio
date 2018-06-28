"""Views of home blueprint."""
import re

from flask import render_template, Blueprint, request
from flask import current_app as app

from kami.export.old_kami import ag_to_edge_list
from kami.interactions import (Modification,
                               AnonymousModification,
                               SelfModification,
                               LigandModification,
                               Binding)


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


def retrieve_target(form):
    """Retrieve modification target."""
    # explicit target
    target = {}
    if form['stateOrResidue'] == 'state':
        target["type"] = 'State'

        if form['targetStateSet'] == 'true':
            state_to_set = True
            test = False
        else:
            state_to_set = False
            test = True

        target["data"] = {
            "name": form['targetStateName'],
            "test": test
        }
    else:
        target["type"] = 'Residue'

        if form['targetResidueTest'] == 'true':
            residue_test = True
        else:
            residue_test = False

        target["data"] = {
            "aa": form['targetResidueAA'],
            "test": residue_test
        }
        if form['targetResidueLocation'] != "":
            target["data"]["loc"] = form['targetResidueLocation']

        if form['targetResidueStateSet'] == 'true':
            state_to_set = True
            test = False
        else:
            state_to_set = False
            test = True

        target["data"]["state"] = {
            "name": form['targetResidueStateName'],
            "test": test
        }
    return target, state_to_set


def retrieve_states(form, actor_name, wanted_target):
    """Retrieve residues of an actor from the form."""
    target_state = None
    states = []

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
        # Retrieve state data
        for k, v in state_data_dict.items():
            field_name = actor_name + "State" + v + state_id
            if request.form[field_name] != "":
                if k == "test":
                    if request.form[field_name] == 'true':
                        state[k] = True
                    else:
                        state[k] = False
                state[k] = request.form[field_name]

        if actor_name + "State" + state_id == wanted_target:
            target_state = state
        else:
            states.append(state)
    return states, target_state


def retrieve_residues(form, actor_name, wanted_target):
    """Retrieve residues of an actor from the form."""
    target_residue = None

    residues = []
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
        # Retrieve residue data

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

        # Retrieve state
        state_name = None
        if request.form[actor_name + "ResidueStateName" + residue_id] != "":
            state_name = request.form[actor_name + "ResidueStateName" + residue_id]
        if request.form[actor_name + "ResidueStateTest" + residue_id] == 'true':
            state_test = True
        else:
            state_test = False
        if state_name is not None:
            residue["state"] = {
                "name": state_name,
                "test": state_test
            }

        if actor_name + "Residue" + residue_id == wanted_target:
            target_residue = residue
        else:
            residues.append(residue)
    return residues, target_residue


def retrieve_sites(form, actor_name, wanted_target):
    """Retrieve sites of an actor from the form."""
    target = None
    sites = []
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
        new_actor_name = actor_name + "Site" + site_id
        site = {}
        # Retrieve site data
        for k, v in site_data_dict.items():
            field_name = actor_name + "Site" + v + site_id
            if request.form[field_name] != "":
                site[k] = request.form[field_name]

        # Retrieve site subcomponents
        site["residues"], target_residue = retrieve_residues(form, new_actor_name, wanted_target)
        site["states"], target_state = retrieve_states(form, new_actor_name, wanted_target)

        if target_residue is not None:
            target = {
                "target": {"type": "Residue", "data": target_residue},
                "site": site
            }
        elif target_state is not None:
            target = {
                "target": {"type": "State", "data": target_state},
                "site": site
            }
        else:
            sites.append(site)
    return sites, target


def retrieve_regions(form, actor_name, wanted_target):
    """Retrieve regions of an actor from the form."""
    target = None

    regions = []
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
        new_actor_name = actor_name + "Region" + region_id
        region = {}
        # Retrieve region data
        for k, v in region_data_dict.items():
            field_name = actor_name + "Region" + v + region_id
            if request.form[field_name] != "":
                region[k] = request.form[field_name]

        # Retrieve region subcomponents
        region["sites"], target_site = retrieve_sites(
            form, new_actor_name, wanted_target)
        region["residues"], target_residue = retrieve_residues(
            form, new_actor_name, wanted_target)
        region["states"], target_state = retrieve_states(
            form, new_actor_name, wanted_target)

        if target_site is not None:
            target_site["region"] = region
            target = target_site
        if target_residue is not None:
            target = {
                "target": {"type": "Residue", "data": target_residue},
                "region": region
            }
        elif target_state is not None:
            target = {
                "target": {"type": "State", "data": target_state},
                "region": region
            }
        else:
            regions.append(region)
    return regions, target


def added_interaction(hierarchy_id, request):
    """Add interaction to the hierarchy."""
    print(request.form)
    if request.form['modorbnd'] == 'mod':

        print("\n\nCreating modification object...")

        if request.form['modType'] == "Modification":
            modification_dict = {"type": "Modification", "data": {}}

            # retrieve enzyme gene
            actors = {"enzyme", "substrate"}

            # Look for an implicit specification of target and substrate actor
            wanted_target = None
            if "targetSelection" in request.form.keys():
                wanted_target = request.form["targetSelection"]

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

                actor["regions"], target_in_regions = retrieve_regions(
                    request.form, actor_name, wanted_target)
                actor["sites"], target_in_sites = retrieve_sites(
                    request.form, actor_name, wanted_target)
                actor["residues"], target_in_residues = retrieve_residues(
                    request.form, actor_name, wanted_target)
                actor["states"], target_in_states = retrieve_states(
                    request.form, actor_name, wanted_target)

                if target_in_regions is not None:
                    # TODO here
                    pass
                elif target_in_sites is not None:
                    modification_dict["data"][actor] = {
                        "type": "SiteActor",
                        "data": {
                            "gene": actor,
                            "site": target_in_sites["site"]
                        }
                    }
                    modification_dict["data"]["target"] = {
                        target_in_sites["target"]
                    }
                    # TODO how to find mod value
                elif target_in_residues is not None:
                    modification_dict["data"][actor] = {
                        "type": "Gene", "data": actor}
                    modification_dict["data"]["target"] = {
                        "type": "residue",
                        "data": target_in_residues
                    }
                    modification_dict["data"]["value"] = not target_in_residues[
                        "state"]["test"]
                elif target_in_states is not None:
                    modification_dict["data"][actor] = {
                        "type": "Gene", "data": actor}
                    modification_dict["data"]["target"] = {
                        "type": "State",
                        "data": target_in_states
                    }
                    modification_dict["data"]["value"] = not target_in_states[
                        "test"]
                else:
                    modification_dict["data"][actor] = {
                        "type": "Gene", "data": actor}

                # modification_dict["data"][actor_name]["data"] = actor

            # retrieve target
            if wanted_target is None:
                target, value = retrieve_target(request.form)
                modification_dict["data"]["target"] = target
                modification_dict["data"]["value"] = value

            print(modification_dict)
            mod = Modification.from_json(modification_dict["data"])
            print(mod)

        elif request.form['modType'] == "AnonymousModification":
            print("\tCreating 'AnonymousModification'...")
        elif request.form['modType'] == "SelfModification":
            print("\tCreating 'SelfModification'...")
        elif request.form['modType'] == "LigandModification":
            print("\tCreating 'LigandModification'...")

    else:
        print("\n\nCreating binding object...")
