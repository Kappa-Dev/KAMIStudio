/**
 * Utils for action graph visualisation
 * 
 */

// global vars defining default visualisation configs for different types of nodes
var AG_META_SIZES = {
  "gene":25,
  "region":15,
  "site":10,
  "residue":7,
  "state":5,
  "mod":15,
  "bnd":15
};

function id(d) {
  return d.id;
}


function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

function isConnected(edgeList, sourceId, targetId) {
	for (var i=0; i < edgeList.length; i++) {
		if ((edgeList[i][0] == sourceId) && (edgeList[i][1] == targetId)) {
			return true;
		}
	}
	return false;
}


function predecessors(graph, edgeList, nodeId) {
	var ps = [];
	for (var i=0; i < graph.nodes.length; i++) {
		var d = graph.nodes[i];
		if (isConnected(edgeList, d.id, nodeId)) {
			ps.push(d.id);
		}
	}
	return ps;
}


function filterNotComponents(typing, allPredecessors) {
	var result = [];
	for (var i=0; i < allPredecessors.length; i++) {
		if ((typing[allPredecessors[i]] != "bnd") && (typing[allPredecessors[i]] != "mod")) {
			result.push(allPredecessors[i]);
		}
	}
	return result;
}


function getAllComponents(graph, typing, draggedNodeId) {
    // Dragging of subcomponents of a node
    var components = [];

    var edgeList = [];
	for (var i=0; i < graph.links.length; i++) {
		edgeList.push(
			[graph.links[i].source.id,
			 graph.links[i].target.id]);
	}

	var allPredecessors = predecessors(graph, edgeList, draggedNodeId),
		nextComponentPredecessors = filterNotComponents(typing, allPredecessors),
		visited = nextComponentPredecessors.concat();

	components = components.concat(nextComponentPredecessors);
	while (nextComponentPredecessors.length > 0) {
		var newNextComponentPredecessors = [];
		for (var i=0; i < nextComponentPredecessors.length; i++) {
			var currentNode = nextComponentPredecessors[i],
				nodePredecessors = filterNotComponents(
					typing, predecessors(graph, edgeList, currentNode));
			for (var j=0; j < nodePredecessors.length; j++) {
				if (!visited.includes(nodePredecessors[j])) {
					newNextComponentPredecessors.push(nodePredecessors[j]);
					components.push(nodePredecessors[j]);
				}
			}
		}
		nextComponentPredecessors = newNextComponentPredecessors.concat();
	}
	return components;
}


