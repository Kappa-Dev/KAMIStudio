function activateLink(element) {
	var otherLinks = $(".nav-link"),
		currentLink = $(element);
	otherLinks.removeClass("active");
	otherLinks.parent().removeClass("active");
	currentLink.addClass("active");
	currentLink.parent().addClass("active");
}

function switchToAG(element) {
	activateLink(element);
	$("#nuggets").css("visibility", "hidden");
	$("#action_graph").css("visibility", "initial");
	$("#definitions").css("visibility", "hidden");
}

function switchToNuggets(element) {
	activateLink(element);
	$("#nuggets").css("visibility", "initial");
	$("#action_graph").css("visibility", "hidden");
	$("#definitions").css("visibility", "hidden");
}


function switchToDefinitions(element) {
	activateLink(element);
	$("#definitions").css("visibility", "initial");
	$("#nuggets").css("visibility", "hidden");
	$("#action_graph").css("visibility", "hidden");
}