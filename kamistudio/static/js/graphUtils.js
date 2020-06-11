function id(d) { return d.id; }

// GENERIC UTILS -------------

function generateNewNodeId(graph, prefix) {
	var name = prefix,
		node = findNodeById(graph, prefix),
		i = 1;
	while (node) {
		var name = prefix + i;
		node = findNodeById(graph, name);
		i += 1;
	}
	return name;
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


function successors(graph, edgeList, nodeId) {
	var ps = [];
	for (var i=0; i < graph.nodes.length; i++) {
		var d = graph.nodes[i];
		if (isConnected(edgeList, nodeId, d.id)) {
			ps.push(d.id);
		}
	}
	return ps;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

function findNodeById(graph, nodeId) {
	var nodeById = d3.map(graph.nodes, id);
	var node = nodeById.get(nodeId);
	return node;
}

function findEdgeByIds(graph, sourceId, targetId) {
	var links = graph.links.filter(
		(d) => ((d.source.id == sourceId) || (d.source == sourceId)) && ((d.target.id == targetId) || (d.target == targetId)) 
	);
	if (links.length == 1) {
		return links[0];
	} else {
		return null;
	}
}

function getEdgeList(graph) {
	var edgeList = [];
	for (var i=0; i < graph.links.length; i++) {
		edgeList.push(
			[graph.links[i].source.id ? graph.links[i].source.id : graph.links[i].source,
			 graph.links[i].target.id ? graph.links[i].target.id : graph.links[i].target ]);
	}
	return edgeList;
}

function isConnected(edgeList, sourceId, targetId) {
	for (var i=0; i < edgeList.length; i++) {
		if ((edgeList[i][0] == sourceId) && (edgeList[i][1] == targetId)) {
			return true;
		}
	}
	return false;
}


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

// Rewriting utils -----------------

function mergeNodes(graph, nodes, clearPosition=false) {
	if (nodes.length > 0) {
		// Accumulate attributes on the same node
		var targetNode = nodes[0],
			targetNodeIndex = null,
			otherNodesIndices = [],
			mergingResult = targetNode,
			attrList = [];

		for (var i=0; i < graph.nodes.length; i++) {
			if (nodes.includes(graph.nodes[i].id)) {
				attrList.push(graph.nodes[i].attrs);
				if (graph.nodes[i].id == targetNode) {
					targetNodeIndex = i;
				} else {
					otherNodesIndices.push(i);
				}
			}
		}

		graph.nodes[targetNodeIndex].attrs = mergeAttributes(attrList);

		if (clearPosition) {
			delete graph.nodes[targetNodeIndex].fx;
			delete graph.nodes[targetNodeIndex].fy;
			delete graph.nodes[targetNodeIndex].x;
			delete graph.nodes[targetNodeIndex].y;
		}

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
					};
				}
				linkIndicesToRemove.push(i);
			}
		}

		for (var n in inNeighbors) {
			inNeighbors[n].attrs = mergeAttributes(inNeighbors[n].attrs);
			inNeighbors[n].target = graph.nodes[targetNodeIndex];
			graph.links.push(inNeighbors[n]);
		}
		for (var n in outNeighbors) {
			outNeighbors[n].attrs = mergeAttributes(outNeighbors[n].attrs);
			outNeighbors[n].source = graph.nodes[targetNodeIndex];
			graph.links.push(outNeighbors[n]);
		}

		// Remove other nodes and edges
		for (var i=otherNodesIndices.length - 1; i >=0; i--) {
			graph.nodes.splice(otherNodesIndices[i], 1); 
		}

		for (var i=linkIndicesToRemove.length - 1; i >= 0; i--) {
			graph.links.splice(linkIndicesToRemove[i], 1);
		}


		return targetNode;
	}
}

