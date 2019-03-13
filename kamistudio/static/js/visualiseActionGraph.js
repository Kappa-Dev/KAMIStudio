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

function initializeNodePosition(graph, posDict) {
	noPositionNodes = [];
	// posDict = {};
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
                     detailsOnClicks=true, svgId=null, threshold=null) {
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

	console.log(width, height);

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
		.attr("refX", 7)
		.attr("refY", 0)
		.attr("markerWidth", 3.5)
		.attr("markerHeight", 3.5)
		.attr("orient", "auto")
		.append("svg:path")
		.attr("d", "M0,-5L10, 0L0, 5")
		.attr('fill', '#337ab7');

	// initialize legend
	var legend = null;

	var container = svg.append("g")
      		   .attr("class", "everything");

	var zoom = d3.zoom()
	             .on("zoom", zoomed);
	svg.call(zoom);


	if (noPositionNodes.length != 0) {
		if ((threshold !== null) && (actionGraph.nodes.length <= threshold))  {
			// remove progress block
			removeProgressBlock();

			var nodeById = d3.map(actionGraph.nodes, id);
			
			for (var i=0; i < actionGraph.links.length; i++) {
				if (typeof actionGraph.links[i].source !== "object")
					actionGraph.links[i].source = find(nodeById, actionGraph.links[i].source);
				if (typeof actionGraph.links[i].target !== "object") 
					actionGraph.links[i].target = find(nodeById, actionGraph.links[i].target);
			}
			document.getElementById("actionGraphSvg").style.display = "initial";
			document.getElementById("saveLayoutButton").disabled = false;
			draw(actionGraph.nodes, actionGraph.links, true);
		} else {
			// Don't use web-workers if the graph is small enough
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
			    case "tick": return updateAGLoadingProgress(event.data.progress);
			    case "end": return ended(event.data);
			  }
			};
		}

	} else {
		// remove progress block
		removeProgressBlock();

		var nodeById = d3.map(actionGraph.nodes, id);

		for (var i=0; i < actionGraph.links.length; i++) {
			if (typeof actionGraph.links[i].source !== "object")
				actionGraph.links[i].source = find(nodeById, actionGraph.links[i].source);
			if (typeof actionGraph.links[i].target !== "object") 
				actionGraph.links[i].target = find(nodeById, actionGraph.links[i].target);
		}
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("saveLayoutButton").disabled = false;
		draw(actionGraph.nodes, actionGraph.links, false);
	}

	function translateLinks(linkSelector, nodeSelector) {
		var arrow = linkSelector.selectAll(".arrow"),
			linkBox = linkSelector.selectAll(".linkbox");
	    linkBox
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
		        	radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetX = (diffX * radius) / pathLength;
				    return (d.target.x - offsetX + offsetX * 0.3);
	        	 })
	        .attr("y2", function(d) { 
	        		radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetY = (diffY * radius) / pathLength;
				    return (d.target.y - offsetY + offsetY * 0.3);
				});
	    arrow
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
		        	radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetX = (diffX * radius) / pathLength;
				    return (d.target.x - offsetX - offsetX * 0.1);
	        	 })
	        .attr("y2", function(d) { 
	        		radius = AG_META_SIZES[metaTyping[d.target.id]];
				    diffX = d.target.x - d.source.x;
				    diffY = d.target.y - d.source.y;
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    offsetY = (diffY * radius) / pathLength;
				    return (d.target.y - offsetY - offsetY * 0.1);
				});
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

	function ticked() {
		// Set positions of nodes and links corresponding to one tick of simulations
	  	var node = d3.selectAll(".node"),
	  	    link = d3.selectAll(".link");

	  	translateLinks(link, node);

	    node.attr(
            "transform", 
            function(d) {
	          	// zoom to fit the bounding box
	          	var boundaries = container.node().getBBox(),
		            bx = boundaries.x,
		            by = boundaries.y,
		            bheight = boundaries.height,
		            bwidth = boundaries.width;

		        var currentViewBox = svg.attr("viewBox");
		        if (currentViewBox !== null) {
		        	var split =  currentViewBox.split(" ");
		        	if ((split[0] > bx) ||
		        		(split[1] > by) ||
		        		(split[2] < bwidth) ||
		        		(split[3] < bheight)) {
		        		var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
				        svg  
				            .attr("viewBox", updatedView)  
				            .attr("preserveAspectRatio", "xMidYMid meet")  
				            .call(zoom);
				        console.log("A: ", d3.zoomIdentity.scale());
		        	}
		        } else {
		        	if ((bx < 0) ||
		        		(by < 0) ||
		        		(width < bwidth) ||
		        		(height > bheight)) {
		        		var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
				        svg  
				            .attr("viewBox", updatedView)  
				            .attr("preserveAspectRatio", "xMidYMid meet")  
				            .call(zoom);
				        console.log("B: ", d3.zoomIdentity.scale());
				    }
		        }
		        
	            return "translate(" + d.x + "," + d.y + ")"; 
			}
		);
	}

	function draw(nodes, links, simulate) {
		if (simulate) {
	        // defines forces between nodes and edges
	        var simulation = d3.forceSimulation()
	            .force("charge", d3.forceManyBody().strength(-400))
	            .force("link", d3.forceLink()
	            	.id(function(d) { return d.id; })
	            	.distance(function(d) {return d.distance; }))
	            .force("center", d3.forceCenter(width / 2, height / 2))
	            .force("collide",d3.forceCollide().strength(1.8).radius(
		          function(d) {return d.radius})
		        )
	            .force("cx", d3.forceX(width / 2))
	            .force("cy", d3.forceY(height / 2))
	            .on("tick", ticked)
	            .on('end', 
	            	function() {
	    				updateNodePositions(nodes, nodePosUpdateUrl)
					});
	        // applies forces on nodes and edges
	        simulation.nodes(nodes);
	        simulation.force("link").links(links);
	    }

		// Draw a graph

		var link = container
			.selectAll(".link")
			.data(links)
			.enter().append("g")
			.attr("class", "link")
			.on("click", handleEdgeClick)
	        .on("mouseover", 
	        	function(){ 
	        		d3.select(this).select(".linkbox").style("opacity", 0.4) 
	        	})
        	.on("mouseout", function(){
        			d3.select(this).select(".linkbox").style("opacity", 0) 
        		});

		link.append("line")
			.attr("class", "arrow")
			.attr("stroke-width", 2).attr("stroke", d3.rgb("#B8B8B8"))
		    .attr("marker-end", "url(#arrow)");
		link.append("line")
			.attr("class", "linkbox")

		// var link = container.selectAll(".link")
		//     .data(links)
		//     .enter().append("line")
		//     .attr("class", "link")
		//       .attr("stroke-width", 2).attr("stroke", d3.rgb("#B8B8B8"))
		//       .attr("marker-end", "url(#arrow)");

		// var linkBox = container.selectAll(".linkbox")
	 //        .data(links)
	 //        .enter().append("line")
	 //          .attr("class", "linkbox")
	 //        .on("click", handleEdgeClick)
	 //        .on("mouseover", 
	 //        	function(){ 
	 //        		d3.select(this).style("opacity", 0.4) 
	 //        	})
  //       	.on("mouseout", function(){
  //       			d3.select(this).style("opacity", 0) 
  //       		});

	    // define nodes of the graph
	    var node = container.selectAll(".node")
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
	      .attr("stroke-width", 0)
	      .attr("stroke", d3.rgb("#B8B8B8"))
	   	  .on("dblclick", zoomInArea)
	   	  .on("click", handleNodeClick);

	   	node.append("title")
	      .text(function(d) { return d.id; });

	    if (!simulate) {
	       ticked();
	    }

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

        d3.select('#saveLayoutButton')
          .on('click', function() {
          	updateNodePositions(nodes, nodePosUpdateUrl, null, null, null);
          });
	}

	function removeProgressAndDraw(nodes, links) {
		// remove progress block
		removeProgressBlock();
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("saveLayoutButton").disabled = false;
		draw(nodes, links, false);
	}

	function zoomed() {
	    container.attr("transform", d3.event.transform); // updated for d3 v4
	}

	function dragstarted(d) {
		d3.event.sourceEvent.stopPropagation();
		if ((metaTyping[d.id] != "state") &&
			(metaTyping[d.id] != "bnd") && 
			(metaTyping[d.id] != "mod")) {
			CURRENT_DRAG_COMPONENTS = getAllComponents(
				actionGraph, metaTyping, d.id);
		}
	}

	function dragged(d) {
		var radius = AG_META_SIZES[metaTyping[d.id]];
	    var boundaries = container.node().getBBox(),
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
	    draggedNode.attr(
	    	"transform", "translate(" + d.x + "," + d.y + ")"); 

	    if ((metaTyping[d.id] != "state") &&
	    	(metaTyping[d.id] != "bnd") &&
	    	(metaTyping[d.id] != "mod")) {
	    	container.selectAll(".components").remove();
	    	var components = CURRENT_DRAG_COMPONENTS;
	    	var componentSelector = d3.selectAll(".node")
			  .filter(function(e) { return components.includes(e.id); })
			  .each(function(e) {
	    			e.x += d3.event.dx;
				   	e.y += d3.event.dy;
			   })
			  .attr("transform", 
				function(e) { return "translate(" + e.x + "," + e.y + ")"; }); 
	    }

	    // dragging of a node itself
	    translateLinks(
	    	container.selectAll(".link"),
	    	container.selectAll(".node"));

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

	function handleNodeClick(d, i) {
		// deselect all the selected elements
	    container.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#arrow)");
	    container.selectAll("circle")
	      .attr("stroke-width", 0);
	    // select current element
		d3.select(this)
	      .attr("stroke-width", 2)
	      .attr("stroke", d3.rgb("#337ab7"));
		displayAttr(d, i);
	}

	function handleEdgeClick(d, i) {
		// deselect all the selected elements
	    container.selectAll("circle")
	      .attr("stroke-width", 0);
	    container.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#arrow)");
	    d3.select(this)
	      // .attr("stroke-width", 2)
	      .select(".arrow")
	      .style("stroke", d3.rgb("#337ab7"))
	      .attr("marker-end", "url(#arrow-selected)");

		displayAttr(d, i);
	}

	function displayAttr(d, i) {
		console.log(d.attrs);
		if (legend === null) {
			// // create legend
			// legend = svg.append("g")
			// 	.attr("class", "legend");
			// var currentViewBox = svg.attr("viewBox"),
			// 	x = 0,
			// 	y = 0;
			// if (currentViewBox !== null) {
			// 	var split = currentViewBox.split(" ");
			// 	x = split[0];
			// 	y = split[1]; 
			// }
			// var legendBox = legend.append("rect")
   //    		   			.attr("class", "legend")
   //    		   			.attr("rx", 6)
			// 		    .attr("ry", 6)
			// 		    .attr("x", -12.5)
			// 		    .attr("y", -12.5)
			// 		    .attr("width", 100)
			// 		    .attr("height", 100)
			// 		    .style("fill", "none")
			// 		    .style("stroke", "#337ab7");
			// var legendItems = legend.append("g")
			// 	.attr("class", "legend-items");
			// legendItems.append("text")
			// 	.text("Element info");
		} else {
			// legend.text(getNodeAttributes(d.attrs));
		}
	}
}


function updateNodePositions(nodes, nodePosUpdateUrl, xhrFunction, successCallback, failCallback,
							 nodesToUpdate=null) {
	// POST newly computed node positioning to the server
	var positions = {};
	for (var i=0; i < nodes.length; i++) {
		if (nodesToUpdate) {
			if (nodesToUpdate.includes(nodes[i].id)) {
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

    	visualiseAG(actionGraph, metaTyping, nodePos, 
    				workerUrl, nodePosUpdateUrl, null, false, null, 100);
	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}