"""Utils for froms parsing."""
import re
from kami.interactions import (Modification,
                               AnonymousModification,
                               SelfModification,
                               LigandModification,
                               Binding)


def _process_explict_target(form):
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
    for field_name, value in form.items():
        match = re.match(regex, field_name)
        if match is not None:
            state_ids.add(match.groups()[0])

    for state_id in state_ids:
        state = {}
        # Retrieve state data
        for k, v in state_data_dict.items():
            field_name = actor_name + "State" + v + state_id
            if form[field_name] != "":
                if k == "test":
                    if form[field_name] == 'true':
                        state[k] = True
                    else:
                        state[k] = False
                state[k] = form[field_name]

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
    for field_name, value in form.items():
        match = re.match(regex, field_name)
        if match is not None:
            residue_ids.add(match.groups()[0])

    for residue_id in residue_ids:
        residue = {}
        # Retrieve residue data

        for k, v in residue_data_dict.items():
            field_name = actor_name + "Residue" + v + residue_id
            if form[field_name] != "":
                if k == "test":
                    if form[field_name] == 'true':
                        residue[k] = True
                    else:
                        residue[k] = False
                else:
                    residue[k] = form[field_name]

        # Retrieve state
        state_name = None
        if form[actor_name + "ResidueStateName" + residue_id] != "":
            state_name = form[actor_name + "ResidueStateName" + residue_id]
        if form[actor_name + "ResidueStateTest" + residue_id] == 'true':
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


def retrieve_sites(form, actor_name, wanted_actors=None, wanted_target=None):
    """Retrieve sites of an actor from the form."""
    target = None

    actors = {}
    if wanted_actors is not None:
        for wanted_actor in wanted_actors.keys():
            actors[wanted_actor] = {}

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
    for field_name, value in form.items():
        match = re.match(regex, field_name)
        if match is not None:
            site_ids.add(match.groups()[0])

    for site_id in site_ids:
        new_actor_name = actor_name + "Site" + site_id
        site = {}
        # Retrieve site data
        for k, v in site_data_dict.items():
            field_name = actor_name + "Site" + v + site_id
            if form[field_name] != "":
                site[k] = form[field_name]

        # Retrieve site subcomponents
        site["residues"], target_residue = retrieve_residues(
            form, new_actor_name, wanted_target)
        site["states"], target_state = retrieve_states(
            form, new_actor_name, wanted_target)

        marked_as_actor = False
        marked_as_target = False
        if target_residue is not None:
            target = {
                "target": {"type": "Residue", "data": target_residue},
                "site": (actor_name + "Site" + site_id, site)
            }
            marked_as_target = True
        elif target_state is not None:
            target = {
                "target": {"type": "State", "data": target_state},
                "site": (actor_name + "Site" + site_id, site)
            }
            marked_as_target = True

        if wanted_actors is not None:
            for wanted_actor, wanted_actor_id in wanted_actors.items():
                if actor_name + "Site" + site_id == wanted_actor_id:
                    actors[wanted_actor] = (wanted_actor_id, site)
                    marked_as_actor = True

        if not marked_as_actor and not marked_as_target:
            sites.append(site)
    return sites, actors, target


