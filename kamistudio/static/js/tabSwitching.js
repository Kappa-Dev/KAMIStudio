function activateGlobalLink(element) {
	var otherLinks = $(".nav-link.global"),
		currentLink = $(element);
	otherLinks.removeClass("active");
	otherLinks.parent().removeClass("active");
	currentLink.addClass("active");
	currentLink.parent().addClass("active");
}

function loadKnowledgeTab(element, corpusId, webWorkerUrl, readonly=false) {
	console.log("here");
	switchToKnowledge(element);
	showActionGraph(corpusId, webWorkerUrl, readonly);
	$("#switchToKnowledgeTab").attr("onClick", "switchToKnowledge(this);");
}
 
function loadModelsTab(element, corpusId, modelId=null, readonly=false) {
	switchToModels(element);
	$("#switchToModelsTab").attr("onClick", "switchToModels(this);");
	showModelList(corpusId, modelId, readonly);
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
	$(".tab-pane").removeClass("active")
	$("#knowledgeTab").addClass("active");
	$("#action_graph").addClass("active");
}

function switchToModels(element) {
	activateGlobalLink(element);
	removeAGTransition();
	$(".tab-pane").removeClass("active");
	$("#modelsTab").addClass("active");
	
}

function switchToHistory(element) {
	removeAGTransition();
	activateGlobalLink(element);
	$(".tab-pane").removeClass("active")
	$("#historyTab").addClass("active");
}
