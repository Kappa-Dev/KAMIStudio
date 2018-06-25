var regionForms = {};
var siteForms = {};
var residueForms = {};
var stateForms = {};


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
	}
}

function switchToMod(x) {
	if (x.checked) {
	 document.getElementById("bnd").style.display = "none";
	 document.getElementById("mod").style.display = "initial";
	}
}

function switchModType(x) {
	if (x.value == "defaultMod") {
		document.getElementById("enzymeBlock").style.display = "initial";
		document.getElementById("substrateBlock").style.display = "initial";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "none";
	} else if (x.value == "anonymousMod") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "initial";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "none";
	} else if (x.value == "selfMod") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "none";
		document.getElementById("enzimaticSubstrateBlock").style.display = "initial";
		document.getElementById("bindingConditionBlock").style.display = "none";
	} else if (x.value == "ligandMod") {
		document.getElementById("enzymeBlock").style.display = "initial";
		document.getElementById("substrateBlock").style.display = "initial";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "initial";	
	}
}


function addNewRegionForm(x, actorName) {
	if (actorName in regionForms) {
		regionForms[actorName] += 1;
	} else {
		regionForms[actorName] = 1;
	}

	var count = regionForms[actorName];

	var regionFormHTML = 
		'<div class="nested-form" id="' + actorName + 'RegionForm' + count + '">\n' +
		'	<div class="row">\n' +
		'		<div class="col-md-6">\n' +
		'			<h4 class=mb-3>Region</h4>\n' +
		'		</div>\n' +
		'		<div class="col-md-3">\n' +
		'			<a style="float: right;" class="btn btn-default btn-sm btn-block" onclick="removeForm(\'' + actorName + '\', \'RegionForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span> Remove</a>\n' +
		'		</div>\n' +
		'	</div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-9">\n' +
        '          <label for="' + actorName + 'RegionName' + count + '">Name</label>\n' +
        '          <input type="text" class="form-control" id="' + actorName + 'RegionName' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '   </div>\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-9">\n' +
        '            <label for="' + actorName + 'RegionInterpro' + count + '">InterPro ID</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'RegionInterpro' + count + '" placeholder="" value="">\n' +
        '        </div>\n' +
        '   </div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-3">\n' +
        '           <label for="' + actorName + 'RegionStart' + count + '">Start</label>\n' +
        '           <input type="text" class="form-control" id="' + actorName + 'RegionStart' + count + '" placeholder="" value="" required>\n' +
        '       </div>\n' +
        '          <div class="col-md-3">\n' +
        '            <label for="' + actorName + 'RegionEnd' + count + '">End</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'RegionEnd' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '          <div class="col-md-3">\n' +
        '            <label for="' + actorName + 'RegionOrder' + count + '">Order</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'RegionOrder' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '   </div>\n\n' +
		'   <div class="row" style="margin-top: 15px;">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Sites</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <div id="' + actorName + 'Region' + count + 'SiteFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-site" onclick="addNewSiteForm(this, \'' + actorName + 'Region' + count + '\')"><span class="glyphicon glyphicon-plus"></span> Add site</a>\n' +
		'            </div>\n' +
		'   </div>\n\n' +
		'   <div class="row">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Residues</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <div id="' + actorName + 'Region' + count + 'ResidueFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue"><span class="glyphicon glyphicon-plus" onclick="addNewResidueForm(this, \'' + actorName + 'Region' + count + '\')"></span> Add residue</a>\n' +
		'            </div>\n' +
		'    </div>\n' +
		'    <div class="row ">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>States</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <!-- enzyme state addition form will go here-->\n' +
		'              <div id="' + actorName + 'Region' + count + 'StateFormFather"></div>\n' +
		'              <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Region' + count + '\')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'            </div>\n' +
		'          </div>\n' +
		'   </div>\n\n' +
        '   <div class="row">\n' +
        '		<div class="col-md-9">\n' +
        '			<hr class="mb-4">\n' +
        '		</div>\n'
        '   </div>\n' +
        '</div>';

    document.getElementById(actorName + "RegionFormFather").appendChild(htmlToElement(regionFormHTML));
}

function removeForm(actorName, formName, count) {
	document.getElementById(actorName + formName + count).remove();
}

