/**
 * Untils for graphical nugget editing
 * 
 */

 var UNIPROT_URL_PREFIX = "https://www.uniprot.org/uniprot/";
 var INTERPRO_URL_PREFIX = "http://www.ebi.ac.uk/interpro/entry/";


function singleValueToString(obj, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = "";
	if (attr_name in obj.attrs) {
		value = obj.attrs[attr_name].data[0];
	} else {
		value = '<p class="faded">not specified</p>';
	}
	return value;
}

function replaceByPrepopulatedDropDown(nodeId, fieldName, valueName) {
	// replace TD element with `fieldName` by prepopulated text input
	var tdElement = $("#" + fieldName); 
	var tdText = tdElement.text();
	tdElement.empty()

	if (tdText == "not specified") {
		tdText = "";
	}

	inputHTML =
		'<select class="form-control" name="' + valueName +'" id="' + valueName + nodeId + '">\n' +
		'  <option name="' + valueName +'" id="' + valueName + nodeId + 'True" value="true">true</option>\n' +
		'  <option name="' + valueName +'" id="' + valueName + nodeId + 'False" value="false">false</option>\n' +
		'</select>';
	tdElement.append(htmlToElement(inputHTML));
	return tdText;
}

function replaceByPrepopulatedTextInput(nodeId, fieldName, valueName) {
	var tdElement = $("#" + fieldName); 
	var tdText = tdElement.text();
	tdElement.empty();

	if (tdText == "not specified") {
		tdText = "";
	}

	inputHTML =
		"<input type='text' class='form-control' autocomplete='off' class='metaDataInput' tabindex='3' type='text' " +
		"name='" + valueName + nodeId + "' id='" + valueName + nodeId + "' value='" + tdText + "'>";
	tdElement.append(htmlToElement(inputHTML));
	return tdText;
}

function replaceByText(nodeId, fieldName, fieldValue, linkPrefix=null) {
	var tdElement = $("#" + fieldName);
	tdElement.empty();

	if (fieldValue == "") {
		tdElement.append(htmlToElement("<p class='faded'>not specified</p>"));
	} else {
		if (linkPrefix) {
			tdElement.append(htmlToElement("<a href='" + linkPrefix + fieldValue + "'>" + fieldValue + "</a>"));
		} else {
			tdElement.append(fieldValue);
		}
	}
}

function newEditNodeButton(nodeId, nodeType) {
	return '<a type="button" id="editButton" class="btn btn-default btn-md center-block edit-sidebar-block-button" onclick="editNodeMetaData(this, \'' + nodeId + '\', \'' + nodeType + '\')"><span class="glyphicon glyphicon-pencil edit-sign"></span> Edit</a>\n';    
}

function generateEditNodeButton(nodeId, nodeType){
  buttonHTML = newEditNodeButton(nodeId, nodeType);
  return buttonHTML;
}


function newEditEdgeButton(sourceId, targetId, sourceType, targetType) {
	return '<a type="button" id="editButton" class="btn btn-default btn-md center-block edit-sidebar-block-button" onclick="editEdgeMetaData(this, \'' + sourceId + '\', \'' + targetId + '\', \'' + sourceType + '\', \'' + targetType + '\')"><span class="glyphicon glyphicon-pencil edit-sign"></span> Edit</a>\n';
    
}

function generateEditEdgeButton(sourceId, targetId, sourceType, targetType){
  buttonHTML = newEditEdgeButton(sourceId, targetId, sourceType, targetType);
  return buttonHTML;
}


function editNodeMetaData(element, nodeId, nodeType) {
	// Change meta-data table to input
	data = {};
	if (nodeType == "gene") {
		data["uniprotId"] = replaceByPrepopulatedTextInput(nodeId, "uniprotidTD", "uniprotId");
		data["hgncSymbol"] = replaceByPrepopulatedTextInput(nodeId, "hgncSymbolTD", "hgncSymbol");
		data["synonyms"] = replaceByPrepopulatedTextInput(nodeId, "synonymsTD", "synonyms");
	} else if ((nodeType == "region") || (nodeType == "site")) {
		data["name"] = replaceByPrepopulatedTextInput(nodeId, "nameTD", "name");
		data["interproId"] = replaceByPrepopulatedTextInput(nodeId, "interproIdTD", "interproId");
	} else if (nodeType == "residue") {
		data["aa"] = replaceByPrepopulatedTextInput(nodeId, "aaTD", "aa");
		data["test"] = replaceByPrepopulatedDropDown(nodeId, "testTD", "test");
	} else if (nodeType == "state") {
		data["name"] = replaceByPrepopulatedTextInput(nodeId, "nameTD", "name");
		data["test"] = replaceByPrepopulatedDropDown(nodeId, "testTD", "test");
	} else if (nodeType == "bnd") {
		data["rate"] = replaceByPrepopulatedTextInput(nodeId, "rateTD", "rate");
		data["desc"] = replaceByPrepopulatedTextInput(nodeId, "descTD", "desc");
	} else if (nodeType == "mod") {
		data["value"] = replaceByPrepopulatedDropDown(nodeId, "valueTD", "value");
		data["rate"] = replaceByPrepopulatedTextInput(nodeId, "rateTD", "rate");
		data["desc"] = replaceByPrepopulatedTextInput(nodeId, "descTD", "desc");
	}
	// Change buttons
	var buttonParent = element.parentNode;

	saveCanelButtonsHtml =
		'<div style="float: right;">\n' + 
		'  <a type="button" id="cancelButton" class="btn btn-default btn-md"><span class="glyphicon glyphicon-remove edit-sign"></span> Cancel</a>\n' +  
		'  <a type="button" id="saveButton" class="btn btn-primary btn-md float-right" onclick=""><span class="glyphicon glyphicon-ok edit-sign"></span> Save</a>\n' +
		'</div>\n'; 

	buttonParent.removeChild(element);
	buttonParent.appendChild(htmlToElement(saveCanelButtonsHtml));

	$("#cancelButton").click(function() {

	  // Change meta-data table to input
	  if (nodeType == "gene") {
	    replaceByText(nodeId, "uniprotidTD", data["uniprotId"], UNIPROT_URL_PREFIX);
	    replaceByText(nodeId, "hgncSymbolTD", data["hgncSymbol"]);
	    replaceByText(nodeId, "synonymsTD", data["synonyms"]);
	  } else if ((nodeType == "region") || (nodeType == "site")) {
	    replaceByText(nodeId, "nameTD", data["name"]);
	    replaceByText(nodeId, "interproIdTD", data["interproId"], INTERPRO_URL_PREFIX);
	  } else if (nodeType == "residue") {
	    replaceByText(nodeId, "aaTD", data["aa"]);
	    replaceByText(nodeId, "testTD", data["test"]);
	  } else if (nodeType == "state") {
	    replaceByText(nodeId, "nameTD", data["name"]);
	    replaceByText(nodeId, "testTD", data["test"]);
	  } else if (nodeType == "bnd") {
	    replaceByText(nodeId, "rateTD", data["rate"]);
	    replaceByText(nodeId, "descTD", data["desc"]);
	  } else if (nodeType == "mod") {
	    replaceByText(nodeId, "valueTD", data["value"]);
	    replaceByText(nodeId, "rateTD", data["rate"]);
	    replaceByText(nodeId, "descTD", data["desc"]);
	  }

	  $(this)
	  	.parent()
	  	.parent()
	  	.empty()
	  	.append(htmlToElement(newEditNodeButton(nodeId, nodeType)));
	});
}