function initializeLinkStrengthDistance(graph, metaTyping) {
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


function initializeCircleRadius(graph, metaTyping) {
	// Initialize circle radia depending on node meta-types
	for (var i=0; i < graph.nodes.length; i++) {
		graph.nodes[i].radius = AG_META_SIZES[metaTyping[graph.nodes[i].id]];
	}
}

function initializeNodePosition(graph, pos) {
	noPositionNodes = [];
	posDict = {};
	for (var i=0; i < pos.length; i++) {
		posDict[pos[i][0]] = [pos[i][1], pos[i][2]];
	}
	for (var i=0; i < graph.nodes.length; i++) {
		if (graph.nodes[i].id in posDict) {
			graph.nodes[i].fx = posDict[graph.nodes[i].id][0];
			graph.nodes[i].x = posDict[graph.nodes[i].id][0];
			graph.nodes[i].fy = posDict[graph.nodes[i].id][1];
			graph.nodes[i].y = posDict[graph.nodes[i].id][1];
		} else {
			noPositionNodes.push(graph.nodes[i].id);
		}
	}
	return noPositionNodes;
}


function visualiseAG(actionGraph, metaTyping, nodePos, 
					 workerUrl, nodePosUpdateUrl, configs=null,
                     detailsOnClicks=true, svgId=null) {
	// Visualise action graph using static precomputed force layout +
	// previously stored node positions

	initializeCircleRadius(actionGraph, metaTyping);
	initializeLinkStrengthDistance(actionGraph, metaTyping);
	var noPositionNodes = initializeNodePosition(actionGraph, nodePos);

	var CURRENT_DRAG_COMPONENTS = []; 	

	// get svg
	if (svgId == null) {
		svgId = "actionGraphSvg";
	}
	var svg = d3.select("#" + svgId),
    	width = +svg.attr("width"),
      	height = +svg.attr("height"),
		active = d3.select(null);

	// define arrow markers for graph links
	svg.append("defs").append("marker")
		.attr("id", "arrow")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 7)
		.attr("refY", 0)
		.attr("markerWidth", 3.5)
		.attr("markerHeight", 3.5)
		.attr("orient", "auto")
		.append("svg:path")
		.attr("d", "M0,-5L10, 0L0, 5")
		.attr('fill', '#B8B8B8');

	svg.append("defs").append("marker")
		.attr("id", "arrow-selected")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 8)
		.attr("refY", 0)
		.attr("markerWidth", 3.5)
		.attr("markerHeight", 3.5)
		.attr("orient", "auto")
		.append("svg:path")
		.attr("d", "M0,-5L10, 0L0, 5")
		.attr('fill', '#337ab7');

	var g = svg.append("g")
      .attr("class", "everything");

	var zoom = d3.zoom()
	    // .scaleExtent([1, 8])
	    .on("zoom", zoomed);

	svg.call(zoom);

	if (noPositionNodes.length != 0) {
		if (noPositionNodes.length == actionGraph.nodes.length) {
			initilizeLayoutProgressBar();
		} else {
			initializePositionUpdateProgressBar();
		}

		var worker = new Worker(workerUrl);
		worker.postMessage({
		  nodes: actionGraph.nodes,
		  links: actionGraph.links,
		  width: width,
		  height: height,
		});

		worker.onmessage = function(event) {
		  switch (event.data.type) {
		    case "tick": return ticked(event.data);
		    case "end": return ended(event.data);
		  }
		};
	} else {
		// remove progress block
		removeProgressBlock();

		var nodeById = d3.map(actionGraph.nodes, id);
		var linkBySourceTargetId = d3.map(actionGraph.links, );

		for (var i=0; i < actionGraph.links.length; i++) {
			if (typeof actionGraph.links[i].source !== "object")
				actionGraph.links[i].source = find(nodeById, actionGraph.links[i].source);
			if (typeof actionGraph.links[i].target !== "object") 
				actionGraph.links[i].target = find(nodeById, actionGraph.links[i].target);
		}
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("saveLayoutButtonBlock").style.display = "initial";
		draw(actionGraph.nodes, actionGraph.links);
	}

	function translateLinks(linkSelector, nodeSelector) {

	    linkSelector
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
		        	radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetX = (diffX * radius) / pathLength;
				    return (d.target.x - offsetX - offsetX * 0.05);
	        	 })
	        .attr("y2", function(d) { 
	        		radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetY = (diffY * radius) / pathLength;
				    return (d.target.y - offsetY - offsetY * 0.05);
				});
	}

	function ticked(data) {
	  updateAGLoadingProgress(data.progress);
	}

	function ended(data) {
		initializePositionUpdateProgressBar();
		
		var nodeById = d3.map(actionGraph.nodes, id);
		for (var i=0; i < actionGraph.links.length; i++) {
			if (typeof actionGraph.links[i].source !== "object")
				actionGraph.links[i].source = find(nodeById, actionGraph.links[i].source);
			if (typeof actionGraph.links[i].target !== "object") 
				actionGraph.links[i].target = find(nodeById, actionGraph.links[i].target);
		}

		updateNodePositions(
			data.nodes,
			nodePosUpdateUrl,
			function () {
			    var xhr = $.ajaxSettings.xhr();
			    xhr.onprogress = function(e) {
			        if (e.lengthComputable) {
			            updateAGLoadingProgress(e.loaded / e.total);
			        }
			    };
			    return xhr;
			},
			function() { removeProgressAndDraw(data.nodes, data.links) },
			function() { removeProgressAndDraw(data.nodes, data.links) })
	}

	function draw(nodes, links) {
		// Draw a graph
		var link = g.selectAll(".link")
		    .data(links)
		    .enter().append("line")
		    .attr("class", "link")
		      .attr("stroke-width", 2).attr("stroke", d3.rgb("#B8B8B8"))
		      .attr("marker-end", "url(#arrow)");

	    // define nodes of the graph
	    var node = g.selectAll(".node")
		      .data(nodes)
		      .enter().append("g")
		      .attr("class", "node")
		      .call(d3.drag()
		          .on("start", dragstarted)
		          .on("drag", dragged));

	    // setup nodes circles
	    node.append("circle")
	      .attr("r", function(d) { return AG_META_SIZES[metaTyping[d.id]]; })
	      .attr("fill", function(d) { return d3.rgb(META_COLORS[metaTyping[d.id]]); })
	      .attr("stroke-width", 0).attr("stroke", d3.rgb("#B8B8B8"))
	   	  .on("dblclick", zoomInArea);

	    node.append("title")
	      .text(function(d) { return d.id; });

	   	// node.filter(function(d) { return metaTyping[d.id] == "gene"; })
	   	// 	.append("text")
	   	// 	.style('fill', d3.rgb("#5e5e5e"))
	    //     .attr("text-anchor", "middle")
	    //     .text(function(d) {
	    //     	if ((d.hgnc_symbol) && (d.hgnc_symbol.length > 0)) {
	    //     		text = d.hgnc_symbol;	
	    //     	} else {
	    //     		text = d.id;
	    //     	}

	    //     	if (text.length > 15) {
		   //        text = d.id.slice(0, 15) + "...";
		   //      }
		   //      return text});

	    translateLinks(link, node);

	    node.attr(
          "transform", function(d) {
          // zoom to fit the bounding box
          var boundaries = g.node().getBBox(),
              bx = boundaries.x,
              by = boundaries.y,
              bheight = boundaries.height,
              bwidth = boundaries.width;
          var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
          svg  
            .attr("viewBox", updatedView)  
            .attr("preserveAspectRatio", "xMidYMid meet")  
            .call(zoom);
            return "translate(" + d.x + "," + d.y + ")"; 

        });

        d3.select('#saveLayoutButton')
          .on('click', function() {
          	updateNodePositions(nodes, nodePosUpdateUrl, null, null, null);
          });
	}

	function removeProgressAndDraw(nodes, links) {
		// remove progress block
		removeProgressBlock();
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("saveLayoutButtonBlock").style.display = "initial";
		draw(nodes, links);
	}

	function zoomed() {
	    g.attr("transform", d3.event.transform); // updated for d3 v4
	}

	function dragstarted(d) {
		d3.event.sourceEvent.stopPropagation();
		if ((metaTyping[d.id] != "state") && (metaTyping[d.id] != "bnd") && (metaTyping[d.id] != "mod")) {
			CURRENT_DRAG_COMPONENTS = getAllComponents(actionGraph, metaTyping, d.id);
		}
	}

	function dragged(d) {
		var radius = AG_META_SIZES[metaTyping[d.id]];
	    var boundaries = g.node().getBBox(),
            bx_min = boundaries.x,
            by_min = boundaries.y,
            by_max = by_min + boundaries.height,
            bx_max = bx_min + boundaries.width;

        // here add translation of  a view box into the dragging direction
        // when overflow
	    // if (d3.event.x >= bx_min + radius && d3.event.x <= bx_max - radius) {
	    d.x = d3.event.x;
	    // }
	    // if (d3.event.y >= by_min + radius && d3.event.y <= by_max - radius) {
	    d.y = d3.event.y;
	    // }

	    var draggedNode = d3.select(this);
	    draggedNode.attr("transform", "translate(" + d.x + "," + d.y + ")"); 

	    if ((metaTyping[d.id] != "state") && (metaTyping[d.id] != "bnd") && (metaTyping[d.id] != "mod")) {
	    	g.selectAll(".components").remove();
	    	var components = CURRENT_DRAG_COMPONENTS;
	    	var componentSelector = d3.selectAll(".node")
			  .filter(function(e) { return components.includes(e.id); })
			  .each(function(e) {
			  	  // if (d3.event.x >= bx_min + radius && d3.event.x <= bx_max - radius) {
	    			e.x += d3.event.dx;
	    		  // }
	    		  // if (d3.event.y >= by_min + radius && d3.event.y <= by_max - radius) {
				   	e.y += d3.event.dy;
				  // }
			  	  // e.x += d3.event.dx;
			     //  e.y += d3.event.dy;
			   })
			  .attr("transform", 
				function(e) { return "translate(" + e.x + "," + e.y + ")"; }); 
	    }

	    // dragging of a node itself
	    translateLinks(g.selectAll(".link"), g.selectAll(".node"));

	}

	function zoomInArea(d, i) {
		if (active.node() === this) return reset();
	    active.classed("active", false);
	    active = d3.select(this).classed("active", true);

	    var bb = this.getBoundingClientRect(),
	    	dx = bb.width,
	        dy = bb.height,
	        x = (bb.left + bb.right) / 2,
	        y = (bb.top + bb.bottom) / 2,
	        scale = Math.max(1, Math.min(10, 0.9 / Math.max(dx / width, dy / height))),
	        translate = [width / 2 - scale * d.x, height / 2 - scale * d.y];

	    svg.transition()
	        .duration(650)
	        .call(
	        	zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); 
	}

	function reset() {
		active.classed("active", false);
		active = d3.select(null);

		svg.transition()
		  .duration(750)
		  // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
		  .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
		}

}


