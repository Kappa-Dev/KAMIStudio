function id(d) { return d.id; }

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