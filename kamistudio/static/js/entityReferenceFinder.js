function showReferenceEntityCandidates(hierarchyId, nodeId, nodeType) {
	var dropdown = document.getElementById("entityChoiceDropdown" + nodeId);
	
	if (!dropdown.classList.contains("active")) {
		// disactivate all other dropdowns
		var all_dropdows = document.getElementsByClassName("entity-choice-dropdown");
		for (var i=0; i < all_dropdows.length; i++) {
			all_dropdows[i].style.display = "none";
			if (all_dropdows[i].classList.contains("active")) {
				all_dropdows[i].classList.remove("active");
			
				for (var j=0; j < all_dropdows[i].childNodes.length; j++) {
					console.log(all_dropdows[i].childNodes[j]);
					console.log(all_dropdows[i].childNodes[j].tagName);
					if (all_dropdows[i].childNodes[j].tagName != "input") {
					    all_dropdows[i].removeChild(all_dropdows[i].childNodes[j]);
					}
				}
			}
		}

		// fetch all candidate entities from the action graph
		var entities = [];
		$.ajax({
		    url: "get-ag-elements-by-type/" + nodeType,
		    type: 'get',
		    dataType: "json",
		}).done(function (data) {
		    var elements = data[0]["elements"];
		    var candidates = {};
		    var filters = ["uniprotid"];
		    for (var i=0; i < elements.length; i++) {
		    	var synonyms = [];
		    	for (var key in elements[i].attrs) {
		    		if (!filters.includes(key)) {
			    		synonyms = synonyms.concat(elements[i].attrs[key]);
			    	}
		    	}
		    	candidates[elements[i].id] = synonyms;
		    }
		    for (var key in candidates) {
		    	var candidateRow =
		    		'<div class="row dropdown-row">\n' +
		            '	<div class="col-md-4 choice-node-id">\n' + key + '</div>' +
		            '   <div class="col-md-6 choice-meta-data"><p>\n' + candidates[key] +
		            '   	</p></div>\n'+
		            '   <a href="#" onclick="select(\'' + nodeId + '\',\'' + key + '\'); return false;">\n' +
		            '		<span class="link-span"></span>\n' +
		            '	</a>\n' +
		            '</div>';
		    	dropdown.appendChild(htmlToElement(candidateRow));
		    }
		    dropdown.style.display = "block";
		    dropdown.classList.add("active")
		}).fail(function (e) {
		    console.log("Failed to load candidate nodes");
		});
	} else {
		dropdown.style.display = "none";
		dropdown.classList.remove("active");
		for (var i=0; i < dropdown.childNodes.length; i++) {
			console.log(dropdown.childNodes[i]);
			console.log(dropdown.childNodes[i].tagName);
			if (dropdown.childNodes[i].tagName != "input") {
			    dropdown.removeChild(dropdown.childNodes[i]);
			}
		}
	}
}

function filterEntities(nodeId) {
	
    var input = document.getElementById("entityFilterInput" + nodeId);
    var filter = input.value.toUpperCase();
	
    var div = document.getElementById("entityChoiceDropdown" + nodeId);
    var rows = div.getElementsByClassName("dropdown-row");
    
    for (var i = 0; i < rows.length; i++) {
    	// get row's content
		var nodeId = rows[i].getElementsByClassName("choice-node-id")[0].innerHTML;
		var synonyms = rows[i].getElementsByClassName(
				"choice-meta-data")[0].getElementsByTagName("p")[0].innerHTML.split(',');

		var eligible = false;
		if  (nodeId.toUpperCase().indexOf(filter) > -1) {
			eligible = true;
		} else {
			for (var j=0; j < synonyms.length; j++) {
				if (synonyms[j].toUpperCase().indexOf(filter) > -1) {
					eligible = true;
					break;
				}
			}
		}

       	if (eligible) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }

}

function select(nodeId, typingNodeId) {
	document.getElementById("typingNodeIdOf" + nodeId).innerHTML = typingNodeId;
	var metaData = document.getElementById("typingNodeMetaDataOf" + nodeId);
	metaData.getElementsByTagName(
		"a")[0].classList.remove("disabled");
	var dropdown = document.getElementById("entityChoiceDropdown" + nodeId);
	dropdown.style.display = "none";
	dropdown.classList.remove("active");
	for (var i=0; i < dropdown.childNodes.length; i++) {
		console.log(dropdown.childNodes[i]);
		console.log(dropdown.childNodes[i].tagName);
		if (dropdown.childNodes[i].tagName != "input") {
		    dropdown.removeChild(dropdown.childNodes[i]);
		}
	}

	return false;
}

