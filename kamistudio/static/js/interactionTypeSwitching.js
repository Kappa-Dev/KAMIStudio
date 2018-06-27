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

	 document.getElementById("leftUniprotAC").required = true;
	 document.getElementById("rightUniprotAC").required = true;
	 document.getElementById("enzymeUniprotAC").required = false;
	 document.getElementById("substrateUniprotAC").required = false;
	 document.getElementById("enzymeSubUniprotAC").required = false;
	 
	}
}

function switchToMod(x) {
	if (x.checked) {
		document.getElementById("bnd").style.display = "none";
		document.getElementById("mod").style.display = "initial";
		document.getElementById("leftUniprotAC").required = false;
		document.getElementById("rightUniprotAC").required = false;

		var modType = document.getElementById("modTypeSelection");
		if (modType.options[modType.selectedIndex].value == "Modification") {
			document.getElementById("enzymeUniprotAC").required = true;
			document.getElementById("substrateUniprotAC").required = true;
			document.getElementById("enzymeSubUniprotAC").required = false;
		} else if (modType.options[modType.selectedIndex].value == "AnonymousModification") {
			document.getElementById("enzymeUniprotAC").required = false;
			document.getElementById("substrateUniprotAC").required = true;
			document.getElementById("enzymeSubUniprotAC").required = false;
		} else if (modType.options[modType.selectedIndex].value == "SelfModification") {
			document.getElementById("enzymeUniprotAC").required = false;
			document.getElementById("substrateUniprotAC").required = false;
			document.getElementById("enzymeSubUniprotAC").required = true;
		} else if (modType.options[modType.selectedIndex].value == "LigandModification") {
			document.getElementById("enzymeUniprotAC").required = true;
			document.getElementById("substrateUniprotAC").required = true;
			document.getElementById("enzymeSubUniprotAC").required = false;
		} 

	}
}

