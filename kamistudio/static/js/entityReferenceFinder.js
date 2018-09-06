function showReferenceEntityCandidates(nodeId, nodeType) {
	var dropdown = document.getElementById("entityChoiceDropdown" + nodeId);

	// fetch all candidate entities from the action graph
	var entities = [];
	
	// fill up dropdown options 

	dropdown.classList.toggle("show");
}

function filterEntities() {
	console.log("Filtering entities");
}