def retrieve_regions(form, actor_name, wanted_actors=None, wanted_target=None):
    """Retrieve regions of an actor from the form."""
    target = None

    actors = {}
    if wanted_actors is not None:
        for wanted_actor in wanted_actors:
            actors[wanted_actor] = {}

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
    for field_name, value in form.items():
        match = re.match(regex, field_name)
        if match is not None:
            region_ids.add(match.groups()[0])

    for region_id in region_ids:
        new_actor_name = actor_name + "Region" + region_id
        region = {}
        # Retrieve region data
        for k, v in region_data_dict.items():
            field_name = actor_name + "Region" + v + region_id
            if form[field_name] != "":
                region[k] = form[field_name]

        # Retrieve region subcomponents
        region["sites"], site_actors, target_site = retrieve_sites(
            form, new_actor_name, wanted_actors, wanted_target)
        region["residues"], target_residue = retrieve_residues(
            form, new_actor_name, wanted_target)
        region["states"], target_state = retrieve_states(
            form, new_actor_name, wanted_target)

        marked_as_actor = False
        marked_as_target = False
        if target_site is not None:
            target = {
                "region": (actor_name + "Region" + region_id, region),
                "site": target_site["site"],
                "target": target_site["target"]
            }
            marked_as_target = True
        elif target_residue is not None:
            target = {
                "target": {"type": "Residue", "data": target_residue},
                "region": (actor_name + "Region" + region_id, region)
            }
            marked_as_target = True
        elif target_state is not None:
            target = {
                "target": {"type": "State", "data": target_state},
                "region": (actor_name + "Region" + region_id, region)
            }
            marked_as_target = True

        if wanted_actors is not None:
            for wanted_actor, wanted_actor_id in wanted_actors.items():
                if wanted_actor in site_actors.keys() and len(
                        site_actors[wanted_actor]) > 0:
                    actors[wanted_actor] = {
                        "site": site_actors[wanted_actor],
                        "region": (actor_name + "Region" + region_id, region)
                    }
                    marked_as_actor = True
                else:
                    if actor_name + "Region" + region_id == wanted_actor_id:
                        actors[wanted_actor] = {
                            "region": (actor_name + "Region" + region_id, region)
                        }
                        marked_as_actor = True

        if not marked_as_actor and not marked_as_target:
            regions.append(region)
    return regions, actors, target


def retrieve_actor(form, actor_name, wanted_actors=None, wanted_target=None):
    """Retrieve an actor of PPI from a form."""
    actor_data = {}
    target_data = {}

    gene_data = {}

    gene_data_dict = {
        "uniprotid": "UniprotAC",
        "hgnc_symbol": "HgncSymbol",
        "synonyms": "Synonyms",
        "location": "Location",
    }
    for k, v in gene_data_dict.items():
        if form[actor_name + v] != "":
            gene_data[k] = form[actor_name + v]

    gene_data["regions"], actors_in_regions, target_in_regions =\
        retrieve_regions(
            form, actor_name, wanted_actors, wanted_target)
    gene_data["sites"], actors_in_sites, target_in_sites =\
        retrieve_sites(
            form, actor_name, wanted_actors, wanted_target)
    gene_data["residues"], target_in_residues = retrieve_residues(
        form, actor_name, wanted_target)
    gene_data["states"], target_in_states = retrieve_states(
        form, actor_name, wanted_target)

    if target_in_regions is not None:
        target_data["in_regions"] = target_in_regions
    elif target_in_sites is not None:
        target_data["in_sites"] = target_in_sites
    elif target_in_residues is not None:
        target_data = {"target": target_in_residues}
    elif target_in_states is not None:
        target_data = {"target": target_in_states}

    if wanted_actors is not None:
        for wanted_actor, wanted_actor_id in wanted_actors.items():
            actor_data[wanted_actor] = {}
            if wanted_actor in actors_in_regions.keys() and\
               len(actors_in_regions[wanted_actor]) > 0:
                actor_data[wanted_actor]["in_regions"] =\
                    actors_in_regions[wanted_actor]
            elif wanted_actor in actors_in_sites.keys() and\
                    len(actors_in_sites[wanted_actor]) > 0:
                actor_data[wanted_actor]["in_sites"] =\
                    actors_in_sites[wanted_actor]
    return gene_data, actor_data, target_data


def _process_actor(gene_data, actor_data):
    if "in_regions" in actor_data.keys():
        if "site" in actor_data["in_regions"].keys():
            actor = {
                "type": "SiteActor",
                "data": {
                    "gene": gene_data,
                    "region": actor_data["in_regions"]["region"][1],
                    "site": actor_data["in_regions"]["site"][1]
                }
            }
        else:
            actor = {
                "type": "RegionActor",
                "data": {
                    "gene": gene_data,
                    "region": actor_data["in_regions"]["region"][1]
                }
            }
    elif "in_sites" in actor_data.keys():
        actor = {
            "type": "SiteActor",
            "data": {
                "gene": gene_data,
                "site": actor_data["in_sites"][1]
            }
        }
    else:
        actor = {"type": "Gene", "data": gene_data}
    return actor