function switchModType(x) {
	if (x.value == "defaultMod") {
		document.getElementById("enzymeBlock").style.display = "inline-block";
		document.getElementById("substrateBlock").style.display = "inline-block";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = true;
		document.getElementById("substrateUniprotAC").required = true;
		document.getElementById("enzymeSubUniprotAC").required = false;
	} else if (x.value == "anonymousMod") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "inline-block";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = false;
		document.getElementById("substrateUniprotAC").required = true;
		document.getElementById("enzymeSubUniprotAC").required = false;
	} else if (x.value == "selfMod") {
		document.getElementById("enzymeBlock").style.display = "none";
		document.getElementById("substrateBlock").style.display = "none";
		document.getElementById("enzimaticSubstrateBlock").style.display = "inline-block";
		document.getElementById("bindingConditionBlock").style.display = "none";

		document.getElementById("enzymeUniprotAC").required = false;
		document.getElementById("substrateUniprotAC").required = false;
		document.getElementById("enzymeSubUniprotAC").required = true;
	} else if (x.value == "ligandMod") {
		document.getElementById("enzymeBlock").style.display = "inline-block";
		document.getElementById("substrateBlock").style.display = "inline-block";
		document.getElementById("enzimaticSubstrateBlock").style.display = "none";
		document.getElementById("bindingConditionBlock").style.display = "inline-block";

		document.getElementById("enzymeUniprotAC").required = true;
		document.getElementById("substrateUniprotAC").required = true;
		document.getElementById("enzymeSubUniprotAC").required = false;
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
        '   </div>\n\n' +
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
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-site" onclick="addNewSiteForm(this, \'' + actorName + 'Region' + count + '\')"><span class="glyphicon glyphicon-plus"></span> Add site</a>\n' +
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
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue" onclick="addNewResidueForm(this, \'' + actorName + 'Region' + count + '\')"><span class="glyphicon glyphicon-plus"></span> Add residue</a>\n' +
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
		'            <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Region' + count + '\')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'        </div>\n' +
		'   </div>\n' +
        // '   <div class="row">\n' +
        // '   	<div class="col-md-12">\n' +
        // '   		<hr class="mb-2">\n' +
        // '		</div>\n' +
        // '   </div>\n\n' +
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
        '   </div>\n\n' +
        '   <hr class="mb-2">\n\n' +
		'   <div class="row">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>Residues</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <div id="' + actorName + 'Site' + count + 'ResidueFormFather"></div>\n' +
		'              <a type="button" class="btn btn-default btn-md panel-button add-button add-enzyme-residue" onclick="addNewResidueForm(this, \'' + actorName + 'Site' + count + '\')"><span class="glyphicon glyphicon-plus"></span> Add residue</a>\n' +
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
		'              <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Site' + count + '\')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'          </div>\n' +
		'   </div>\n\n' +
		// '   <div class="row">\n' +
  //       '		<div class="col-md-12">\n' +
  //       '			<hr class="mb-7">\n' +
  //       '		</div>\n'
  //       '   </div>\n' +
        '</div>';

    document.getElementById(actorName + "SiteFormFather").appendChild(
    	htmlToElement(siteFormHTML));
}


function addNewResidueForm(x, actorName) {

	if (actorName in residueForms) {
		residueForms[actorName] += 1;
	} else {
		residueForms[actorName] = 1;
	}

	var count = residueForms[actorName];

	var residueFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'ResidueForm' + count + '">\n' +
		'	<div class="row">\n' +
        '  		<div class="col-md-3">\n' +
        '    	 	 <label for="' + actorName + 'ResidueAA' + count + '">Amino acid</label>\n' +
        '     		 <input type="text" class="form-control" name="' + actorName + 'ResidueAA' + count + '"  id="' + actorName + 'ResidueAA' + count + '" placeholder="" value="" required>\n' +
        ' 		</div>\n' +
        ' 		<div class="col-md-2">\n' +
        '   		 <label for="' + actorName + 'ResidueLoc' + count + '">Location</label>\n' +
        '   		 <input type="text" class="form-control" name="' + actorName + 'ResidueLoc' + count + '"  id="' + actorName + 'ResidueLoc' + count + '" placeholder="" value="" >\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-3">\n' +
        '    		<label for="' + actorName + 'ResidueTest' + count + '">Test</label><br>\n' +
        '    		<input type="radio" value="true" name="' + actorName + 'ResidueTest' + count + '" checked> True</input><br><input type="radio" value="false" name="' + actorName + 'ResidueTest' + count + '"> False</input>\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
		'	   		<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'ResidueForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'  		</div>\n' +
        '	</div>\n' +
        '    <div class="row ">\n' +
		'            <div class="col-md-2 mb-3">\n' +
		'              <label>States</label>\n' +
		'            </div>\n' +
		'            <div class="col-md-10 mb-6">\n' +
		'              <!-- enzyme state addition form will go here-->\n' +
		'              <div id="' + actorName + 'Residue' + count + 'StateFormFather"></div>\n' +
		'              <a type="button" onclick="addNewStateForm(this, \'' + actorName + 'Residue' + count + '\')" class="btn btn-default btn-md panel-button add-button add-enzyme-state"><span class="glyphicon glyphicon-plus"></span> Add state</a>\n' +
		'          </div>\n' +
		'   </div>\n\n' +
        // '   <div class="row">\n' +
        // '		<div class="col-md-12">\n' +
        // '			<hr class="mb-4">\n' +
        // '		</div>\n'
        // '   </div>\n' +
        '</div>\n\n';

    document.getElementById(actorName + "ResidueFormFather").appendChild(
    	htmlToElement(residueFormHTML));
}

function addNewStateForm(x, actorName) {
	if (actorName in stateForms) {
		stateForms[actorName] += 1;
	} else {
		stateForms[actorName] = 1;
	}

	var count = stateForms[actorName];

	var stateFormHTML = 
		'<div class="form-block nested-form" id="' + actorName + 'StateForm' + count + '">\n' +
		'	<div class="row">\n' +
        '  		<div class="col-md-4">\n' +
        '    	 	 <label for="' + actorName + 'StateName' + count + '">Name</label>\n' +
        '     		 <input type="text" class="form-control" name="' + actorName + 'StateName' + count + '" id="' + actorName + 'ResidueAA' + count + '" placeholder="" value="" required>\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
        '    		<label for="' + actorName + 'StateTest' + count + '">Test</label><br>\n' +
        '    		<input type="radio" value="true" name="' + actorName + 'StateTest' + count + '" checked> True</input><br><input type="radio" value="false" name="' + actorName + 'StateTest' + count + '"> False</input>\n' +
        ' 		</div>\n' +
        '  		<div class="col-md-4">\n' +
		'	   		<button type="button" class="btn btn-default btn-sm remove-form-button" onclick="removeForm(\'' + actorName + '\', \'StateForm\', ' + count + ')"><span class="glyphicon glyphicon-remove"></span></button>\n' +
		'  		</div>\n' +
        '	</div>\n' +
        // '   <div class="row">\n' +
        // '		<div class="col-md-12">\n' +
        // '			<hr class="mb-4">\n' +
        // '		</div>\n'
        // '   </div>\n' +
        '</div>\n\n';

    document.getElementById(actorName + "StateFormFather").appendChild(
    	htmlToElement(stateFormHTML));
}


function checkAndSubmit(x) {

  var form = document.getElementById('interactionForm');
  var success = true;
  
  for(var i=0; i < form.elements.length; i++){
    if(form.elements[i].hasAttribute('required')) {

    	var parent = form.elements[i].parentElement;

    	console.log(form.elements[i].id);

    	if (form.elements[i].value === '') {
		    success = false;

		    for (var j = 0; j < parent.childNodes.length; j++) {
			    if (parent.childNodes[j].className == "invalid-feedback") {
			      	parent.childNodes[j].style.display = "initial";
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
  console.log(success);
  if (success == true) {
	 form.submit();
  } else {
  	document.getElementById("invalidFeedbackGlobal").style.display = "initial";
  	document.getElementById("invalidFeedbackGlobal").scrollIntoView(true);
  }

}; 
