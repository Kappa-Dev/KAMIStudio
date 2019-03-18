function initLinkStrengthDistance(graph, metaTyping, scale=1) {
	// Initialize link strength depending on node meta-types
    for (var i=0; i < graph.links.length; i++) {
	    var d = graph.links[i];
	    d.strength = 0.02 * scale;
	    d.distance = 50 * scale;
	    if (metaTyping[d.target] == "gene") {
	      if (metaTyping[d.source] == "region") {
	        d.strength = 0.7 * scale;
	        d.distance = 10 * scale;
	      } else if (metaTyping[d.source] == "site") {
	        d.strength = 0.7 * scale;
	        d.distance = 15 * scale;
	      } else if (metaTyping[d.source] == "residue") {
	        d.strength = 0.7 * scale;
	        d.distance = 20 * scale;
	      } 
	    } else if (metaTyping[d.target] == "region") {
	      if (metaTyping[d.source] == "site") {
	        d.strength = 0.6 * scale;
	        d.distance = 10 * scale;
	      } else if ((metaTyping[d.source] == "residue")) {
	        d.strength = 0.6 * scale;
	        d.distance = 15 * scale;
	      } 
	    } else if (metaTyping[d.target] == "site") {
	      if (metaTyping[d.source] == "residue") {
	        d.strength = 0.7 * scale;
	        d.distance = 10 * scale;
	      } 
	    } else if (metaTyping[d.target] == "residue") {
	    	if (metaTyping[d.source] == "state") {
	    		d.strength = 0.4 * scale;
	    		d.distance = 5 * scale;
	    	}
	    } else if (metaTyping[d.target] == "state") {
	      if (metaTyping[d.source] == "mod") {
	        d.strength = 0.15 * scale;
	      } 
	    } else if (metaTyping[d.target] == "bnd") {
	      d.strength = 0.1 * scale;
	    } else if (metaTyping[d.target] == "mod") {
	      d.strength = 0.1 * scale;
	    }
    	if (metaTyping[d.source] == "state") {
    		d.strength = 1 * scale;
    		d.distance = 10 * scale;
    	}
  }
}


function initCircleRadius(graph, metaTyping, scheme, scale=1) {
	// Initialize circle radia depending on node meta-types
	for (var i=0; i < graph.nodes.length; i++) {
		graph.nodes[i].radius = scheme[metaTyping[graph.nodes[i].id]] * scale;
	}
}

function initNodePosition(graph, posDict, fix=null) {
	if (fix === null) {
		fix = [];
	}
	for (var i=0; i < graph.nodes.length; i++) {
		if (graph.nodes[i].id in posDict) {
			graph.nodes[i].x = posDict[graph.nodes[i].id][0];
			graph.nodes[i].y = posDict[graph.nodes[i].id][1];
			if (fix.includes(graph.nodes[i].id)) {
				graph.nodes[i].fx = graph.nodes[i].x;
				graph.nodes[i].fy = graph.nodes[i].y;
			}
		}
	}
}


function computeNodeSizes(graph, metaTyping, scheme, scale=1) {
	var nodeSizes = {};
	for (var i = 0; i < graph.nodes.length; i++) {
		nodeSizes[graph.nodes[i].id] = scheme[metaTyping[graph.nodes[i].id]] * scale;
	}
	return nodeSizes;
}

function computeNodeColors(graph, metaTyping, scheme) {
	var nodeColors = {};
	for (var i = 0; i < graph.nodes.length; i++) {
		nodeColors[graph.nodes[i].id] = scheme[
				metaTyping[graph.nodes[i].id]];
	}
	return nodeColors;
}


function findNodesWithNoPosition(graph) {
	var noPositionNodes = [];
	for (var i=0; i < graph.nodes.length; i++) {
		if ((!graph.nodes[i].fx) || (!graph.nodes[i].fy)) {
			noPositionNodes.push(graph.nodes[i].id);
		}
	}
	return noPositionNodes;
}


function mapEdgesToObjects(graph) {
	var nodeById = d3.map(graph.nodes, id);
	for (var i=0; i < graph.links.length; i++) {
		if (typeof graph.links[i].source !== "object")
			graph.links[i].source = find(nodeById, graph.links[i].source);
		if (typeof graph.links[i].target !== "object") 
			graph.links[i].target = find(nodeById, graph.links[i].target);
	}

}