function editEdgeMetaData(element, sourceId, targetId, sourceType, targetType) {
	// Change meta-data table to input

	data = {};
	if (targetType == "gene") {
	  if ((sourceType == "region") || (sourceType == "site")) {
	    data["start"] = replaceByPrepopulatedTextInput(sourceId + targetId, "startTD", "start");
	    data["end"] = replaceByPrepopulatedTextInput(sourceId + targetId, "endTD", "end");
	    data["order"] = replaceByPrepopulatedTextInput(sourceId + targetId, "orderTD", "order");
	  } else if (sourceType == "residue") {
	    data["loc"] = replaceByPrepopulatedTextInput(sourceId + targetId, "locTD", "loc");
	  }
	} else if (targetType == "region") {
	  if (sourceType == "site") {
	    data["start"] = replaceByPrepopulatedTextInput(sourceId + targetId, "startTD", "start");
	    data["end"] = replaceByPrepopulatedTextInput(sourceId + targetId, "endTD", "end");
	    data["order"] = replaceByPrepopulatedTextInput(sourceId + targetId, "orderTD", "order");
	  } else if (sourceType == "residue") {
	    data["loc"] = replaceByPrepopulatedTextInput(sourceId + targetId, "locTD", "loc");
	  }
	} else if (targetType == "site") {
	  if (sourceType == "residue") {
	    data["loc"] = replaceByPrepopulatedTextInput(sourceId + targetId, "locTD", "loc");
	  }
	}
	// Change buttons
	var buttonParent = element.parentNode;

	saveCanelButtonsHtml =
		'<div style="float: right;">\n' + 
		'  <a type="button" id="cancelButton" class="btn btn-default btn-md" onclick="cancelEdgeEditng()"><span class="glyphicon glyphicon-remove edit-sign"></span> Cancel</a>\n' +  
		'  <a type="button" id="saveButton" class="btn btn-primary btn-md float-right" onclick=""><span class="glyphicon glyphicon-ok edit-sign"></span> Save</a>\n' +
		'</div>\n'; 

	buttonParent.removeChild(element);
	buttonParent.appendChild(htmlToElement(saveCanelButtonsHtml));

	$("#cancelButton").click(function() {

	  // Change meta-data table to input
	  if (targetType == "gene") {
	  	if ((sourceType == "region") || (sourceType == "site")) {
	  		replaceByText(sourceId + targetId, "startTD", data["start"]);
		    replaceByText(sourceId + targetId, "endTD", data["end"]);
		    replaceByText(sourceId + targetId, "orderTD", data["order"]);
	  	} else if (sourceType == "residue") {
	  		replaceByText(sourceId + targetId, "locTD", data["loc"]);
	  	}
	  } else if (targetType == "region") {
	  	if (sourceType == "site") {
	  		replaceByText(sourceId + targetId, "startTD", data["start"]);
		    replaceByText(sourceId + targetId, "endTD", data["end"]);
		    replaceByText(sourceId + targetId, "orderTD", data["order"]);
	  	} else if (sourceType == "residue") {
	  		replaceByText(sourceId + targetId, "locTD", data["loc"]);
	  	}
	  } else if (targetType == "site") {
	  	if (sourceType == "residue") {
	  		replaceByText(sourceId + targetId, "locTD", data["loc"]);
	  	}
	  }

	  $(this)
	  	.parent()
	  	.parent()
	  	.empty()
	  	.append(htmlToElement(newEditEdgeButton(sourceId, targetId, sourceType, targetType)));
	});
}


function cancelEdgeEditing() {

}