def _process_implicit_target(target_data):
    target = None
    value = True

    if "in_regions" in target_data.keys():
        target = target_data["in_regions"]["target"]
    elif "in_sites" in target_data.keys():
        target = target_data["in_sites"]["target"]
    elif "residue" in target_data.keys():
        target = {
            "type": "Residue",
            "data": target_data["residue"]
        }
        value = not target_data["residue"]["state"]["test"]
    elif "state" in target_data.keys():
        target = {
            "type": "State",
            "data": target_data["state"]
        }
        value = not target_data["state"]["test"]
    return target, value


def _process_target_carriers(target_data):
    carrier_region = None
    carrier_site = None

    if "in_regions" in target_data and len(target_data["in_regions"]) > 0:
        carrier_region = target_data["in_regions"]["region"]
        if "site" in target_data["in_regions"]:
            carrier_site = target_data["in_regions"]["site"]
    elif "in_sites" in target_data and len(target_data["in_sites"]) > 0:
        carrier_site = target_data["in_sites"]["site"]
    return carrier_region, carrier_site


def parse_interaction(form):
    """Parse interaction from the form."""
    if form['modorbnd'] == 'mod':

        if form['modType'] == "Modification":

            mod_json = {}

            wanted_enzyme_subactor = None
            if "enzymeActorSelection" in form.keys():
                wanted_enzyme_subactor = {
                    "enzymeActorSelection": form[
                        "enzymeActorSelection"]
                }
            wanted_substrate_target = None
            if "targetSelection" in form.keys():
                wanted_substrate_target = form["targetSelection"]

            enzyme_gene, subactors, _ = retrieve_actor(
                form, "enzyme", wanted_enzyme_subactor)

            if "enzymeActorSelection" in subactors.keys():
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, subactors["enzymeActorSelection"])
            else:
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, {})

            substrate_gene, _, target_subactor = retrieve_actor(
                form, "substrate", None, wanted_substrate_target)
            mod_json["substrate"] = _process_actor(
                substrate_gene, target_subactor)

            target, value = _process_implicit_target(target_subactor)

            if target is None:
                target, value = _process_explict_target(form)

            mod_json["target"] = target
            mod_json["value"] = value

            mod = Modification.from_json(mod_json)
            return mod
        elif form['modType'] == "AnonymousModification":
            mod_json = {}

            wanted_substrate_target = None
            if "targetSelection" in form.keys():
                wanted_substrate_target = form["targetSelection"]

            substrate_gene, target_subactor, _ = retrieve_actor(
                form, "substrate", None, wanted_substrate_target)
            mod_json["substrate"] = _process_actor(
                substrate_gene, target_subactor)

            target, value = _process_implicit_target(target_subactor)

            if target is None:
                target, value = _process_explict_target(form)

            mod_json["target"] = target
            mod_json["value"] = value

            mod = AnonymousModification.from_json(mod_json)
            return mod
        elif form['modType'] == "SelfModification":
            mod_json = {}

            wanted_enzyme_subactor = None
            if "enzymeSubActorSelection" in form.keys():
                wanted_enzyme_subactor = {
                    "enzymeSubActorSelection": form[
                        "enzymeSubActorSelection"]
                }

            wanted_substrate_target = None
            if "targetSelection" in form.keys():
                wanted_substrate_target = form["targetSelection"]

            enzyme_gene, subactors, target_subactor = retrieve_actor(
                form, "enzymeSub", wanted_enzyme_subactor,
                wanted_substrate_target)

            if "enzymeSubActorSelection" in subactors.keys():
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, subactors["enzymeSubActorSelection"])
            else:
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, {})

            target, value = _process_implicit_target(target_subactor)

            substrate_region, substrate_site = _process_target_carriers(
                target_subactor)

            if substrate_region is not None:
                mod_json["substrate_region"] = substrate_region
            if substrate_site is not None:
                mod_json["substrate_site"] = substrate_site

            if target is None:
                target, value = _process_explict_target(form)

            mod_json["target"] = target
            mod_json["value"] = value
            mod = SelfModification.from_json(mod_json)
            return mod
        elif form['modType'] == "LigandModification":
            mod_json = {}

            wanted_enzyme_subactors = {}
            if "enzymeLigandActorSelection" in form.keys():
                wanted_enzyme_subactors["enzymeLigandActorSelection"] =\
                    form["enzymeLigandActorSelection"]
            if "enzymeLigandBindingActorSelection" in form.keys():
                wanted_enzyme_subactors["enzymeLigandBindingActorSelection"] =\
                    form["enzymeLigandBindingActorSelection"]
            if len(wanted_enzyme_subactors) == 0:
                wanted_enzyme_subactors = None

            # usual stuff enzyme/substrate actors
            enzyme_gene, enzyme_subactors, _ = retrieve_actor(
                form, "enzymeLigand", wanted_enzyme_subactors)

            if "enzymeLigandActorSelection" in enzyme_subactors.keys():
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, enzyme_subactors["enzymeLigandActorSelection"])
            else:
                mod_json["enzyme"] = _process_actor(
                    enzyme_gene, {})

            wanted_substrate_subactors = None
            if "substrateLigandBindingActorSelection" in form.keys():
                wanted_substrate_subactors =\
                    {"substrateLigandBindingActorSelection": form[
                        "substrateLigandBindingActorSelection"]}

            wanted_substrate_target = None
            if "targetSelection" in form.keys():
                wanted_substrate_target = form["targetSelection"]

            substrate_gene, substrate_subactors, target_subactor = retrieve_actor(
                form, "substrateLigand", wanted_substrate_subactors,
                wanted_substrate_target)
            mod_json["substrate"] = _process_actor(
                substrate_gene, target_subactor)

            target, value = _process_implicit_target(target_subactor)

            if target is None:
                target, value = _process_explict_target(form)
                mod_json["target"] = target
                mod_json["value"] = value
            else:
                mod_json["target"] = target
                mod_json["value"] = value

            # process binding subactors
            if "enzymeLigandBindingActorSelection" in enzyme_subactors.keys():
                # enzymatic and binding regions can coincide
                if "in_regions" in enzyme_subactors[
                        "enzymeLigandBindingActorSelection"].keys() and\
                   len(enzyme_subactors[
                        "enzymeLigandBindingActorSelection"]["in_regions"]) > 0:
                    bnd_subactor_data = enzyme_subactors[
                        "enzymeLigandBindingActorSelection"]["in_regions"]

                    if "enzymeLigandActorSelection" in enzyme_subactors.keys() and\
                       "in_regions" in enzyme_subactors[
                            "enzymeLigandActorSelection"].keys() and\
                       bnd_subactor_data["region"][0] ==\
                       enzyme_subactors[
                            "enzymeLigandActorSelection"]["in_regions"]["region"][0]:
                        if "site" in bnd_subactor_data.keys():
                            # acting and binding sites are the same
                            if "site" in enzyme_subactors[
                                "enzymeLigandActorSelection"]["in_regions"].keys() and \
                               bnd_subactor_data["site"][0] ==\
                               enzyme_subactors[
                                    "enzymeLigandActorSelection"]["in_regions"]["site"][0]:
                                mod_json["enzyme_bnd_subactor"] =\
                                    "site"
                            # acting and binding sites are different
                            else:
                                mod_json["enzyme_bnd_subactor"] =\
                                    "region"
                                mod_json["enzyme_bnd_site"] =\
                                    bnd_subactor_data["site"][1]
                        else:
                            mod_json["enzyme_bnd_subactor"] = "region"
                    # acting and binding regions are not the same
                    else:
                        mod_json["enzyme_bnd_region"] =\
                            bnd_subactor_data["region"][1]
                        if "site" in bnd_subactor_data.keys():
                            mod_json["enzyme_bnd_site"] =\
                                bnd_subactor_data["site"][1]

                # enzymatic and binding sites can coincide
                elif "in_sites" in enzyme_subactors[
                        "enzymeLigandBindingActorSelection"].keys() and\
                     len(enzyme_subactors[
                        "enzymeLigandBindingActorSelection"]) > 0:
                    bnd_subactor_data = enzyme_subactors[
                        "enzymeLigandBindingActorSelection"]["in_sites"]
                    # acting and binding sites are the same
                    if "enzymeLigandActorSelection" in enzyme_subactors.keys() and\
                       "in_sites" in enzyme_subactors["enzymeLigandActorSelection"].keys() and\
                       bnd_subactor_data[0] ==\
                       enzyme_subactors["enzymeLigandActorSelection"]["in_sites"][0]:
                        mod_json["enzyme_bnd_subactor"] = "site"
                    else:
                        mod_json["enzyme_bnd_site"] =\
                            bnd_subactor_data[1]

            # process substrate binding subactors
            if "substrateLigandBindingActorSelection" in substrate_subactors.keys():
                # target and binding regions can coincide
                if "in_regions" in substrate_subactors[
                   "substrateLigandBindingActorSelection"].keys() and\
                    len(substrate_subactors[
                        "substrateLigandBindingActorSelection"]["in_regions"]) > 0:
                    bnd_subactor_data = substrate_subactors[
                        "substrateLigandBindingActorSelection"]["in_regions"]
                    if "in_regions" in target_subactor.keys() and\
                       bnd_subactor_data["region"][0] ==\
                       target_subactor["in_regions"]["region"][0]:
                        if "site" in bnd_subactor_data.keys():
                            # acting and binding sites are the same
                            if "site" in target_subactor["in_regions"].keys() and \
                               bnd_subactor_data["site"][0] ==\
                               target_subactor["in_regions"]["site"][0]:
                                mod_json["substrate_bnd_subactor"] =\
                                    "site"
                            # acting and binding sites are different
                            else:
                                mod_json["substrate_bnd_subactor"] =\
                                    "region"
                                mod_json["substrate_bnd_site"] =\
                                    bnd_subactor_data["site"][1]
                        else:
                            mod_json["substrate_bnd_subactor"] = "region"
                    else:
                        # acting and binding regions are not the same
                        mod_json["substrate_bnd_region"] =\
                            bnd_subactor_data["region"][1]
                        if "site" in bnd_subactor_data.keys():
                            mod_json["substrate_bnd_site"] =\
                                bnd_subactor_data["site"][1]

                # target and binding regions can coincide
                if "in_sites" in substrate_subactors[
                   "substrateLigandBindingActorSelection"].keys() and\
                    len(substrate_subactors[
                        "substrateLigandBindingActorSelection"]["in_sites"]) > 0:
                    bnd_subactor_data = substrate_subactors[
                        "substrateLigandBindingActorSelection"]["in_sites"]
                    if "in_sites" in target_subactor.keys() and\
                       bnd_subactor_data[0] ==\
                       target_subactor["in_sites"][0]:
                        mod_json["substrate_bnd_subactor"] = "site"
                    else:
                        mod_json["substrate_bnd_site"] =\
                            bnd_subactor_data[1]
            mod = LigandModification.from_json(mod_json)
            return mod
    else:
        bnd_json = {}
        # process left actor
        wanted_left_subactor = None
        if "leftBindingActorSelection" in form.keys():
            wanted_left_subactor = {
                "leftBindingActorSelection": form[
                    "leftBindingActorSelection"]
            }
        left_gene, subactors, _ = retrieve_actor(
            form, "left", wanted_left_subactor)

        if "leftBindingActorSelection" in subactors.keys():
            bnd_json["left"] = _process_actor(
                left_gene, subactors["leftBindingActorSelection"])
        else:
            bnd_json["left"] = _process_actor(
                left_gene, {})

        # process right actor
        wanted_right_subactor = None
        if "rightBindingActorSelection" in form.keys():
            wanted_right_subactor = {
                "rightBindingActorSelection": form[
                    "rightBindingActorSelection"]
            }

        right_gene, subactors, _ = retrieve_actor(
            form, "right", wanted_right_subactor)

        if "rightBindingActorSelection" in subactors.keys():
            bnd_json["right"] = _process_actor(
                right_gene, subactors["rightBindingActorSelection"])
        else:
            bnd_json["right"] = _process_actor(
                right_gene, {})

        bnd = Binding.from_json(bnd_json)
        return bnd
