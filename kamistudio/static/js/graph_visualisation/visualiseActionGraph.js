var AG_META_SIZES = {
  "gene":25,
  "region":15,
  "site":10,
  "residue":7,
  "state":5,
  "mod":15,
  "bnd":15
};


function initLinkStrengthDistance(graph, metaTyping) {
	// Initialize link strength depending on node meta-types
    for (var i=0; i < graph.links.length; i++) {
	    var d = graph.links[i];
	    d.strength = 0.09;
	    d.distance = 50;
	    if (metaTyping[d.target] == "gene") {
	      if (metaTyping[d.source] == "region") {
	        d.strength = 0.3;
	        d.distance = 10;
	      } else if (metaTyping[d.source] == "site") {
	        d.strength = 0.25;
	        d.distance = 15;
	      } else if (metaTyping[d.source] == "residue") {
	        d.strength = 0.22;
	        d.distance = 20;
	      } 
	    } else if (metaTyping[d.target] == "region") {
	      if (metaTyping[d.source] == "site") {
	        d.strength = 0.25;
	        d.distance = 10;
	      } else if ((metaTyping[d.source] == "residue")) {
	        d.strength = 0.22;
	        d.distance = 15;
	      } 
	    } else if (metaTyping[d.target] == "site") {
	      if (metaTyping[d.source] == "residue") {
	        d.strength = 0.22;
	        d.distance = 10;
	      } 
	    } else if (metaTyping[d.target] == "residue") {
	    	if (metaTyping[d.source] == "state") {
	    		d.strength = 0.3
	    		d.distance = 5;
	    	}
	    } else if (metaTyping[d.target] == "state") {
	      if (metaTyping[d.source] == "mod") {
	        d.strength = 0.15;
	      } 
	    } else if (metaTyping[d.target] == "bnd") {
	      d.strength = 0.1;
	    } else if (metaTyping[d.target] == "mod") {
	      d.strength = 0.1;
	    }
    	if (metaTyping[d.source] == "state") {
    		d.strength = 1;
    		d.distance = 10;
    	}
  }
}


function initCircleRadius(graph, metaTyping) {
	// Initialize circle radia depending on node meta-types
	for (var i=0; i < graph.nodes.length; i++) {
		graph.nodes[i].radius = AG_META_SIZES[metaTyping[graph.nodes[i].id]];
	}
}

function initNodePosition(graph, posDict) {
	for (var i=0; i < graph.nodes.length; i++) {
		if (graph.nodes[i].id in posDict) {
			graph.nodes[i].fx = posDict[graph.nodes[i].id][0];
			graph.nodes[i].x = posDict[graph.nodes[i].id][0];
			graph.nodes[i].fy = posDict[graph.nodes[i].id][1];
			graph.nodes[i].y = posDict[graph.nodes[i].id][1];
		}
	}
}



function computeNodeSizes(graph, metaTyping) {
	var nodeSizes = {};
	for (var i = 0; i < graph.nodes.length; i++) {
		nodeSizes[graph.nodes[i].id] = AG_META_SIZES[metaTyping[graph.nodes[i].id]];
	}
	return nodeSizes;
}

function computeNodeColors(graph, metaTyping, instantiated=false) {
	var nodeSizes = {};
	for (var i = 0; i < graph.nodes.length; i++) {
		if (instantiated) {
			nodeSizes[graph.nodes[i].id] = INSTANCE_META_COLORS[
				metaTyping[graph.nodes[i].id]];
		} else {
			nodeSizes[graph.nodes[i].id] = META_COLORS[
				metaTyping[graph.nodes[i].id]];
		}
	}
	return nodeSizes;
}


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
	      .attr("marker-end", "url(#arrow)");
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
	      .attr("marker-end", "url(#arrow)");
	    d3.select(this)
	      // .attr("stroke-width", 2)
	      .select(".arrow")
	      .style("stroke", d3.rgb(highlight))
	      .attr("marker-end", "url(#arrow-selected)");
	};
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
		    nodeColors = computeNodeColors(actionGraph, metaTyping, instantiated),
		    nodeSizes = computeNodeSizes(actionGraph, metaTyping);

		initNodePosition(actionGraph, nodePos);
		initLinkStrengthDistance(actionGraph, metaTyping);
		initCircleRadius(actionGraph, metaTyping);
		simulationConf = {
			"chargeStrength": -300,
			"collideStrength": 1.8,
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
                     	onNodeDrag=null,
                    	threshold=100);
	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}