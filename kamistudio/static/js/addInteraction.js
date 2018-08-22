var regionForms = {};
var siteForms = {};
var residueForms = {};
var stateForms = {};
// var targetImplicit = false;


function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function switchToBnd(x) {
	if (x.checked) {
	 document.getElementById("mod").style.display = "none";
	 document.getElementById("bnd").style.display = "initial";

	 document.getElementById("leftUniprotAC").required = true;
	 document.getElementById("rightUniprotAC").required = true;
	 document.getElementById("enzymeUniprotAC").required = false;
	 document.getElementById("substrateUniprotAC").required = false;
	 document.getElementById("enzymeSubUniprotAC").required = false;
	 document.getElementById("enzymeLigandUniprotAC").required = false;
	 document.getElementById("substrateLigandUniprotAC").required = false;
	 document.getElementById("targetStateName").required = false;
	}
}

function switchToMod(x) {
	if (x.checked) {
		document.getElementById("bnd").style.display = "none";
		document.getElementById("mod").style.display = "initial";
		document.getElementById("leftUniprotAC").required = false;
		document.getElementById("rightUniprotAC").required = false;

		document.getElementById("targetStateName").required = true;

		var modType = document.getElementById("modTypeSelection");
		if (modType.options[modType.selectedIndex].value == "Modification") {
			document.getElementById("enzymeUniprotAC").required = true;
			document.getElementById("substrateUniprotAC").required = true;
			document.getElementById("enzymeSubUniprotAC").required = false;
		 	document.getElementById("enzymeLigandUniprotAC").required = false;
	 		document.getElementById("substrateLigandUniprotAC").required = false;
		} else if (modType.options[modType.selectedIndex].value == "AnonymousModification") {
			document.getElementById("enzymeUniprotAC").required = false;
			document.getElementById("substrateUniprotAC").required = true;
			document.getElementById("enzymeSubUniprotAC").required = false;
			document.getElementById("enzymeLigandUniprotAC").required = false;
	 		document.getElementById("substrateLigandUniprotAC").required = false;
		} else if (modType.options[modType.selectedIndex].value == "SelfModification") {
			document.getElementById("enzymeUniprotAC").required = false;
			document.getElementById("substrateUniprotAC").required = false;
			document.getElementById("enzymeSubUniprotAC").required = true;
			document.getElementById("enzymeLigandUniprotAC").required = false;
	 		document.getElementById("substrateLigandUniprotAC").required = false;
		} else if (modType.options[modType.selectedIndex].value == "LigandModification") {
			document.getElementById("enzymeUniprotAC").required = false;
			document.getElementById("substrateUniprotAC").required = false;
			document.getElementById("enzymeSubUniprotAC").required = false;
			document.getElementById("enzymeLigandUniprotAC").required = true;
	 		document.getElementById("substrateLigandUniprotAC").required = true;
		} 

	}
}


