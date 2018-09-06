function showLoader() {
	var form = document.getElementById("modelImportForm");
	var loader = document.getElementById("loadingBlock");
	loader.style.display = 'initial';
	form.submit();
	// loader.style.display = 'none';
}


function updateAGLoadingProgress(ratio) {
	document.getElementById('progressBar').style.width = ratio * 100 + "%";
}


function initilizeLayoutProgressBar() {
	document.getElementById("progressBarMessage").innerHTML =
		"Computing force layout for the graph...";
	document.getElementById("progressBar").style.width = "1%";
}


function initializePositionUpdateProgressBar() {
	document.getElementById("progressBarMessage").innerHTML =
		"Updating force layout with new nodes...";
	document.getElementById("progressBar").style.width = "1%";
}

function removeProgressBlock() {
	var progressBlock = document.getElementById("progressBlock");
	progressBlock.parentNode.removeChild(progressBlock);
}