function visualiseGraph(graph, svgId, 
						nodeColors, nodeSizes,
						edgeStroke=null,
						highlightedEdgeStroke=null,
						simulationConf=null,
						progressConf=null,
						workerUrl=null, 
						nodePosUpdateUrl=null,
                     	onNodeClick=null, 
                     	onEdgeClick=null,
                     	onNodeDragStarted=null,
                     	threshold=null,
                     	zoom=true,
                     	saveLayoutButton=null) {

	// initialise default simulation params
	var defaultRadius;
	if ("radius" in simulationConf) {
		defaultRadius = simulationConf["radius"];
	}  else {
		defaultRadius = 20;
	}

	var defaultStrength;
	if ("strength" in simulationConf) {
		defaultStrength = simulationConf["strength"];
	}  else {
		defaultStrength = 0.1;
	}

	var defaultDistance;
	if ("distance" in simulationConf) {
		defaultDistance = simulationConf["distance"];
	} else {
		defaultDistance = 50;
	}

	var chargeStrength;
	if ("charge_strength" in simulationConf) {
		chargeStrength = simulationConf["charge_strength"];
	} else {
		chargeStrength = -300;
	}

	var collideStrength;
	if ("collide_strength" in simulationConf) {
		collideStrength = simulationConf["collide_strength"];
	} else {
		collideStrength = 1.8;
	}

	var yStrength;
	if ("y_strength" in simulationConf) {
		yStrength = simulationConf["y_strength"];
	} else {
		yStrength = 0;
	}

	// array of current components to drag (for group dragging) 
	var CURRENT_DRAG_COMPONENTS = []; 	

	// select svg acnvas
	var svg = d3.select("#" + svgId),
    	width = +svg.attr("width"),
      	height = +svg.attr("height"),
		active = d3.select(null);

	// define arrow markers for graph links
	if (edgeStroke === null) {
		edgeStroke = '#B8B8B8';
	}

	if (highlightedEdgeStroke === null) {
		highlightedEdgeStroke = HIGHLIGHT_COLOR;
	}

	svg.append("defs").append("marker")
		.attr("id", svgId + "arrow")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 7)
		.attr("refY", 0)
		.attr("markerWidth", 3.5)
		.attr("markerHeight", 3.5)
		.attr("orient", "auto")
		.append("svg:path")
		.attr("d", "M0,-5L10, 0L0, 5")
		.attr('fill', edgeStroke);

	svg.append("defs").append("marker")
		.attr("id", svgId + "arrow-selected")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 7)
		.attr("refY", 0)
		.attr("markerWidth", 3.5)
		.attr("markerHeight", 3.5)
		.attr("orient", "auto")
		.append("svg:path")
		.attr("d", "M0,-5L10, 0L0, 5")
		.attr("fill", highlightedEdgeStroke);

	// init zoom-related stuff
	var container = svg.append("g")
      				   .attr("class", "everything");

    if (zoom) {
		var zoom = d3.zoom()
		             .on("zoom", zoomed);
		svg.call(zoom);
	}

	// layout calculation part
	var noPositionNodes = findNodesWithNoPosition(graph)


	if (noPositionNodes.length != 0) {
		if ((threshold !== null) &&
			(graph.nodes.length <= threshold))  {
			// handler for removing progress bars
			if ("remove_progress" in progressConf) {
				progressConf["remove_progress"]();
			}

			// make sure that link sources/targets are bound to node objects
			// if not bind
			mapEdgesToObjects(graph);

			// change svg display
			if ("init_svg" in progressConf) {
				progressConf["init_svg"]();
			} 
			draw(graph.nodes, graph.links, true);
	
		} else {
			// handle progress of layout computation
			if ((noPositionNodes.length == graph.nodes.length) &&
				("init_layout_progress" in progressConf)) {
					progressConf["init_layout_progress"]();
			} else if ("init_layout_progress" in progressConf) {
				progressConf["init_layout_progress"]();
			}

			// initalize web-worker
			var worker = new Worker(workerUrl);
			worker.postMessage({
			  nodes: graph.nodes,
			  links: graph.links,
			  width: width,
			  height: height,
			  collideStrength: collideStrength, 
			  chargeStrength: chargeStrength,
			  defaultDistance: defaultDistance,
			  defaultStrength: defaultStrength,
			  defaultRadius: defaultRadius,
			  yStrength: yStrength
			});

			worker.onmessage = function(event) {
			  switch (event.data.type) {
			    case "tick": return updateAGLoadingProgress(event.data.progress);
			    case "end": return ended(event.data);
			  }
			};
		}
	} else {
		// handler for removing progress bars
		if ("remove_progress" in progressConf) {
			progressConf["remove_progress"]();
		}

		// make sure that link sources/targets are bound to node objects
		mapEdgesToObjects(graph);

		// change svg display
		if ("init_svg" in progressConf) {
			progressConf["init_svg"]();
		} 
		draw(graph.nodes, graph.links, false);
	}

	// Nested functions 

	function ended(data) {
		// handle the end of the simulation with web-worker
		if ("init_update_progress" in progressConf) {
			progressConf["init_update_progress"]();
		}
		mapEdgesToObjects(graph);

		updateNodePositions(
			data.nodes,
			nodePosUpdateUrl,
			function () {
			    var xhr = $.ajaxSettings.xhr();
			    xhr.onprogress = function(e) {
			        if ((e.lengthComputable) && ("ag_loading_progress" in progressConf)) {
			            progressConf["ag_loading_progress"](e.loaded / e.total);
			        }
			    };
			    return xhr;
			},
			function() { 
				if ("remove_progress" in progressConf) progressConf["remove_progress"]();
				if ("init_svg" in progressConf) progressConf["init_svg"]();
				draw(data.nodes, data.links, false);
			},
			function() {
				if ("remove_progress" in progressConf) progressConf["remove_progress"]();
				if ("init_svg" in progressConf) progressConf["init_svg"]();
				draw(data.nodes, data.links, false);
			})
	}


	function translateLinks(linkSelector, nodeSelector) {
		// translate links according to their source/target node pos
		var arrow = linkSelector.selectAll(".arrow"),
			linkBox = linkSelector.selectAll(".linkbox");
	    linkBox
	        .attr("x1", function(d) { 
	        	return d.source.x; 
	        })
	        .attr("y1", function(d) {
	        	return d.source.y; 
	        })
	        .attr("x2", function(d) { 
	        	var radius = d.target.radius,
				    diffX = d.target.x - d.source.x,
				    diffY = d.target.y - d.source.y,
				    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
			    var offsetX;
			    if (pathLength == 0) {
	              offsetX = 0;
	            } else {
			    	offsetX = (diffX * radius) / pathLength;
			    }

			    return (d.target.x- offsetX + offsetX * 0.3);
        	 })
	        .attr("y2", function(d) {
        		var radius = d.target.radius,
			    	diffX = d.target.x - d.source.x,
			    	diffY = d.target.y - d.source.y,
			    	pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
			    var offsetY;
			    if (pathLength == 0) {
	              offsetY = 0;
	            } else {
			 	   offsetY = (diffY * radius) / pathLength;
				}

			    return (d.target.y - offsetY + offsetY * 0.3);
			});
	    arrow
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
		        	var radius = d.target.radius,
					    diffX = d.target.x - d.source.x,
					    diffY = d.target.y - d.source.y,
					    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    var offsetX;
				    if (pathLength == 0) {
		              offsetX = 0;
		            } else {
				    	offsetX = (diffX * radius) / pathLength;
				    }
				    return (d.target.x - offsetX - offsetX * 0.1);
	        	 })
	        .attr("y2", function(d) { 
	        		var radius = d.target.radius,
					    diffX = d.target.x - d.source.x,
					    diffY = d.target.y - d.source.y,
					    pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
				    var offsetY;
				    if (pathLength == 0) {
		              offsetY = 0;
		            } else {
				    	offsetY = (diffY * radius) / pathLength;
				    }
				    return (d.target.y - offsetY - offsetY * 0.1);
				});
	}

	function fitViewBox() {
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
		    }
        }
	}

	function ticked() {
		// Set positions of nodes and links corresponding to one tick of simulations
	  	var node = svg.selectAll(".node"),
	  	    link = svg.selectAll(".link");

	  	translateLinks(link, node);

	    node.attr(
            "transform", 
            function(d) {
            	if (zoom) {
            		var epsilon = 10,
            			offset = 40;
            		if ((d.x < 0 + d.radius) ||
            			(d.x > width - d.radius) ||
            			(d.y < 0 + d.radius) ||
            			(d.y > height - d.radius)) {
            			// zoom to fit the bounding box
				          	var boundaries = container.node().getBBox(),
					            bx = boundaries.x,
					            by = boundaries.y,
					            bheight = boundaries.height,
					            bwidth = boundaries.width;

					        var currentViewBox = svg.attr("viewBox");
					        if (currentViewBox !== null) {
					        	var split =  currentViewBox.split(" ");
					        	if ((split[0] - epsilon > bx) ||
					        		(split[1] - epsilon > by) ||
					        		(split[2] + epsilon < bwidth) ||
					        		(split[3] + epsilon < bheight)) {
					        		var updatedView = "" + (bx - offset)  +
					        						  " " + (by - offset) + 
					        						  " " + (bwidth + offset) + 
					        						  " " + (bheight + offset);
							        svg  
							            .attr("viewBox", updatedView)  
							            .attr("preserveAspectRatio", "xMidYMid meet")  
							            .call(zoom);
					        	}
					        } else {
					        	if ((bx + epsilon < 0) ||
					        		(by + epsilon < 0) ||
					        		(width < bwidth - epsilon) ||
					        		(height > bheight - epsilon)) {
					        		var updatedView = "" + (bx - offset)  +
					        						  " " + (by - offset) + 
					        						  " " + (bwidth + offset) + 
					        						  " " + (bheight + offset);
					        		svg  
							            .attr("viewBox", updatedView)  
							            .attr("preserveAspectRatio", "xMidYMid meet")  
							            .call(zoom);
							    }
					        }
            		}
			    } else {
			    	// do not allow positions out of the bounding box
			    
			    	d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
			    	d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));

			    }
		        
	            return "translate(" + d.x + "," + d.y + ")"; 
			}
		);
	}

	function draw(nodes, links, simulate) {
		if (simulate) {
	        // defines forces between nodes and edges
	        var simulation = d3.forceSimulation()
	            .force("charge", d3.forceManyBody().strength(
	            	chargeStrength))
	            .force("link", 
	            	d3.forceLink()
	            	  .id(function(d) { return d.id; })
	            	  .distance(function(d) {
	            		if (d.distance) {
	            			return d.distance; 
	            		} else {
	            			return defaultDistance;
	            		}})
	                  .strength(function(d) { 
		                	if (d.strength) {
		                		return d.strength; 
		                	} else {
		                		return defaultStrength;
		                	}}))
	            .force('y', d3.forceY().y(0.5 * height).strength(yStrength))
	            .force("center", d3.forceCenter(width / 2, height / 2))
	            .force("collide",d3.forceCollide().strength(collideStrength).radius(
		          function(d) {
		          	if (d.radius) {
		          		return d.radius;
		          	} else {
		          		return defaultRadius;
		          	}
		          })
		        )
	            .force("cx", d3.forceX(width / 2))
	            .force("cy", d3.forceY(height / 2))
	            .on("tick", ticked)
	            .on('end', 
	            	function() {
	            		// if (zoom) {
	            		// 	fitViewBox();
	            		// }
	    				updateNodePositions(nodes, nodePosUpdateUrl);
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
			.on("click", onEdgeClick)
	        .on("mouseover", 
	        	function(){ 
	        		d3.select(this).select(".linkbox").style("opacity", 0.4) 
	        	})
        	.on("mouseout", function(){
        			d3.select(this).select(".linkbox").style("opacity", 0) 
        		});

		link.append("line")
			.attr("class", "arrow")
			.attr("stroke-width", 2).attr("stroke", d3.rgb(edgeStroke))
		    .attr("marker-end", "url(#" + svgId + "arrow)");
		link.append("line")
			.attr("class", "linkbox")

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
	      .attr("r", function(d) { return nodeSizes[d.id]; })
	      .attr("fill", function(d) { 
	      	return d3.rgb(nodeColors[d.id]); })
	      .attr("stroke-width", 0)
	      .attr("stroke", edgeStroke)
	   	  .on("dblclick", zoomInArea)
	   	  .on("click", onNodeClick);

	   	node.append("title")
	      .text(function(d) { return d.id; });

	    if (!simulate) {
	       ticked();
	       fitViewBox();
	    }

	    console.log('#' + saveLayoutButton);
	    d3.select('#' + saveLayoutButton)
          .on('click', function() {
          	updateNodePositions(nodes, nodePosUpdateUrl, null, null, null);
          });
         console.log(d3.select('#' + saveLayoutButton));
	}

	function zoomed() {
	    container.attr("transform", d3.event.transform); // updated for d3 v4
	}

	function dragstarted(d) {
		d3.event.sourceEvent.stopPropagation();
		CURRENT_DRAG_COMPONENTS = onNodeDragStarted(d);
	}

	function dragged(d) {
		var radius = nodeSizes[d.id];
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

	    container.selectAll(".components").remove();
    	var components = CURRENT_DRAG_COMPONENTS;
    	var componentSelector = svg.selectAll(".node")
		  .filter(function(e) { return components.includes(e.id); })
		  .each(function(e) {
    			e.x += d3.event.dx;
			   	e.y += d3.event.dy;
		   })
		  .attr("transform", 
			function(e) { return "translate(" + e.x + "," + e.y + ")"; }); 

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

	
}

function updateNodePositions(nodes, nodePosUpdateUrl, xhrFunction, successCallback, 
							 failCallback, nodesToUpdate=null) {
	// POST newly computed node positioning to the server
	console.log("Updating node positions");
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