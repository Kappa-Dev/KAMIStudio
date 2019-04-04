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


var HIGHLIGHT_COLOR = "#337ab7";
var INSTANCE_HIGHLIGHT_COLOR = "#a11117";


function displayHiddenSvg(readonly) {
	return function() {
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("ctrlClickMessage").style.display = "initial";
		if (!readonly) {
			document.getElementById("saveLayoutButton").disabled = false;
		}
	}
}


function sendUpdateNodeAttrs(model_id, nodeId, attrs, successCallback) {
	$.ajax({
	    url:  model_id + "/update-node-attrs",
	    type: 'post',
	    data: JSON.stringify({
	    	"id": nodeId,
	    	"attrs": attrs
	    }),
	    dataType: 'json',
    	contentType: 'application/json',
	}).done(function () {
		// if (successCallback) successCallback();
	}).fail(function (xhr, status, error) {
		console.log("Failed to update new node positions");
		console.log(error);
		// if (failCallback) failCallback();
	});
}

function sendUpdateEdgeAttrs(model_id, sourceId, targetId, attrs) {
	$.ajax({
	    url:  model_id + "/update-edge-attrs",
	    type: 'post',
	    data: JSON.stringify({
	    	"source": sourceId,
	    	"target": targetId,
	    	"attrs": attrs
	    }),
	    dataType: 'json',
    	contentType: 'application/json',
	}).done(function () {
		// if (successCallback) successCallback();
	}).fail(function (xhr, status, error) {
		console.log("Failed to update new node positions");
		console.log(error);
		// if (failCallback) failCallback();
	});
}

function updateNodeAttrs(model_id, instantiated, graph, metaTyping, d, i) {
	return function(attrs, oldAttrs) {
		for (var i=0; i < graph.nodes.length; i++) {
			if (graph.nodes[i].id === d.id) {
				for (var k in attrs) {
					if (k in graph.nodes[i].attrs) {
						// modify js graph object 
						graph.nodes[i].attrs[k].data = [attrs[k]];
					} else {
						graph.nodes[i].attrs[k] = {
							data: [attrs[k]],
							type: "FiniteSet"
						}
					}
				}
				// re-render info-boxes
				handleNodeClick(model_id, instantiated, graph, metaTyping)(d, i); 
				// send attr update to the server
				sendUpdateNodeAttrs(
					model_id, d.id, graph.nodes[i].attrs);
			}
		}
		
	};
}

function updateEdgeAttrs(model_id, instantiated, graph, metaTyping, d, i) {
	return function(attrs, oldAttrs) {
		for (var i=0; i < graph.links.length; i++) {
			if ((graph.links[i].source.id === d.source.id) &&
				(graph.links[i].target.id === d.target.id)) {
				for (var k in attrs) {
					// modify js graph object 
					if (k in graph.links[i].attrs) {
						graph.links[i].attrs[k].data = [attrs[k]];
					} else {
						graph.links[i].attrs[k] = {
							data: [attrs[k]],
							type: "FiniteSet"
						};
					}
					
				}
				// re-render updated boxes
				handleEdgeClick(model_id, instantiated, graph, metaTyping)(d, i);
				sendUpdateEdgeAttrs(model_id, d.source.id, d.target.id, graph.links[i].attrs);
			}
		}

		// send attr update to the server
		
	};
}


function handleMultipleNodeClick(model_id, instantiated, graph, metaTyping) {
	return function(d, i, el) {
		// deselect all the selected elements
	    var svg = d3.select("#actionGraphSvg");

	    var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    // svg.selectAll("circle")
	    //   .attr("stroke-width", 0);
	    // console.log(d3.select(el));
	    // select current element
		d3.select(el)
	      .attr("stroke-width", 2)
	      .attr("stroke", d3.rgb(highlight));

	    // call react func

	    ReactDOM.render(
	      [<ElementInfoBox id="graphElement" 
	      				   items={[]}/>,
	       <MetaDataBox id="metaData"
	       				items={[]}/>],
	      document.getElementById('graphInfoBoxes')
	    );
	};
}


function handleUnselectNodeClick(instantiated) {
	return function(d, i, el) {
		// deselect all the selected elements
	    var svg = d3.select("#actionGraphSvg");

	    var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    svg.selectAll("circle")
	      .attr("stroke-width", 0);


	    // call react func
	    ReactDOM.render(
	      [<ElementInfoBox id="graphElement" />,
	       <MetaDataBox id="metaData" />],
	      document.getElementById('graphInfoBoxes')
	    );
	};
}