function switchModType(x) {
	if (x.value == "Modification") {
		document.getElementById("enzymeBlock").style.display = "inline-block";
		document.getElementById("substrateBlock").style.display = "inline-block";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("enzymeLigandBlock").style.display = "none";
		document.getElementById("substrateLigandBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = true;
		document.getElementById("substrateUniprotAC").required = true;
		document.getElementById("enzymeSubUniprotAC").required = false;
	 	document.getElementById("enzymeLigandUniprotAC").required = false;
 		document.getElementById("substrateLigandUniprotAC").required = false;
	} else if (x.value == "AnonymousModification") {
		console.log("here");
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "inline-block";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("enzymeLigandBlock").style.display = "none";
		document.getElementById("substrateLigandBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = false;
		document.getElementById("substrateUniprotAC").required = true;
		document.getElementById("enzymeSubUniprotAC").required = false;
	 	document.getElementById("enzymeLigandUniprotAC").required = false;
 		document.getElementById("substrateLigandUniprotAC").required = false;
	} else if (x.value == "SelfModification") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "none";
		document.getElementById("enzimaticSubstrateBlock").style.display = "inline-block";
		document.getElementById("enzymeLigandBlock").style.display = "none";
		document.getElementById("substrateLigandBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = false;
		document.getElementById("substrateUniprotAC").required = false;
		document.getElementById("enzymeSubUniprotAC").required = true;
		document.getElementById("enzymeLigandUniprotAC").required = false;
 		document.getElementById("substrateLigandUniprotAC").required = false;
	} else if (x.value == "LigandModification") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "none";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("enzymeLigandBlock").style.display = "inline-block";
		document.getElementById("substrateLigandBlock").style.display = "inline-block";

		document.getElementById("enzymeUniprotAC").required = false;
		document.getElementById("substrateUniprotAC").required = false;
		document.getElementById("enzymeSubUniprotAC").required = false;
		document.getElementById("enzymeLigandUniprotAC").required = true;
	 	document.getElementById("substrateLigandUniprotAC").required = true;
	}
}

function switchToStateTarget(x) {
	if (x.checked) {
	 document.getElementById("targetResidueForm").style.display = "none";
	 document.getElementById("targetStateForm").style.display = "inline-block";

	 document.getElementById("targetStateName").required = true;
	 document.getElementById("targetResidueAA").required = false;
	 document.getElementById("targetResidueStateName").required = false;	 
	}
}

function switchToResidueTarget(x) {
	if (x.checked) {
	 document.getElementById("targetResidueForm").style.display = "inline-block";
	 document.getElementById("targetStateForm").style.display = "none";

	 document.getElementById("targetStateName").required = false;
	 document.getElementById("targetResidueAA").required = true;
	 document.getElementById("targetResidueStateName").required = true;	
	}
}

function showInputTarget(x) {
	var targetSelectors = document.getElementsByClassName("target-select");
	for (var i = 0; i < targetSelectors.length; i++) {
		targetSelectors[i].checked = false;
	}
	var father = document.getElementById("predefinedTarget");
	father.innerHTML = "";
	console.log("here");
	console.log(document.getElementById('inputTarget').style.display);
	document.getElementById('inputTarget').style.display = "block";
	console.log(document.getElementById('inputTarget').style.display);
}

function switchModTarget(x, parentActor, parentType, count) {
	if (x.checked) {
		var targetSelectors = document.getElementsByClassName("target-select");
		for (var i = 0; i < targetSelectors.length; i++) {
			targetSelectors[i].checked = false;
		}
		x.checked = true;
		// prepopulate modification target block
		
		if (parentType == 'residue') {
			var aaInput = document.getElementById(parentActor + 'ResidueAA' + count);
			var locInput = document.getElementById(parentActor + 'ResidueLoc' + count);
			var testInput = document.getElementById(parentActor + 'ResidueTest' + count);
			var stateNameInput = document.getElementById(parentActor + 'ResidueStateName' + count);
			var stateTestInput = document.getElementById(parentActor + 'ResidueStateTest' + count);
			if (aaInput.value != "" && stateNameInput.value != "") {
				var prepulatedTargetHTML =
					'<div>\n'+
					'	<p>State <b>' + stateNameInput.value + 
					'	</b> of the residue <b>' + aaInput.value + locInput.value + '</b> was selected as the target <a href="#' + parentActor + 'ResidueForm' + count + '">here</a></p>\n' +
					'	<a type="button" class="btn btn-default btn-md panel-button add-button" onclick="showInputTarget(this)"><span class="glyphicon glyphicon-plus"></span> Input another target</a>\n' +
					'</div>\n';
				var father = document.getElementById("predefinedTarget");
				father.innerHTML = '';
				father.appendChild(htmlToElement(prepulatedTargetHTML));
				document.getElementById('inputTarget').style.display = "none";
				console.log('residue');
				console.log(document.getElementById("targetStateName").required);
				document.getElementById("targetStateName").required = false;
				console.log(document.getElementById("targetStateName").required);
				document.getElementById("targetResidueAA").required = false;
				document.getElementById("targetResidueStateName").required = false;	
			}
		} else {
			var stateNameInput = document.getElementById(parentActor + 'StateName' + count);
			var stateTestInput = document.getElementById(parentActor + 'StateTest' + count);
			if (stateNameInput.value != "") {
				var prepulatedTargetHTML =
					'<div>\n'+
					'	<p>State <b>' + stateNameInput.value + 
					'	</b> was selected as the target <a href="#' + parentActor + 'StateForm' + count + '">here</a></p>'+
					'	<a type="button" class="btn btn-default btn-md panel-button add-button" onclick="showInputTarget(this)"><span class="glyphicon glyphicon-plus"></span> Input another target</a>\n' +
					'</div>\n';
				var father = document.getElementById("predefinedTarget");
				father.innerHTML = '';
				father.appendChild(htmlToElement(prepulatedTargetHTML));
				document.getElementById('inputTarget').style.display = "none";
				document.getElementById("targetStateName").required = false;
				document.getElementById("targetResidueAA").required = false;
				document.getElementById("targetResidueStateName").required = false;	
			}
		}
	}
}


function switchActor(x, parentActor, topLevelActor, parentType, count) {
	if (x.checked) {
		var actorSelectors = document.getElementsByClassName("actor-select-" + topLevelActor);
		for (var i = 0; i < actorSelectors.length; i++) {
			actorSelectors[i].checked = false;
		}
		x.checked = true;
	}
}

function switchBindingActor(x, parentActor, topLevelActor, parentType, count) {
	if (x.checked) {
		var actorSelectors = document.getElementsByClassName("bnd-actor-select-" + topLevelActor);
		for (var i = 0; i < actorSelectors.length; i++) {
			actorSelectors[i].checked = false;
		}
		x.checked = true;
	}
}

function addNewRegionForm(
	x, actorName, addTargetCheckBox=false,
	addActorCheckBox=false, addBindingCheckbox=false) {
	if (actorName in regionForms) {
		regionForms[actorName] += 1;
	} else {
		regionForms[actorName] = 1;
	}

	var count = regionForms[actorName];

	actorCheckBoxHTML = "";
	if (addActorCheckBox == true) {
		actorCheckBoxHTML =
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchActor(this, \'' + actorName + '\', \'' + actorName + '\', \'region\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio actor-select-' + actorName + '" id="' + actorName + "Region" + count + '" value="' + actorName + "Region" + count + '" name="' + actorName + 'ActorSelection" /> Set as an actor of modification</label>\n' +
			'			</div>\n' +
			'		</div>\n';
	} 

	bindingCheckBoxHTML = "";
	if (addBindingCheckbox == true) {
		bindingCheckBoxHTML = 
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchBindingActor(this, \'' + actorName + '\', \'' + actorName + '\', \'region\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio bnd-actor-select-' + actorName + '" id="' + actorName + "Region" + count + '" value="' + actorName + "Region" + count + '" name="' + actorName + 'BindingActorSelection" /> Set as an actor of binding</label>\n' +
			'			</div>\n' +
			'		</div>\n';
	}

	var regionFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'RegionForm' + count + '">\n' +
		'	<div class="row">\n' +
		'		<div class="col-md-4">\n' +
		'			<h4 class=mb-3>Region</h4>\n' +
		'		</div>\n' +
		'		<div class="col-md-8">\n' +
		'			<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'RegionForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'		</div>\n' +
		'	</div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-4">\n' +
        '          <label for="' + actorName + 'RegionName' + count + '">Name</label>\n' +
        '          <input class="form-control" type="text" class="form-control" name="' + actorName + 'RegionName' + count + '" id="' + actorName + 'RegionName' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '       <div class="col-md-4">\n' +
        '            <label for="' + actorName + 'RegionInterpro' + count + '">InterPro ID</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'RegionInterpro' + count + '" id="' + actorName + 'RegionInterpro' + count + '" placeholder="" value="">\n' +
        '        </div>\n' +
        '   </div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-2">\n' +
        '           <label for="' + actorName + 'RegionStart' + count + '">Start</label>\n' +
        '           <input type="text" class="form-control" name="' + actorName + 'RegionStart' + count + '" id="' + actorName + 'RegionStart' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '          <div class="col-md-2">\n' +
        '            <label for="' + actorName + 'RegionEnd' + count + '">End</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'RegionEnd' + count + '" id="' + actorName + 'RegionEnd' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '		   <div class="col-md-2"></div>\n' +
        '          <div class="col-md-2">\n' +
        '            <label for="' + actorName + 'RegionOrder' + count + '">Order</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'RegionOrder' + count + '" id="' + actorName + 'RegionOrder' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '   </div>\n\n' + actorCheckBoxHTML + bindingCheckBoxHTML +
        '   <div class="row">\n' +
        '   	<div class="col-md-12">\n' +
        '   		<hr class="mb-2">\n' +
        '		</div>\n' +
        '   </div>\n\n' +
		'   <div class="row">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Sites</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <div id="' + actorName + 'Region' + count + 'SiteFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-site" onclick="addNewSiteForm(this, \'' + actorName + 'Region' + count + '\', \'' + actorName + '\', ' + addTargetCheckBox + ', ' + addActorCheckBox +', ' + addBindingCheckbox +')"><span class="glyphicon glyphicon-plus"></span> Add site</a>\n' +
		'            </div>\n' +
		'   </div>\n\n' +
        '   <div class="row">\n' +
        '   	<div class="col-md-12">\n' +
        '   		<hr class="mb-2">\n' +
        '		</div>\n' +
        '   </div>\n\n' +
		'   <div class="row">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Residues</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-3">\n' +
		'              <div id="' + actorName + 'Region' + count + 'ResidueFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue" onclick="addNewResidueForm(this, \'' + actorName + 'Region' + count + '\', ' + addTargetCheckBox + ')"><span class="glyphicon glyphicon-plus"></span> Add residue</a>\n' +
		'            </div>\n' +
		'    </div>\n\n' +
        '   <div class="row">\n' +
        '   	<div class="col-md-12">\n' +
        '   		<hr class="mb-2">\n' +
        '		</div>\n' +
        '   </div>\n\n' +
		'    <div class="row">\n' +
		'        <div class="col-md-2 mb-3">\n' +
		'              <label>States</label>\n' +
		'        </div>\n' +
		'        <div class="col-md-10 mb-3">\n' +
		'            <div id="' + actorName + 'Region' + count + 'StateFormFather"></div>\n' +
		'            <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Region' + count + '\', ' + addTargetCheckBox + ')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'        </div>\n' +
		'   </div>\n' +
        '</div>';
    document.getElementById(actorName + "RegionFormFather").appendChild(htmlToElement(regionFormHTML));
}

function removeForm(actorName, formName, count) {
	document.getElementById(actorName + formName + count).remove();
}

function addNewSiteForm(
	x, actorName, topLevelActor,
	addTargetCheckBox=false, addActorCheckBox=false,
	addBindingCheckbox=false) {
	if (actorName in siteForms) {
		siteForms[actorName] += 1;
	} else {
		siteForms[actorName] = 1;
	}

	var count = siteForms[actorName];

	actorCheckBoxHTML = "";
	if (addActorCheckBox == true) {
		actorCheckBoxHTML =
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchActor(this, \'' + actorName + '\', \'' + topLevelActor + '\', \'region\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio actor-select-' + topLevelActor + '" id="' + actorName + "Site" + count + '" value="' + actorName + "Site" + count + '" name="' + topLevelActor + 'ActorSelection" /> Set as an actor of modification</label>\n' +
			'			</div>\n' +
			'		</div>\n';
	}

	bindingCheckBoxHTML = "";
	if (addBindingCheckbox == true) {
		bindingCheckBoxHTML =
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchBindingActor(this, \'' + actorName + '\', \'' + topLevelActor + '\', \'region\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio bnd-actor-select-' + topLevelActor + '" id="' + actorName + "Site" + count + '" value="' + actorName + "Site" + count + '" name="' + topLevelActor + 'BindingActorSelection" /> Set as an actor of binding</label>\n' +
			'			</div>\n' +
			'		</div>\n';
	}

	var siteFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'SiteForm' + count + '">\n' +
		'	<div class="row">\n' +
		'		<div class="col-md-4">\n' +
		'			<h4 class=mb-3>Site</h4>\n' +
		'		</div>\n' +
		'		<div class="col-md-8">\n' +
		'			<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'SiteForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'		</div>\n' +
		'	</div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-4">\n' +
        '          <label for="' + actorName + 'SiteName' + count + '">Name</label>\n' +
        '          <input type="text" class="form-control" name="' + actorName + 'SiteName' + count + '"  id="' + actorName + 'SiteName' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '       <div class="col-md-4">\n' +
        '            <label for="' + actorName + 'SiteInterpro' + count + '">InterPro ID</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'SiteInterpro' + count + '"  id="' + actorName + 'SiteInterpro' + count + '" placeholder="" value="">\n' +
        '        </div>\n' +
        '   </div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-2">\n' +
        '           <label for="' + actorName + 'SiteStart' + count + '">Start</label>\n' +
        '           <input type="text" class="form-control" name="' + actorName + 'SiteStart' + count + '"  id="' + actorName + 'SiteStart' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '          <div class="col-md-2">\n' +
        '            <label for="' + actorName + 'SiteEnd' + count + '">End</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'SiteEnd' + count + '" id="' + actorName + 'SiteEnd' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '		   <div class="col-md-2"></div>\n' +
        '          <div class="col-md-2">\n' +
        '            <label for="' + actorName + 'SiteOrder' + count + '">Order</label>\n' +
        '            <input type="text" class="form-control" name="' + actorName + 'SiteOrder' + count + '" placeholder="" id="' + actorName + 'SiteOrder' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '   </div>\n\n' + actorCheckBoxHTML + bindingCheckBoxHTML +
        '   <hr class="mb-2">\n\n' +
		'   <div class="row">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Residues</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <div id="' + actorName + 'Site' + count + 'ResidueFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue" onclick="addNewResidueForm(this, \'' + actorName + 'Site' + count + '\', ' + addTargetCheckBox + ')"><span class="glyphicon glyphicon-plus"></span> Add residue</a>\n' +
		'            </div>\n' +
		'    </div>\n' +
		'    <hr class="mb-2">\n\n' +
		'    <div class="row ">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>States</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <!-- enzyme state addition form will go here-->\n' +
		'              <div id="' + actorName + 'Site' + count + 'StateFormFather"></div>\n' +
		'              <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Site' + count + '\', ' + addTargetCheckBox + ')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'          </div>\n' +
		'   </div>\n\n' +
        '</div>';

    document.getElementById(actorName + "SiteFormFather").appendChild(
    	htmlToElement(siteFormHTML));
}


function addNewResidueForm(x, actorName, addTargetCheckBox=false) {

	if (actorName in residueForms) {
		residueForms[actorName] += 1;
	} else {
		residueForms[actorName] = 1;
	}

	var count = residueForms[actorName];

	var targetCheckBoxHTML = "";
	if (addTargetCheckBox == true) {
		targetCheckBoxHTML = 
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchModTarget(this, \'' + actorName + '\', \'residue\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio target-select" id="' + actorName + "Residue" + count + '" value="' + actorName + "Residue" + count + '" name="targetSelection" /> Set as the target of modification</label>\n' +
			'			</div>\n' +
			'		</div>\n'
	}

	var residueFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'ResidueForm' + count + '">\n' +
		'	<div class="row">\n' +
        '  		<div class="col-md-3">\n' +
        '    	 	 <label for="' + actorName + 'ResidueAA' + count + '">Amino acid</label>\n' +
        '     		 <input type="text" class="form-control" name="' + actorName + 'ResidueAA' + count + '"  id="' + actorName + 'ResidueAA' + count + '" placeholder="" value="" required>\n' +
        '	      	 <div class="invalid-feedback" style="display: none;">\n' +
        '			   Residue amino acid is required.\n' +
        '			 </div>\n' + 
        ' 		</div>\n' +
        ' 		<div class="col-md-2">\n' +
        '   		 <label for="' + actorName + 'ResidueLoc' + count + '">Location</label>\n' +
        '   		 <input type="text" class="form-control" name="' + actorName + 'ResidueLoc' + count + '"  id="' + actorName + 'ResidueLoc' + count + '" placeholder="" value="" >\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-3">\n' +
        '    		<label for="' + actorName + 'ResidueTest' + count + '">Test</label><br>\n' +
        '    		<input  type="radio" value="true" name="' + actorName + 'ResidueTest' + count + '" checked/> True<br><input type="radio" value="false" name="' + actorName + 'ResidueTest' + count + '"/> False\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
		'	   		<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'ResidueForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'  		</div>\n' +
        '	</div>\n' +
        '    <div class="row ">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>State</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-3">\n' +
		'              <div class="form-block nested-form" id="' + actorName + 'Residue' + count + 'StateForm" style="display: none;">\n' +
		'					<div class="row">\n' +
        '  						<div class="col-md-4">\n' +
        '    	 	 				<label for="' + actorName + 'ResidueStateName' + count + '">Name</label>\n' +
        '     		 				<input type="text" class="form-control" name="' + actorName + 'ResidueStateName' + count + '" id="' + actorName + 'ResidueStateName' + count + '" placeholder="" value="">\n' +
        '							<div class="invalid-feedback" style="display: none;">\n' +
        '			                  Residue state name is required.\n' +
        '			                </div>\n' + 
        ' 						</div>\n' +
        '  						<div class="col-md-4">\n' +
        '    						<label for="' + actorName + 'ResidueStateTest' + count + '">Test</label><br>\n' +
        '    						<input type="radio" value="true" name="' + actorName + 'ResidueStateTest' + count + '" checked/> True<br><input type="radio" value="false" name="' + actorName + 'ResidueStateTest' + count + '"/> False\n' +
        ' 						</div>\n' +
        '  						<div class="col-md-4">\n' +
		'	   						<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="hideResidueState(\'' + actorName + 'Residue\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'  						</div>\n' + 
        '					</div>\n\n' + targetCheckBoxHTML +
		'              </div>\n' +
		'              <a type="button" id="' + actorName + 'Residue' + count + 'StateButton" onclick="showResidueState(this, \'' + actorName + 'Residue\', ' + count + ')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Specify state</a>\n' +
		'          </div>\n'
		'   </div>\n\n' +
        '</div>\n\n';

    document.getElementById(actorName + "ResidueFormFather").appendChild(
    	htmlToElement(residueFormHTML));
}

function showResidueState(x, residueName, residueId) {
	document.getElementById(residueName + residueId + "StateForm").style.display = "inline-block";
	document.getElementById(residueName + "StateName" + residueId).required = true;
	x.style.display = "none";
}

function hideResidueState(residueName, residueId) {
	document.getElementById(residueName + residueId + "StateForm").style.display = "none";
	document.getElementById(residueName + residueId + "StateButton").style.display = "initial";
	document.getElementById(residueName + "StateName" + residueId).required = false;
}

function addNewStateForm(x, actorName, addTargetCheckBox=false) {
	if (actorName in stateForms) {
		stateForms[actorName] += 1;
	} else {
		stateForms[actorName] = 1;
	}

	var count = stateForms[actorName];


	var targetCheckBoxHTML = "";
	if (addTargetCheckBox == true) {
		targetCheckBoxHTML = 
			'		<div class="row">\n' +
			'			<div class="col-md-12 mb-3">\n' +
			'				<label><input onclick="switchModTarget(this, \'' + actorName + '\', \'state\', ' + count + ')" style="display: inline-block;" type="checkbox" class="radio target-select" id="' + actorName + "Residue" + count + '" value="' + actorName + "Residue" + count + '" name="targetSelection" /> Set as the target of modification</label>\n' +
			'			</div>\n' +
			'		</div>\n'
	}

	var stateFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'StateForm' + count + '">\n' +
		'	<div class="row">\n' +
        '  		<div class="col-md-4">\n' +
        '    	 	 <label for="' + actorName + 'StateName' + count + '">Name</label>\n' +
        '     		 <input type="text" class="form-control" name="' + actorName + 'StateName' + count + '" id="' + actorName + 'StateName' + count + '" placeholder="" value="" required>\n' +
        '			 <div class="invalid-feedback" style="display: none;">\n' +
        '			   State name is required.\n' +
        '			 </div>\n' + 
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
        '    		<label for="' + actorName + 'StateTest' + count + '">Test</label><br>\n' +
        '    		<input type="radio" value="true" name="' + actorName + 'StateTest' + count + '" checked> True</input><br><input type="radio" value="false" name="' + actorName + 'StateTest' + count + '"> False</input>\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
		'	   		<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'StateForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'  		</div>\n' +
        '	</div>\n' + targetCheckBoxHTML +
        '</div>\n\n';

    document.getElementById(actorName + "StateFormFather").appendChild(
    	htmlToElement(stateFormHTML));
}


function checkAndSubmitForNuggetGeneration(x, previewUrl) {

  var form = document.getElementById('interactionForm');
  var success = true;
  
  for(var i=0; i < form.elements.length; i++){
    if(form.elements[i].hasAttribute('required') && form.elements[i].required == true) {

    	var parent = form.elements[i].parentElement;

    	console.log(form.elements[i].id);

    	if (form.elements[i].value === '') {
		    
		    for (var j = 0; j < parent.childNodes.length; j++) {
			    if (parent.childNodes[j].className == "invalid-feedback") {
			      	parent.childNodes[j].style.display = "initial";
			      	if (success == true) {
						success = false;
						parent.scrollIntoView(true);
					}
			    }        
			}
		} else {
			for (var j = 0; j < parent.childNodes.length; j++) {
			    if (parent.childNodes[j].className == "invalid-feedback") {
			      	parent.childNodes[j].style.display = "none";
			    }        
			}
		}
	}
  }
  if (success == true) {
  	console.log("Here");
  	$('#interactionForm').attr('action', previewUrl);
  	$('#interactionForm').submit();
  } else {
  	document.getElementById("invalidFeedbackGlobal").style.display = "initial";
  }

}; 


function checkAndSubmit(x) {

  var form = document.getElementById('interactionForm');
  var success = true;
  
  for(var i=0; i < form.elements.length; i++){
    if(form.elements[i].hasAttribute('required') && form.elements[i].required == true) {

    	var parent = form.elements[i].parentElement;

    	console.log(form.elements[i].id);

    	if (form.elements[i].value === '') {
		    
		    for (var j = 0; j < parent.childNodes.length; j++) {
			    if (parent.childNodes[j].className == "invalid-feedback") {
			      	parent.childNodes[j].style.display = "initial";
			      	if (success == true) {
						success = false;
						parent.scrollIntoView(true);
					}
			    }        
			}
		} else {
			for (var j = 0; j < parent.childNodes.length; j++) {
			    if (parent.childNodes[j].className == "invalid-feedback") {
			      	parent.childNodes[j].style.display = "none";
			    }        
			}
		}
	}
  }
  if (success == true) {
	 form.submit();
  } else {
  	document.getElementById("invalidFeedbackGlobal").style.display = "initial";
  }

}; 