function updateNodePositions(nodes, nodePosUpdateUrl, xhrFunction, successCallback, failCallback,
							 nodesToUpdate=null) {
	// POST newly computed node positioning to the server
	var positions = {};
	for (var i=0; i < nodes.length; i++) {
		if (nodesToUpdate) {
			if (nodesToUpdate.includes(nodes[i].id)) {
				console.log("Updating selected nodes");
				console.log(nodesToUpdate);
				positions[nodes[i].id] = [nodes[i].x, nodes[i].y];
			}
		} else {
			positions[nodes[i].id] = [nodes[i].x, nodes[i].y];
		}
	}

	if (xhrFunction) {
		$.ajax({
			    url: nodePosUpdateUrl,
			    type: 'post',
			    data: JSON.stringify({"node_positioning": positions}),
			    dataType: 'json',
            	contentType: 'application/json',
				xhr: xhrFunction,
			}).done(function () {
				if (successCallback) successCallback();
			}).fail(function (xhr, status, error) {
				console.log("Failed to update new node positions");
				console.log(error);
				if (failCallback) failCallback();
			});
	} else {
		$.ajax({
			    url: nodePosUpdateUrl,
			    type: 'post',
			    data: JSON.stringify({"node_positioning": positions}),
			    dataType: 'json',
            	contentType: 'application/json',
			}).done(function () {
				if (successCallback) successCallback();
			}).fail(function (xhr, status, error) {
				console.log("Failed to update new node positions");
				console.log(error);
				if (failCallback) failCallback();
			});
	}
}


function getActionGraphAndVisualize(model_id, workerUrl) {
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
	    	nodePosUpdateUrl = model_id + "/update-ag-node-positioning";

    	visualiseAG(actionGraph, metaTyping, nodePos, workerUrl, nodePosUpdateUrl, null, false, null);
	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}