function addNewSiteForm(x, actorName) {
	if (actorName in siteForms) {
		siteForms[actorName] += 1;
	} else {
		siteForms[actorName] = 1;
	}

	var count = siteForms[actorName];

	var siteFormHTML = 
		'<div class="nested-form" id="' + actorName + 'SiteForm' + count + '">\n' +
		'	<div class="row">\n' +
		'		<div class="col-md-6">\n' +
		'			<h4 class=mb-3>Site</h4>\n' +
		'		</div>\n' +
		'		<div class="col-md-3">\n' +
		'			<a style="float: right;" class="btn btn-default btn-sm btn-block" onclick="removeForm(\'' + actorName + '\', \'SiteForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span> Remove</a>\n' +
		'		</div>\n' +
		'	</div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-9">\n' +
        '          <label for="' + actorName + 'SiteName' + count + '">Name</label>\n' +
        '          <input type="text" class="form-control" id="' + actorName + 'SiteName' + count + '" placeholder="" value="">\n' +
        '       </div>\n' +
        '   </div>\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-9">\n' +
        '            <label for="' + actorName + 'SiteInterpro' + count + '">InterPro ID</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'SiteInterpro' + count + '" placeholder="" value="">\n' +
        '        </div>\n' +
        '   </div>\n\n' +
        '   <div class="row">\n' +
        '       <div class="col-md-3">\n' +
        '           <label for="' + actorName + 'SiteStart' + count + '">Start</label>\n' +
        '           <input type="text" class="form-control" id="' + actorName + 'SiteStart' + count + '" placeholder="" value="" required>\n' +
        '       </div>\n' +
        '          <div class="col-md-3">\n' +
        '            <label for="' + actorName + 'SiteEnd' + count + '">End</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'SiteEnd' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '          <div class="col-md-3">\n' +
        '            <label for="' + actorName + 'SiteOrder' + count + '">Order</label>\n' +
        '            <input type="text" class="form-control" id="' + actorName + 'SiteOrder' + count + '" placeholder="" value="">\n' +
        '          </div>\n' +
        '   </div>\n\n' +
		'   <div class="row" style="margin-top: 15px;"">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Residues</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-6 mb-6">\n' +
		'              <div id="' + actorName + 'Site' + count + 'ResidueFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue"><span class="glyphicon glyphicon-plus" onclick="addNewResidueForm(this, \'' + actorName + 'Site' + count + '\')"></span> Add residue</a>\n' +
		'            </div>\n' +
		'    </div>\n' +
		'    <div class="row ">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>States</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-3 mb-6">\n' +
		'              <!-- enzyme state addition form will go here-->\n' +
		'              <div id="' + actorName + 'Site' + count + 'StateFormFather"></div>\n' +
		'              <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Site' + count + '\')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'            </div>\n' +
		'          </div>\n' +
		'   </div>\n\n' +
        '   <div class="row">\n' +
        '		<div class="col-md-9">\n' +
        '			<hr class="mb-4">\n' +
        '		</div>\n'
        '   </div>\n' +
        '</div>';

    document.getElementById(actorName + "SiteFormFather").appendChild(
    	htmlToElement(siteFormHTML));
}

function removeSiteForm(x) {
	document.getElementById("siteForm").style.display = "none";
}

function addNewResidueForm(x, actorName) {

	if (actorName in siteForms) {
		residueForms[actorName] += 1;
	} else {
		residueForms[actorName] = 1;
	}

	var count = residueForms[actorName];

	var residueFormHTML = 
		'<div class="row">\n' +
        '  <div class="col-md-3">\n' +
        '      <label for="' + actorName + 'ResidueAA' + count + '">Amino acid</label>\n' +
        '      <input type="text" class="form-control" id="' + actorName + 'ResidueAA' + count + '" placeholder="" value="" required>\n' +
        '  </div>\n' +
        '  <div class="col-md-2">\n' +
        '    <label for="' + actorName + 'ResidueLoc' + count + '">Location</label>\n' +
        '    <input type="text" class="form-control" id="' + actorName + 'ResidueLoc' + count + '" placeholder="" value="" required>\n' +
        '  </div>\n' +
        '  <div class="col-md-4">\n' +
        '    <label for="' + actorName + 'ResidueTest' + count + '">Test</label><br>\n' +
        '    <input type="radio" value="true" name="' + actorName + 'ResidueTest' + count + '" checked> True</input> <input type="radio" value="false" name="' + actorName + 'ResidueTest' + count + '"> False</input>\n' +
        '  </div>\n' +
        '</div>\n';

    document.getElementById(actorName + "ResidueFormFather").appendChild(
    	htmlToElement(residueFormHTML));
}

function removeResidueForm(x) {
	document.getElementById("residueForm").style.display = "none";
}

function showStateForm(x) {
	document.getElementById("stateForm").style.display = "initial";
}

function removeStateForm(x) {
	document.getElementById("stateForm").style.display = "none";
}
