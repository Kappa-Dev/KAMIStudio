function activateLink(element) {
	var otherLinks = $(".nav-link.inner"),
		currentLink = $(element);
	otherLinks.removeClass("active");
	otherLinks.parent().removeClass("active");
	currentLink.addClass("active");
	currentLink.parent().addClass("active");
}

function removeAGTransition() {
	$("#agSidebarWrapper").addClass('notransition');
	$("#agContentWrapper").addClass('notransition');
	$("#agSidebarWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
	$("#agContentWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
}

function addAGTransition() {
	$("#agSidebarWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
	$("#agSidebarWrapper").removeClass('notransition'); // Re-enable transitions

	$("#agContentWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
	$("#agContentWrapper").removeClass('notransition'); // Re-enable transitions
}

function switchToAG(element) {
	activateLink(element);
	addAGTransition()
	$("#nuggets").css("visibility", "hidden");
	$("#action_graph").css("visibility", "initial");
	$("#definitions").css("visibility", "hidden");
}

function switchToNuggets(element, instantiated) {
	activateLink(element);
	removeAGTransition()
	$("#nuggets").css("visibility", "initial");
	$("#action_graph").css("visibility", "hidden");
	if (!instantiated) {
		$("#definitions").css("visibility", "hidden");
	}
}

function loadNuggetsTab(element, modelId, instantiated=false, readonly=false) {
	switchToNuggets(element, instantiated);
	showNuggetList(modelId, instantiated, readonly);
	$("#switchToNuggetsTab").attr("onClick", "switchToNuggets(this);");
}

function loadDefinitionsTab(element, modelId, readonly=false) {
	switchToDefinitions(element);
	getData(
		modelId + "/definitions", renderDefinitionList(modelId, readonly));

	$("#switchToDefinitionsTab").attr("onClick", "switchToDefinitions(this);");
}


function switchToDefinitions(element) {
	removeAGTransition();
	activateLink(element);
	$("#definitions").css("visibility", "initial");
	$("#nuggets").css("visibility", "hidden");
	$("#action_graph").css("visibility", "hidden");
}