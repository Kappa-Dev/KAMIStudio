function activateGlobalLink(element) {
	var otherLinks = $(".nav-link.global"),
		currentLink = $(element);
	otherLinks.removeClass("active");
	otherLinks.parent().removeClass("active");
	currentLink.addClass("active");
	currentLink.parent().addClass("active");
}

function loadModelsTab(element, corpusId, readonly=false) {
	switchToModels(element);
	// showModelList(corpusId, readonly);
	$("#switchToModelsTab").attr("onClick", "switchToModels(this);");
}

function loadHistoryTab(element, corpusId, readonly=false) {
	switchToHistory(element);
	// getData(
	// 	corpusId + "/revision-history",
	// 	renderHistoryView(corpusId, readonly));
	$("#switchToHistory").attr("onClick", "switchToHistory(this);");
}

function switchToKnowledge(element) {
	addAGTransition();
	activateGlobalLink(element);
	$("#knowledgeTab").css("visibility", "initial");
	$("#modelsTab").css("visibility", "hidden");
	$("#historyTab").css("visibility", "hidden");
	$("#metaDataTab").css("visibility", "hidden");
}

function switchToModels(element) {
	removeAGTransition();
	activateGlobalLink(element);
	$("#knowledgeTab").css("visibility", "hidden");
	$("#modelsTab").css("visibility", "initial");
	$("#historyTab").css("visibility", "hidden");
	$("#metaDataTab").css("visibility", "hidden");
}

function switchToHistory(element) {
	removeAGTransition();
	activateGlobalLink(element);
	$("#knowledgeTab").css("visibility", "hidden");
	$("#modelsTab").css("visibility", "hidden");
	$("#historyTab").css("visibility", "initial");
	$("#metaDataTab").css("visibility", "hidden");
}
