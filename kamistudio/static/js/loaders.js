
function showLoader(evt) {
	var loader = document.getElementById("loadingBlock");
	if (loader) {
		loader.style.display = 'initial';
	}
}

function showLoaderAndSubmit(formId) {
	showLoader();
	var form = document.getElementById(formId);
	console.log(form);
	form.submit();
}


function updateAGLoadingProgress(ratio) {
	if (document.getElementById('progressBar')) {
		document.getElementById('progressBar').style.width = ratio * 100 + "%";
	}
}


function initilizeLayoutProgressBar(instatiated) {
	if (document.getElementById('progressMessage')) {
		document.getElementById("progressMessage").innerHTML =
			"Computing force layout for the graph...";
	}

	var progressBlock = document.getElementById("progressBlock"),
		loadingBlock = document.getElementById("loadingBlock");

	if (progressBlock && loadingBlock) {
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
}


function initializePositionUpdateProgressBar() {
	if (document.getElementById("progressMessage") && 
		document.getElementById("progressBar")) {
		document.getElementById("progressMessage").innerHTML =
			"Updating force layout with new nodes...";
		document.getElementById("progressBar").style.width = "1%";
	}
}

function removeProgressBlock() {
	if (document.getElementById("progressBlock")) {
		var progressBlock = document.getElementById("progressBlock");
		progressBlock.parentNode.removeChild(progressBlock);
	}
}