function mergeNodesAndUpdateSvg(graph, nodes) {
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

		var x = [], y = [];

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

function cloneNode(graph, nodeId, nClones, clearPosition=false) {
	var originalNode = findNodeById(graph, nodeId),
		clones = [],
		currentNodeId, newNode;

	if (clearPosition) {
		delete originalNode["x"];
		delete originalNode["y"];
		delete originalNode["fx"];
		delete originalNode["fy"];
	}

	// add new nodes
	for (var i = 1; i < nClones; i++) {
		currentNodeId = generateNewNodeId(graph, nodeId + i);
		newNode = JSON.parse(JSON.stringify(originalNode));
		newNode.id = currentNodeId;
		clones.push(newNode);
		graph.nodes.push(newNode);
	}
	// reconnect edges
	var edgeList = getEdgeList(graph),
		preds = predecessors(graph, edgeList, nodeId),
		succs = successors(graph, edgeList, nodeId),
		edge;

	var visited = [];
	for (var j = preds.length - 1; j >= 0; j--) {
		edge = findEdgeByIds(graph, preds[j], nodeId);
		edge.target = originalNode.id;
		visited.push([preds[j], nodeId]);
		for (var i = clones.length - 1; i >= 0; i--) {
			newEdge = JSON.parse(JSON.stringify(edge));
			newEdge.target = clones[i].id;
			graph.links.push(newEdge);
		}
	}

	for (var j = succs.length - 1; j >= 0; j--) {
		if (!visited.includes([nodeId, succs[j]])) {
			edge = findEdgeByIds(graph, nodeId, succs[j]);
			edge.source = originalNode.id;
			for (var i = clones.length - 1; i >= 0; i--) {
				newEdge = JSON.parse(JSON.stringify(edge));
				newEdge.source = clones[i].id;
				graph.links.push(newEdge);
			}
		}
	}
	var cloneIds = [nodeId];
	return cloneIds.concat(clones.map((d) => d.id));
}

function removeNode(graph, nodeId) {
	const target = (el) => el == nodeId;

	var node = findNodeById(graph, nodeId);
	removeItem(graph.nodes, node);

	// clean-up edges
	var linksToRemove = graph.links.filter(
		(d) => target(d.source.id) || target(d.target.id) || target(d.source) || target(d.target));

	for (var i = linksToRemove.length - 1; i >= 0; i--) {
		removeItem(graph.links, linksToRemove[i]);
	}
}

function removeEdge(graph, sourceId, targetId) {
	var edge = findEdgeByIds(graph, sourceId, targetId);
	removeItem(graph.links, edge);
}


function removeElementAttrs(element, attrsToRemove) {
	var valuesToRemove, value;
	for (var key in attrsToRemove) {
		if (key in element["attrs"]) {
			valuesToRemove = attrsToRemove[key].data;
			for (var i = valuesToRemove.length - 1; i >= 0; i--) {
				value = valuesToRemove[i];
				if ((element["attrs"][key].data) && (element["attrs"][key].data).includes(value)) {
			 		removeItem(element["attrs"][key].data, value);
			 	}
			} 
		}
	}
}

function addElementAttrs(element, attrsToAdd) {
	var valuesToAdd, value;
	for (var key in attrsToAdd) {
		valuesToAdd = attrsToAdd[key].data;
		if (key in element["attrs"]) {
			for (var i = valuesToAdd.length - 1; i >= 0; i--) {
				value = valuesToAdd[i];
				if ((element["attrs"][key].data) && (!(element["attrs"][key].data).includes(value))) {
			 		element["attrs"][key].data.push(value);
			 	}
			} 
		} else {
			element["attrs"][key] = {
				"data": [].concat(valuesToAdd),
				"type": "FiniteSet"
			}
		}
	}
}


function mapLinksToIds(graph) {
	var itemsToRemove = [],
		itemsToAdd = [];
	for (var i = graph.links.length - 1; i >= 0; i--) {
		var newEdge = JSON.parse(JSON.stringify(graph.links[i]));
		if (graph.links[i].source.id) {
			newEdge.source = graph.links[i].source.id;
		}
		if (graph.links[i].target.id) {
			newEdge.target = graph.links[i].target.id;
		}
		itemsToRemove.push([newEdge.source, newEdge.target]);
		itemsToAdd.push(newEdge);
	}
	for (var i = itemsToRemove.length - 1; i >= 0; i--) {
		removeEdge(graph, itemsToRemove[i][0], itemsToRemove[i][1]);
	}
	for (var i = itemsToAdd.length - 1; i >= 0; i--) {
		graph.links.push(itemsToAdd[i]);
	}
}

function applyRuleTo(graph, rule, instance, clearPosition=false, eventHandlers=null) {

	var pInstance = JSON.parse(JSON.stringify(instance));

	if (!eventHandlers) {
		eventHandlers = {};
	}

	// Clone nodes
	for (var lhsNode in rule["cloned_nodes"]) {
		var pNodes = rule["cloned_nodes"][lhsNode];
		var newNodeNames = cloneNode(
			graph, instance[lhsNode], pNodes.length, clearPosition);
		delete pInstance[lhsNode];
		for (var i = newNodeNames.length - 1; i >= 0; i--) {
			pInstance[pNodes[i]] = newNodeNames[i];
		}
		if ("onCloneNode" in eventHandlers) {
			eventHandlers["onCloneNode"](instance[lhsNode], newNodeNames);
		}
	}

	// Remove nodes
	for (var i = rule["removed_nodes"].length - 1; i >= 0; i--) {
		var lhsNode = rule["removed_nodes"][i];
		removeNode(graph, instance[lhsNode]);
		delete pInstance[lhsNode];
		if ("onRemoveNode" in eventHandlers) {
			eventHandlers["onRemoveNode"](instance[lhsNode]);
		}
	}

	// rename untouched nodes
	for (var k in rule["p_lhs"]) {
		if (!(k in pInstance) && (rule["p_lhs"][k] in pInstance)) {
			var val = pInstance[rule["p_lhs"][k]];
			delete pInstance[rule["p_lhs"][k]];
			pInstance[k] = val;
		}
	}

	// Remove edges
	for (var i = rule["removed_edges"].length - 1; i >= 0; i--) {
		var edge = rule["removed_edges"][i];
		removeEdge(graph, pInstance[edge[0]], pInstance[edge[1]]);
		if ("onRemoveEdge" in eventHandlers) {
			eventHandlers["onRemoveEdge"](pInstance[edge[0]], pInstance[edge[1]]);
		}
	}

	// Remove node/edge attrs
	var attrs, node;
	for (var el in rule["removed_node_attrs"]) {
		attrs = rule["removed_node_attrs"][el];
		node = findNodeById(graph, pInstance[el]);
		removeElementAttrs(node, attrs);
		if ("onRemoveNodeAttrs" in eventHandlers) {
			eventHandlers["onRemoveNodeAttrs"](pInstance[el], attrs);
		}
	}

	var attrs, edge;
	for (var edge in rule["removed_edge_attrs"]) {
		attrs = rule["removed_edge_attrs"][el];
		edge = findEdgeByIds(graph, pInstance[edge[0]], pInstance[edge[0]]);
		removeElementAttrs(edge, attrs);
		if ("onRemoveEdgeAttrs" in eventHandlers) {
			eventHandlers["onRemoveEdgeAttrs"](pInstance[edge[0]], pInstance[edge[0]], attrs);
		}
	}

	var rhsInstance = JSON.parse(JSON.stringify(pInstance));

	// Merge nodes
	var pNodes, res, mergedNode;
	for (var rhsNode in rule["merged_nodes"]) {
		pNodes = rule["merged_nodes"][rhsNode];
		res = mergeNodes(
			graph, pNodes.map((item) => pInstance[item]),
			clearPosition);
		for (var i = pNodes.length - 1; i >= 0; i--) {
			delete pInstance[pNodes[i]];
		}
		rhsInstance[rhsNode] = res["merged"];
		if ("onMergeNodes" in eventHandlers) {
			eventHandlers["onMergeNodes"](pNodes.map((item) => pInstance[item]), res["merged"]);
		}
	}

	// Add nodes

	// rename untouched nodes
	for (var k in rule["p_rhs"]) {
		if (!(rule["p_rhs"][k] in rhsInstance) && (rule[k] in rhsInstance)) {
			var val = rhsInstance[k];
			delete rhsInstance[k];
			pInstance[rule["p_rhs"][k]] = val;
		}
	}

	// Add edges

	// Add node/edge attrs
	var attrs, node;
	for (var el in rule["added_node_attrs"]) {
		attrs = rule["added_node_attrs"][el];
		node = findNodeById(graph, rhsInstance[el]);

		addElementAttrs(node, attrs); 
		if ("onAddNodeAttrs" in eventHandlers) {
			eventHandlers["onAddNodeAttrs"](rhsInstance[el], attrs);
		}
	}

	var attrs, edge;
	for (var edge in rule["added_edge_attrs"]) {
		attrs = rule["added_edge_attrs"][el];
		edge = findEdgeByIds(graph, rhsInstance[edge[0]], rhsInstance[edge[0]]);
		addElementAttrs(edge, attrs); 
		if ("onAddEdgeAttrs" in eventHandlers) {
			eventHandlers["onAddEdgeAttrs"](rhsInstance[edge[0]], rhsInstance[edge[0]], attrs);
		}
	}

	return rhsInstance;
}


// KAMI-graphs utils -------------------

function getAllComponents(graph, typing, draggedNodeId) {
    // Dragging of subcomponents of a node
    var components = [];

    var edgeList = getEdgeList(graph);

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

function filterNotComponents(typing, allPredecessors) {
	var result = [];
	for (var i=0; i < allPredecessors.length; i++) {
		if ((typing[allPredecessors[i]] != "bnd") && (typing[allPredecessors[i]] != "mod")) {
			result.push(allPredecessors[i]);
		}
	}
	return result;
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
