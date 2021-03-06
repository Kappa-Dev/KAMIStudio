// global vars defining default visualisation configs for different types of nodes
var NUGGET_META_SIZES = {
  "protoform":35,
  "region":30,
  "site":15,
  "residue":10,
  "state":10,
  "mod":25,
  "bnd":25
};

var META_LABEL_DY = {
  "protoform":"-3.5em",
  "region":"-3em",
  "site":"-2em",
  "residue":"-2em",
  "state":"-2em",
  "mod":"-2.5em",
  "bnd":"-2.5em"
}

var AG_META_SIZES = {
  "protoform":25,
  "region":15,
  "site":10,
  "residue":7,
  "state":5,
  "mod":15,
  "bnd":15
};

var META_COLORS = {
  // "gene":"#FFA19E",
  "protoform":"#8db1d1",
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
  "protoform": "#ed757a",
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


var PRETY_SEMANTIC_NAMES = {
	"protein_kinase": "Protein kinase",
	"sh2_domain": "SH2 domain",
	"protein_kinase_activity": "Activity state of a protein kinase",
	"phospho": "Phosphorylation modification",
	"phospho_state": "Phosphorylation state",
	"phospho_target_residue": "Phosphorylatable residue",
	"pY_site": "Phosphotyrosine-binding site",
	"sh2_domain_pY_bnd": "SH2 Phosphotyrosine binding",
	"protein_kinase_bnd": "Protein kinase binding"
}

var HIGHLIGHT_COLOR = "#337ab7";
var INSTANCE_HIGHLIGHT_COLOR = "#a11117";


function initLinkStrengthDistance(graph, metaTyping, scale=1) {
	// Initialize link strength depending on node meta-types

	var baseDistance = 70 * scale,
		baseStrengthFactor = 2;
    for (var i=0; i < graph.links.length; i++) {
	    var d = graph.links[i], 
	    	factor = baseStrengthFactor;
	    d.distance = baseDistance;
	    if (metaTyping[d.target] == "protoform") {
	      if (metaTyping[d.source] == "region") {
	        factor = baseStrengthFactor * 0.5;
	        d.distance = baseDistance * 0.4;
	      } else if (metaTyping[d.source] == "site") {
	        factor = baseStrengthFactor * 0.3;
	        d.distance = baseDistance * 0.3;
	      } else if (metaTyping[d.source] == "residue") {
	        factor = baseStrengthFactor * 0.7;
	        d.distance = baseDistance * 0.3;
	      } 
	    } else if (metaTyping[d.target] == "region") {
	      if (metaTyping[d.source] == "site") {
	        d.strength = 0.6;
	        d.distance = baseDistance * 0.5;
	      } else if ((metaTyping[d.source] == "residue")) {
	        d.strength = 0.6;
	        d.distance = baseDistance * 0.5;
	      } 
	    } else if (metaTyping[d.target] == "site") {
	      if (metaTyping[d.source] == "residue") {
	        d.strength = 0.7;
	        d.distance = baseDistance * 0.3;
	      } 
	    } else if (metaTyping[d.target] == "residue") {
	    	if (metaTyping[d.source] == "state") {
	    		d.strength = 1;
	    		d.distance = baseDistance * 0.2;
	    	}
	    } else if (metaTyping[d.target] == "state") {
	      if (metaTyping[d.source] == "mod") {
	        d.strength = 0.15;
	      } 
	    } else if (metaTyping[d.target] == "bnd") {
	    	if (metaTyping[d.source] == "region") {
		      d.strength = 0.4;
		    } else {
		    	d.strength = 0.1;
		    }
	    } else if (metaTyping[d.target] == "mod") {
	    	if (metaTyping[d.source] == "region") {
		      d.strength = 0.4;
		    } else {
		    	d.strength = 0.1;
		    }
	    }
    	if (metaTyping[d.source] == "state") {
    		d.strength = 1;
    		d.distance = baseDistance * 0.1;
    	}
    	d.strength = 1 / Math.max(1, factor);
    	// console.log(d.strength, d.distance);
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

function initCCPositions(graph, cc, svgId) {

	var components = Object.keys(cc),
		svg = d3.select("#" + svgId),
		width = +svg.attr("width"),
		height = +svg.attr("height"),
    	radius =  graph.nodes.length * 40,
    	// height = graph.nodes.length * 80,
      	centerX = width / 2,
      	centerY = height / 2;

    // Find the Largest connected component
    var maxCC = components[0];
    for (var i = 1; i < components.length; i++) {
    	if (cc[components[i]].length > cc[maxCC].length) {
    		maxCC = components[i];
    	}
    }

    // Generate positions for CC
    var ccPos = {};
    // var radius = width / 2;
    var j = 0;
    var angleDelta = (360 / (components.length - 1)) * Math.PI / 180,
    	currentAngle;
    for (var i = 0; i < components.length; i++) {
    	if (components[i] == maxCC) {
    		ccPos[components[i]] = [centerX, centerY];
    	} else {
			currentAngle = j * angleDelta;
			ccPos[components[i]] = [
				centerX + radius * Math.cos(currentAngle),
				centerY + radius * Math.sin(currentAngle)
				// Math.random() * width,
				// Math.random() * height
			];
			j += 1;
    	}
    } 


    var reversedDict = {}
    for (var c in cc) {
    	for (var i=0; i < cc[c].length; i++) {
    		reversedDict[cc[c][i]] = c;
    	}
    }

    // Assign initial pos to nodes depending on cc
    for (var i=0; i < graph.nodes.length; i++) {
    	graph.nodes[i].x = ccPos[reversedDict[graph.nodes[i].id]][0];
		graph.nodes[i].y = ccPos[reversedDict[graph.nodes[i].id]][1];
    }

}

function initNodeLabels(graph, metaTyping, variantName=false) {
	for (var i = graph.nodes.length - 1; i >= 0; i--) {
		if (metaTyping[graph.nodes[i].id] == "protoform") {
			if ("hgnc_symbol" in graph.nodes[i].attrs) {
				graph.nodes[i].label = graph.nodes[i].attrs["hgnc_symbol"].data[0];
			} else {
				graph.nodes[i].label = graph.nodes[i].attrs["uniprotid"].data[0];
			}
			if (variantName) {
				if ("variant_name" in graph.nodes[i].attrs) {
					graph.nodes[i].label += " (" + graph.nodes[i].attrs["variant_name"].data[0] + ")";
				}
			}
		} else if ((metaTyping[graph.nodes[i].id] == "region") ||
				   (metaTyping[graph.nodes[i].id] == "site")) {
			if ("name" in graph.nodes[i].attrs) {
				graph.nodes[i].label = graph.nodes[i].attrs["name"].data[0];
			}
		} else if (metaTyping[graph.nodes[i].id] == "residue") {
			if ("aa" in graph.nodes[i].attrs) {
				graph.nodes[i].label = graph.nodes[i].attrs["aa"].data.join(", ");
			}
		} else if (metaTyping[graph.nodes[i].id] == "state") {
			if ("name" in graph.nodes[i].attrs) {
				graph.nodes[i].label = graph.nodes[i].attrs["name"].data[0];
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
        // console.log(JSON.stringify(graph.nodes[i]));
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


function displayLabels(svgId) {
	var svg = d3.select("#" + svgId),
		node = svg.selectAll(".node");

	node.append("text")
	  .attr("class", "label")
      .attr("dy", function(d) { 
      	return  -(d.radius + 5);
      } )
      // .attr("dx", ".35em")
      .text(function(d) { 
      	if (d.label) {
      		return d.label.slice(0, 20); }
      	})
      .style("fill", "#3e3d3d")
      .style("font-size", "10pt");
}

function hideLabels(svgId) {
	var svg = d3.select("#" + svgId),
		node = svg.selectAll(".node");

	node.selectAll("text").remove();
}


function visualiseGraph(graph, svgId, 
						nodeColors, nodeSizes,
						edgeStroke=null,
						highlightedEdgeStroke=null,
						simulationConf=null,
						progressConf=null,
						workerUrl=null, 
						nodePosUpdateUrl=null,
                     	clickHandlers={},
                     	onNodeDragStarted=null,
                     	threshold=null,
                     	zoom=true,
                     	saveLayoutButton=null,
                     	showLabels=false,
                        saveGeneratedNodePos=true) {

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
	var CTRL_SELECTED_COMPONENTS = [];

    var svg = d3.select("#" + svgId);

	// select svg canvas
	
	var	viewBox = svg.attr("viewBox").split(" "),
    	width = +viewBox[2],
      	height = +viewBox[3],
		active = d3.select(null);


    d3.select(svgId).selectAll("*").remove();


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
	var noPositionNodes = findNodesWithNoPosition(graph);

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

			mapEdgesToObjects(graph);

			// initalize web-worker
			var worker = new Worker(workerUrl);
			worker.postMessage({
			  nodes: graph.nodes,
			  links: graph.links,
			  width: width,
			  height: height,
			  noPositionNodes: noPositionNodes,
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

	var nodeClick = ("nodeClick" in clickHandlers) ? clickHandlers["nodeClick"] : function(d, i, el) {},
		multiNodeClick = ("multiNodeClick" in clickHandlers) ? clickHandlers["multiNodeClick"] : nodeClick,
		edgeClick = ("edgeClick" in clickHandlers) ? clickHandlers["edgeClick"] : function(d, i, el) {},
		unselectClick = ("unselectClick" in clickHandlers) ? clickHandlers["unselectClick"] : function(d, i, el) {};
	svg.on("click", function(d, i) {
		var outside = (d3.selectAll(".node").filter(function(d) { return d3.select(this).node() == d3.event.target.parentNode; }).empty()) &&
					  (d3.selectAll(".link").filter(function(d) { return d3.select(this).node() == d3.event.target.parentNode; }).empty());
		// console.log(d3.event.target, d3.selectAll("circle").filter(this == d3.event.target), d3.selectAll("line"), outside);
		if (!d3.event.ctrlKey && !d3.event.metaKey && outside) {
	
			CTRL_SELECTED_COMPONENTS = [];
			unselectClick(d, i, this);
		} else {

		}
	});

	// Nested functions 

	function ended(data) {
		// handle the end of the simulation with web-worker
		if ("init_update_progress" in progressConf) {
			progressConf["init_update_progress"]();
		}
		mapEdgesToObjects(graph);

        if (saveGeneratedNodePos) {
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
    			});
        } else {
            if ("remove_progress" in progressConf) progressConf["remove_progress"]();
            if ("init_svg" in progressConf) progressConf["init_svg"]();
            draw(data.nodes, data.links, false);
        }
	}


	function translateLinks(linkSelector, nodeSelector) {
        // translate links according to their source/target node pos
        var arrow = linkSelector.selectAll(".arrow"),
			linkBox = linkSelector.selectAll(".linkbox");
        linkBox
	        .attr("x1", function(d) {
                // if (CURRENT_DRAG_COMPONENTS) {
                //     if (CURRENT_DRAG_COMPONENTS.includes(d.source.id)) {
                //         console.log("s: ", nodeSelector.filter(
                //             function(e) {
                //                 return e.id == d.source.id;
                //             }));
                //     }
                //     if (CURRENT_DRAG_COMPONENTS.includes(d.target.id)) {
                //         console.log("t: ", nodeSelector.filter(
                //             function(e) {
                //                 return e.id == d.target.id;
                //             }));
                //     }
                // } 
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
	        .attr("x1", function(d) {
                // console.log(nodeSelector.filter(
                //     function(e) { 
                //         return e.id === d.source.id;
                //     }));
                // console.log(nodeSelector.filter(
                //     function(e) { 
                //         return e.id === d.target.id;
                //     }));
                return d.source.x; 
            })
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

	function ticked() {
		// Set positions of nodes and links corresponding to one tick of simulations
	  	var node = svg.selectAll(".node"),
	  	    link = svg.selectAll(".link");

	  	translateLinks(link, node);
	  	node.attr(
            "transform", 
           function(d) {
            	if (zoom && graph.nodes.length > 15) {
    				// zoom to fit the bounding box
		          	var boundaries = container.node().getBBox(),
			            bx = boundaries.x,
			            by = boundaries.y,
			            bheight = boundaries.height,
			            bwidth = boundaries.width;

			        var currentViewBox = svg.attr("viewBox");

			       var updatedView = "" + bx  +
	        						  " " + by + 
	        						  " " + bwidth + 
	        						  " " + bheight;
			        svg  
			            .attr("viewBox", updatedView)  
			            .attr("preserveAspectRatio", "xMidYMid meet")  
			            .call(zoom);
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
			// if (noPositionNodes == )

	        // defines forces between nodes and edges
	        var simulation = d3.forceSimulation()
	            .force("charge", d3.forceManyBody().strength(
	            	chargeStrength))
	            .force("link", 
	            	d3.forceLink()
	            	  .id(function(d) { return d.id; })
	            	  .iterations(5)
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
	            // .force("x", d3.forceX())
	            .force('y', d3.forceY().y(0.5 * height).strength(yStrength))
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
	        if (noPositionNodes.length == graph.nodes.length) {
	        	simulation.force("center", d3.forceCenter(width / 2, height / 2));
	        }
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
			.on("click", function(d, i) {
					return edgeClick(d, i, this);
				})
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
		          .on("drag", dragged))
		      .on("mouseover", 
	        	function(){ 
	        		d3.select(this).select(".nodebox").style("opacity", 0.4)
	        	})
	        	.on("mouseout", function(){
	    			d3.select(this).select(".nodebox").style("opacity", 0)
	    		});

	    // setup nodes circles
	    node.append("circle")
	      .attr("r", function(d) { return nodeSizes[d.id]; })
	      .attr("fill", function(d) { 
	      	return d3.rgb(nodeColors[d.id]); })
	      .attr("stroke-width", 0)
	      .attr("stroke", edgeStroke)
	   	  .on("dblclick", zoomInArea)
	   	  .on("click", function(d, i) {
			if (d3.event.ctrlKey || d3.event.metaKey) {
		   	  	CTRL_SELECTED_COMPONENTS.push(d.id);
				// console.log("CTRL detected: ", CTRL_SELECTED_COMPONENTS);
	   	  		if (CTRL_SELECTED_COMPONENTS.length > 1) {
		   	  		return multiNodeClick(d, i, this, CTRL_SELECTED_COMPONENTS);
		   	  	} else {
		   	  		return nodeClick(d, i, this);
		   	  	}
	   	  	} else {
	   	  		CTRL_SELECTED_COMPONENTS = [];
	   	  		CTRL_SELECTED_COMPONENTS.push(d.id);
	   	  		// console.log("CTRL cleared: ", CTRL_SELECTED_COMPONENTS);
	   	  		return nodeClick(d, i, this);
	   	  	}
	   	  });

	   	node.append("circle")
	   		.attr("class", "nodebox")
	      	.attr("r", function(d) { return nodeSizes[d.id] + 3; });

	   	node.append("title")
	      .text(function(d) { return d.id; });

	    if (showLabels) {
	    	displayLabels(svgId);
	    }

	    if (!simulate) {
	       ticked();
	    }


	    d3.select('#' + saveLayoutButton)
          .on('click', function() {
          	updateNodePositions(nodes, nodePosUpdateUrl, null, null, null);
          });

	}

	function zoomed() {
	    container.attr("transform", d3.event.transform); // updated for d3 v4
	}

	function dragstarted(d) {
		// d3.event.sourceEvent.stopPropagation();
		if (CTRL_SELECTED_COMPONENTS.length > 1) {
			CURRENT_DRAG_COMPONENTS = [];
			for (var i=0; i < CTRL_SELECTED_COMPONENTS.length; i++) {
				CURRENT_DRAG_COMPONENTS = CURRENT_DRAG_COMPONENTS.concat(
					onNodeDragStarted(CTRL_SELECTED_COMPONENTS[i]));
			}
			// console.log(CURRENT_DRAG_COMPONENTS);
		} else {
			CURRENT_DRAG_COMPONENTS = onNodeDragStarted(d.id);
		}
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
		  .filter(
                function(e) {
                        return (components.includes(e.id) && (e.id !== d.id));
                }).attr(
                "transform", 
                function(e) { return "translate(" + e.x + "," + e.y + ")"; });;

        componentSelector.each(function(e) {
			e.x += d3.event.dx;
		   	e.y += d3.event.dy;
            // console.log(e.x, e.y);
	    });

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