function id(d) { return d.id; }


function mergeAttributes(attrList) {
	var result = attrList[0];
	for (var i=1; i < attrList.length; i++) {
		for (var k in attrList[i]) {
			if (k in result) {
				for (var j=0; j < attrList[i][k]["data"].length; j++) {
					var el =  attrList[i][k]["data"][j];
					if (!result[k]["data"].includes(el)) {
						result[k]["data"].push(el);
					}
				}
			} else {
				result[k] = attrList[i][k];
			}
		}
	}
	return result;
}

function mergeNodes(graph, nodes) {
	if (nodes.length > 0) {
		// Accumulate attributes on the same node
		var targetNode = nodes[0];
			targetNodeIndex = null;
			otherNodesIndices = [],
			dataUpdate = {
				"merged": targetNode,
				"newLinks": [],
				"removedLinks": [],
				"removedNodes": [] 
			},
			attrList = [];

		var x=[], y=[];

		for (var i=0; i < graph.nodes.length; i++) {
			if (nodes.includes(graph.nodes[i].id)) {
				attrList.push(graph.nodes[i].attrs);
				if (graph.nodes[i].id == targetNode) {
					targetNodeIndex = i;
				} else {
					otherNodesIndices.push(i);
				}
				x.push(graph.nodes[i].x);
				y.push(graph.nodes[i].y);
			}
		}

		graph.nodes[targetNodeIndex].attrs = mergeAttributes(attrList);
		graph.nodes[targetNodeIndex].x = x.reduce((acc, n) => acc + n) / nodes.length;
		graph.nodes[targetNodeIndex].y = y.reduce((acc, n) => acc + n) / nodes.length;

		delete graph.nodes[targetNodeIndex].fx;
		delete graph.nodes[targetNodeIndex].fy;

		// Connect new edges
		var inNeighbors = {},
			outNeighbors = {},
			loopsAttrs = [],
			edge,
			linkIndicesToRemove = [];
		for (var i=0; i < graph.links.length; i++) {
			edge = graph.links[i];
			if (nodes.includes(edge.source.id)) {
				if (nodes.includes(edge.target.id)) {
					loopEdges.push(edge.attrs);
				} else {
					if (edge.target.id in outNeighbors) {
						outNeighbors[edge.target.id].attrs.push(edge.attrs);
					} else {
						outNeighbors[edge.target.id] = {
							"target": edge.target,
							"attrs": [edge.attrs],
							"distance": edge.distance,
							"strength": edge.strength
						};
					}
				}
				linkIndicesToRemove.push(i);
			} else if (nodes.includes(edge.target.id)) {
				if (edge.source.id in inNeighbors) {
					inNeighbors[edge.source.id].attrs.push(edge.attrs);
				} else {
					inNeighbors[edge.source.id] = {
						"source": edge.source,
						"attrs": [edge.attrs],
						"distance": edge.distance,
						"strength": edge.strength
					};
				}
				linkIndicesToRemove.push(i);
			}
		}

		for (var n in inNeighbors) {
			inNeighbors[n].attrs = mergeAttributes(inNeighbors[n].attrs);
			inNeighbors[n].target = graph.nodes[targetNodeIndex];
			graph.links.push(inNeighbors[n]);
			dataUpdate["newLinks"].push({
				"source": inNeighbors[n].source.id,
				"target": inNeighbors[n].target.id
			});
		}
		for (var n in outNeighbors) {
			outNeighbors[n].attrs = mergeAttributes(outNeighbors[n].attrs);
			outNeighbors[n].source = graph.nodes[targetNodeIndex];
			graph.links.push(outNeighbors[n]);
			dataUpdate["newLinks"].push([
				outNeighbors[n].source.id,
				outNeighbors[n].target.id
			]);
		}

		// Remove other nodes and edges
		for (var i=otherNodesIndices.length - 1; i >=0; i--) {
			dataUpdate["removedNodes"].push(graph.nodes[otherNodesIndices[i]].id);
			graph.nodes.splice(otherNodesIndices[i], 1); 
		}

		for (var i=linkIndicesToRemove.length - 1; i >= 0; i--) {
			dataUpdate["removedLinks"].push([
				graph.links[linkIndicesToRemove[i]].source.id,
				graph.links[linkIndicesToRemove[i]].target.id
			]);
			graph.links.splice(linkIndicesToRemove[i], 1);
		}


		return dataUpdate;
	}
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
			[graph.links[i].source.id ? graph.links[i].source.id : graph.links[i].source,
			 graph.links[i].target.id ? graph.links[i].target.id : graph.links[i].target ]);
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


//Selects and returns the attributes to display
function getNodeAttributes(d) {
	var attrs = "";
	for (var key in d){
	  if (d.hasOwnProperty(key)) {
	    if (attrs != "") attrs += " | ";
	    var data = d[key].data;
	    if (data === "(.|\n)*") {
	      attrs = attrs + key + " : STRING"; 
	    } else if ((data.length === 1) &&
	               (data[0].length === 2) && 
	               (data[0][0] === "-inf") &&
	               (data[0][1] === "inf")) {
	      attrs = attrs + key + " : INTEGER"; 
	    } else {
	      attrs = attrs + key + " : " + d[key].data;
	    }
	  }
	}
	if (attrs == "") {
	  attrs = "No attributes to display";
	}
	return attrs;
}


function removeGraphComponent(svg, graph, metaTyping, componentId, callbackFunction) {
	var subcomponents = getAllComponents(graph, metaTyping, componentId);
	const target = (el) => el == componentId || subcomponents.includes(el);

	var nodesToRemove = graph.nodes.filter(
		(d) => target(d.id));
	var linksToRemove = graph.links.filter(
		(d) => target(d.source.id) || target(d.target.id) || target(d.source) || target(d.target));

	console.log(nodesToRemove);
	console.log(linksToRemove);

	for (var i = nodesToRemove.length - 1; i >= 0; i--) {
		removeItem(graph.nodes, nodesToRemove[i]);
	}

	for (var i = linksToRemove.length - 1; i >= 0; i--) {
		removeItem(graph.links, linksToRemove[i]);
	}

	if (svg) {
		svg.selectAll(".node")
		   .filter(
		   		(d) => target(d.id))
		   .remove();
		svg.selectAll(".link")
			.filter(
				(d) => target(d.source.id) || target(d.target.id))
			.remove();
	}

	if (callbackFunction) {
  		callbackFunction();
  	}
}