function handleNodeClick(model_id, instantiated, graph, metaTyping, readonly) {
	return function(d, i, el) {
		// deselect all the selected elements
		console.log(d.attrs);
	    var svg = d3.select("#actionGraphSvg");

	    var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    svg.selectAll("circle")
	      .attr("stroke-width", 0);
	    // select current element
		d3.select(el)
	      .attr("stroke-width", 2)
	      .attr("stroke", d3.rgb(highlight));

	    // call react func

	    ReactDOM.render(
	      [<ElementInfoBox id="graphElement" 
	      				   elementId={d.id}
	      				   elementType="node"
	      				   metaType={metaTyping[d.id]}
	      				   editable={false}
	      				   instantiated={instantiated}/>,
	       <MetaDataBox id="metaData"
	       				   elementId={d.id}
	       				   elementType="node"
	       				   metaType={metaTyping[d.id]}
	       				   attrs={d.attrs}
	       				   editable={true}
	       				   readonly={readonly}
	       				   instantiated={instantiated}
	       				   onDataUpdate={updateNodeAttrs(
	       				   		model_id, instantiated, graph, metaTyping, d, i)}/>],
	      document.getElementById('graphInfoBoxes')
	    );
	};
}

function handleEdgeClick(model_id, instantiated, graph, metaTyping, readonly) {
	return function(d, i, el) {
		// deselect all the selected elements
		var svg = d3.select("#actionGraphSvg");

		var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

	    svg.selectAll("circle")
	      .attr("stroke-width", 0);
	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#actionGraphSvgarrow)");
	    d3.select(el)
	      // .attr("stroke-width", 2)
	      .select(".arrow")
	      .style("stroke", d3.rgb(highlight))
	      .attr("marker-end", "url(#actionGraphSvgarrow-selected)");
	    // call react func
	    ReactDOM.render(
	      [<ElementInfoBox id="graphElement"
	      				   elementType="edge"
		       			   sourceId={d.source.id}
		       			   targetId={d.target.id}
		       			   sourceMetaType={metaTyping[d.source.id]}
	       				   targetMetaType={metaTyping[d.target.id]}
	       				   editable={false}
	       				   instantiated={instantiated}/>,
	       <MetaDataBox id="metaData"
	       				sourceId={d.source.id}
	       				targetId={d.target.id}
	       				elementType="edge"
	       				sourceMetaType={metaTyping[d.source.id]}
	       				targetMetaType={metaTyping[d.target.id]}
	       				attrs={d.attrs}
	       				editable={true}
	       				readonly={readonly}
	       				instantiated={instantiated}
	       				onDataUpdate={updateEdgeAttrs(
	       					model_id, instantiated, graph, metaTyping, d, i)}/>],
	      document.getElementById('graphInfoBoxes')
	    );
	};
}

function handleDragStarted(graph, metaTyping) {
	return function(d_id) {
		if ((metaTyping[d_id] != "state") &&
			(metaTyping[d_id] != "bnd") && 
			(metaTyping[d_id] != "mod")) {
			return getAllComponents(
				graph, metaTyping, d_id).concat([d_id]);
		} else {
			return [d_id];
		}
	}
}

function getActionGraphAndVisualize(model_id, workerUrl, instantiated=false,
									readonly=false) {
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
		console.log(nodePos);
		initNodePosition(actionGraph, nodePos, Object.keys(nodePos));
		initLinkStrengthDistance(actionGraph, metaTyping);
		initCircleRadius(actionGraph, metaTyping, AG_META_SIZES);

		var simulationConf = {
			"charge_strength": -400,
			"collide_strength": 1.8,
		}

		var progressConf = {
			"remove_progress": removeProgressBlock,
			"init_svg": displayHiddenSvg(readonly),
			"init_layout_progress": () => initilizeLayoutProgressBar(instantiated),
			"init_update_progress": initializePositionUpdateProgressBar,
			"ag_loading_progress": updateAGLoadingProgress
		}

		var highlight;
		if (instantiated) {
			highlight = INSTANCE_HIGHLIGHT_COLOR;
		} else {
			highlight = HIGHLIGHT_COLOR;
		}

		var clickHandlers = {
			"nodeClick": handleNodeClick(
                model_id, instantiated, actionGraph, metaTyping, readonly), 
			"multiNodeClick": handleMultipleNodeClick(
				model_id, instantiated, actionGraph, metaTyping),
			"edgeClick": handleEdgeClick(
                model_id, instantiated, actionGraph, metaTyping, readonly),
			"unselectClick": handleUnselectNodeClick(instantiated)
		}

		visualiseGraph(actionGraph,
					   "actionGraphSvg", 
						nodeColors, 
						nodeSizes,
						null,
						highlight,
						simulationConf,
						progressConf,
						workerUrl, 
						nodePosUpdateUrl,
                     	clickHandlers,
                     	handleDragStarted(actionGraph, metaTyping),
                    	300,
                    	true,
                    	"saveLayoutButton");
	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}
