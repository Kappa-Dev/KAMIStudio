var AG_META_SIZES = {
  "gene":25,
  "region":15,
  "site":10,
  "residue":7,
  "state":5,
  "mod":15,
  "bnd":15
};

var META_COLORS = {
  // "gene":"#FFA19E",
  "gene":"#8db1d1",
  // "gene": "#ed757a",
  "region":"#ffb080",
  "site":"#ffd780",
  "residue": "#F68EA0",
  // "residue":"#ccb3ff",
  "state":"#A3DEFF",
  // "mod":"#9DAEFD",
  "mod": "#b775ed",
  // "bnd":"#9EFFC5"
  "bnd": "#7CCC9C",
};

var INSTANCE_META_COLORS = {
  // "gene":"#FFA19E",
  "gene": "#ed757a",
  "region":"#ffb080",
  "site":"#ffd780",
  "residue": "#F68EA0",
  // "residue":"#ccb3ff",
  "state":"#A3DEFF",
  // "mod":"#9DAEFD",
  "mod": "#b775ed",
  // "bnd":"#9EFFC5"
  "bnd": "#7CCC9C",
};


HIGHLIGHT_COLOR = "#337ab7";
INSTANCE_HIGHLIGHT_COLOR = "#a11117";


function displayHiddenSvg() {
	document.getElementById("actionGraphSvg").style.display = "initial";		
	document.getElementById("saveLayoutButton").disabled = false;
}


function handleNodeClick(highlight) {
	return function(d, i) {
		// deselect all the selected elements
	    svg = d3.select("#actionGraphSvg");

	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    svg.selectAll("circle")
	      .attr("stroke-width", 0);
	    // select current element
		d3.select(this)
	      .attr("stroke-width", 2)
	      .attr("stroke", d3.rgb(highlight));

	    // call react func
	};
}

function handleEdgeClick(highlight) {
	return function(d, i) {
		// deselect all the selected elements
		svg = d3.select("#actionGraphSvg");

	    svg.selectAll("circle")
	      .attr("stroke-width", 0);
	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    d3.select(this)
	      // .attr("stroke-width", 2)
	      .select(".arrow")
	      .style("stroke", d3.rgb(highlight))
	      .attr("marker-end", "url(#actionGraphSvgarrow-selected)");
	};
}

function handleDragStarted(graph, metaTyping) {
	return function(d) {
		if ((metaTyping[d.id] != "state") &&
			(metaTyping[d.id] != "bnd") && 
			(metaTyping[d.id] != "mod")) {
			return getAllComponents(
				graph, metaTyping, d.id);
		} else {
			return [];
		}
	}
}

function getActionGraphAndVisualize(model_id, workerUrl, instantiated=false) {
  	// use AJAX to send request for retrieving the nugget data
  	$.ajax({
	    url: model_id + "/raw-action-graph",
	    type: 'get',
	    dataType: "json",
		xhr: function () {
	        var xhr = $.ajaxSettings.xhr();
	        xhr.onprogress = function(e) {
	            if (e.lengthComputable) {
	                updateAGLoadingProgress(e.loaded / e.total);
	            }
	        };
	        return xhr;
	    }
	}).done(function (data) {
	    var actionGraph = data["actionGraph"],
	    	metaTyping = data["metaTyping"],
	    	nodePos = data["nodePosition"],
	    	nodePosUpdateUrl = model_id + "/update-ag-node-positioning",
	    	nodeSizes = computeNodeSizes(actionGraph, metaTyping, AG_META_SIZES);

	    var nodeColors;
	    if (instantiated) {
		    nodeColors = computeNodeColors(
		    	actionGraph, metaTyping, INSTANCE_META_COLORS);
		} else {
			nodeColors = computeNodeColors(
		    	actionGraph, metaTyping, META_COLORS);
		}
		
		// initNodePosition(actionGraph, nodePos, fix=Object.keys(nodePos));
		initLinkStrengthDistance(actionGraph, metaTyping);
		initCircleRadius(actionGraph, metaTyping, AG_META_SIZES);

		simulationConf = {
			"charge_strength": -400,
			"collide_strength": 1.8,
		}

		progressConf = {
			"remove_progress": removeProgressBlock,
			"init_svg": displayHiddenSvg,
			"init_layout_progress": initilizeLayoutProgressBar,
			"init_update_progress": initializePositionUpdateProgressBar,
			"ag_loading_progress": updateAGLoadingProgress
		}

		var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

		visualiseGraph(actionGraph,
					   "actionGraphSvg", 
						nodeColors, nodeSizes,
						null,
						highlightedEdgeStroke=highlight,
						simulationConf=simulationConf,
						progressConf=progressConf,
						workerUrl=workerUrl, 
						nodePosUpdateUrl=nodePosUpdateUrl,
                     	onNodeClick=handleNodeClick(highlight), 
                     	onEdgeClick=handleEdgeClick(highlight),
                     	onNodeDragStarted=handleDragStarted(actionGraph, metaTyping),
                    	threshold=300);
	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}
