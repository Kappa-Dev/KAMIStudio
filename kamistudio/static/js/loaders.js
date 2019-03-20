function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}


function showLoader() {
	var form = document.getElementById("modelImportForm");
	var loader = document.getElementById("loadingBlock");
	if (loader) {
		loader.style.display = 'initial';
		form.submit();
	}
	// loader.style.display = 'none';
}


function updateAGLoadingProgress(ratio) {
	document.getElementById('progressBar').style.width = ratio * 100 + "%";
}


function initilizeLayoutProgressBar(instatiated) {
	document.getElementById("progressMessage").innerHTML =
		"Computing force layout for the graph...";
	var progressBlock = document.getElementById("progressBlock"),
		loadingBlock = document.getElementById("loadingBlock");

	loadingBlock.parentNode.removeChild(loadingBlock);
	var barId =  "progressBar";
	var suffix = "";
	if (instatiated) {
		suffix = " instantiated";
	}

	var progressBar = htmlToElement(
		'<div id="progressBarBlock">' +
	    '    <div id="' + barId + '" class="progress-bar'+ suffix + '" role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100">' +
	    '    </div>' +
		'</div>\n');
	progressBlock.appendChild(progressBar);
	document.getElementById(barId).style.width = "1%";
}


function initializePositionUpdateProgressBar() {
	document.getElementById("progressMessage").innerHTML =
		"Updating force layout with new nodes...";
	document.getElementById("progressBar").style.width = "1%";
}

function removeProgressBlock() {
	var progressBlock = document.getElementById("progressBlock");
	progressBlock.parentNode.removeChild(progressBlock);
}