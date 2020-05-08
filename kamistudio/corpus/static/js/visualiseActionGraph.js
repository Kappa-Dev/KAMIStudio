function displayHiddenSvg(readonly) {
	return function() {
		document.getElementById("actionGraphSvg").style.display = "initial";
		document.getElementById("ctrlClickMessage").style.display = "initial";
		if (!readonly) {
			document.getElementById("saveLayoutButton").disabled = false;
		}
	}
}

function getLabels(d) {

}

function showActionNuggets(modelId, actionId, instantiated, readonly) {
	return function() {
		getData(
			modelId + "/get-action-nuggets/" + actionId,
			viewActionNuggets(modelId, instantiated, readonly));
	};
}

function showGeneVariants(modelId, geneId, uniprotid, instantiated, readonly) {

	return function() {

		function renderSelectedDefinitons(data) {
			var list = renderDefinitionList(modelId, readonly)(data);

			if (!(uniprotid in data)) {
				// show a dialog 'no variants found'
				function removeNoVariantsModal(switchEnabled=true) {
			        ReactDOM.render(
			            null,
			            document.getElementById("definitionDialog")
			        );
			        if (switchEnabled) {
				        switchToAG($("#switchToAGTab"));
				    }
			    };

			    var footer = <a type="button"
		                       onClick={() => removeNoVariantsModal(true)}
		                       id="backToAG" className="btn btn-default btn-md">
		                        Back to the action graph
		                  	</a>;

				ReactDOM.render(
			        <InBlockDialog id="selectedDefinition"
			                       title="No protein variants"
			                       onRemove={removeNoVariantsModal}
			                       content={"No protein definitons for the gene '" + uniprotid + "' found"  }
			                       footerContent={footer}/>,
			        document.getElementById("definitionDialog")
			    );
			} else {
				// select variants from the list
				list.onItemClick(uniprotid, uniprotid, data[uniprotid].variants, false);
				viewDefinition(modelId, readonly, data)(
					uniprotid, uniprotid, data[uniprotid].variants, list.setSubitemClick);
			}
		};

		switchToDefinitions($("#switchToDefinitionsTab"));

		getData(
			modelId + "/definitions", renderSelectedDefinitons);

		$("#switchToDefinitionsTab").attr("onClick", "switchToDefinitions(this);");

	};
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
	    var graph = data["actionGraph"],
	    	semantics = data["semantics"],
	    	metaTyping = data["metaTyping"],
	    	nodePos = data["nodePosition"],
	    	cc = data["connectedComponents"],
	    	nodePosUpdateUrl = model_id + "/update-ag-node-positioning",
	    	nodeSizes = computeNodeSizes(graph, metaTyping, AG_META_SIZES);

	    for (var i = graph.nodes.length - 1; i >= 0; i--) {
	    	if (graph.nodes[i].id in semantics) {
	    		var pretty = [];
	    		for (var j = semantics[graph.nodes[i].id].length - 1; j >= 0; j--) {
	    			if (semantics[graph.nodes[i].id][j] in PRETY_SEMANTIC_NAMES) {
			    		pretty.push(PRETY_SEMANTIC_NAMES[semantics[graph.nodes[i].id][j]]);
			    	} else {
			    		pretty.push(semantics[graph.nodes[i].id][j]);
			    	}
			    }
	    		graph.nodes[i].semantics = pretty;		
	    	}
	    }


	    var nodeColors;
	    if (instantiated) {
		    nodeColors = computeNodeColors(
		    	graph, metaTyping, INSTANCE_META_COLORS);
		} else {
			nodeColors = computeNodeColors(
		    	graph, metaTyping, META_COLORS);
		}

		initNodePosition(graph, nodePos, Object.keys(nodePos));
		if ((Object.keys(nodePos).length == 0) && (Object.keys(cc).length > 0)) {
			initCCPositions(graph, cc, "actionGraphSvg");
		}
		initLinkStrengthDistance(graph, metaTyping);
		initCircleRadius(graph, metaTyping, AG_META_SIZES);
		initNodeLabels(graph, metaTyping, instantiated);

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
			"nodeClick": handleNodeClick, 
			"multiNodeClick": handleMultipleNodeClick,
			"edgeClick": handleEdgeClick,
			"unselectClick": handleUnselectNodeClick
		}

		visualiseGraph(graph,
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
                     	handleDragStarted,
                    	50,
                    	true,
                    	"saveLayoutButton");


		function sendUpdateNodeAttrs(nodeId, attrs, successCallback) {
			$.ajax({
			    url:  model_id + "/update-ag-node-attrs",
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

		function sendUpdateEdgeAttrs(sourceId, targetId, attrs) {
			$.ajax({
			    url:  model_id + "/update-ag-edge-attrs",
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

		function updateNodeAttrs(d, i) {
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
						handleNodeClick(d, i); 
						// send attr update to the server
						sendUpdateNodeAttrs(
							d.id, graph.nodes[i].attrs);
					}
				}
				
			};
		}

		function updateEdgeAttrs(d, i) {
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
						handleEdgeClick(d, i);
						sendUpdateEdgeAttrs(d.source.id, d.target.id, graph.links[i].attrs);
					}
				}

				// send attr update to the server
				
			};
		}


		function mergeAgNodes(selectedComponents) {
			// send request to merge on the server
			$.ajax({
			    url:  model_id + "/merge-action-graph-nodes",
			    type: 'post',
			    data: JSON.stringify({
			    	"nodes": selectedComponents
			    }),
			    dataType: 'json',
		    	contentType: 'application/json',
			}).done(function () {
				// if (successCallback) successCallback();
			}).fail(function (xhr, status, error) {
				console.log("Failed to send node merge request");
				console.log(error);
				// if (failCallback) failCallback();
			});

			var dataUpdate = mergeNodes(graph, selectedComponents);
			var svg = d3.select("#actionGraphSvg");
			svg.selectAll("*").remove()

			visualiseGraph(graph,
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
                     	handleDragStarted,
                    	300,
                    	true,
                    	"saveLayoutButton");
			
			// svg.selectAll(".node").filter(
			// 	function(d) {
			// 		return dataUpdate["removedNodes"].includes(d.id);
			// 	}).remove();
			// svg.selectAll(".link").filter(
			// 	function(d) {
			// 		return dataUpdate["removedLinks"].find(
			// 			(el) => (el[0] == d.source.id && el[1] == d.target.id));
			// 	}).remove();

			// TODO: put addition of links
		}


		function handleMultipleNodeClick(d, i, el, selectedComponents) {
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

		    function distinct(value, index, self) { 
			    return self.indexOf(value) === index;
			}

		    // Add merge nodes button
		    var button = null;
		    var types = [];
		    for (var i=0; i < selectedComponents.length; i++) {
		    	types.push(metaTyping[selectedComponents[i]]);
		    }
		    if (types.filter(distinct).length == 1) {
		    	button =
	    			<div style={{"text-align": "center"}}>
		    			<button 
		    				disabled={readonly}
		    				onClick={() => mergeAgNodes(selectedComponents)}
		    				className="btn btn-default btn-md panel-button add-interaction-button">
				       			<span class="glyphicon glyphicon-resize-small"></span> Merge nodes
				       	</button>
				    </div>;
		    }

		    var semantics = null;
		    if (!instantiated) {
		    	semantics = <SemanticsBox id="semantics"
		       				 items={[]}/>;
		    }

		    // call react func
		    ReactDOM.render(
		      [<ElementInfoBox id="graphElement" 
		      				   instantiated={instantiated}
		      				   items={[]}/>,
		       <MetaDataBox id="metaData"
		       			    instantiated={instantiated}
		       				items={[]}/>,
		       semantics,
		       button
		      ],
		      document.getElementById('graphInfoBoxes')
		    );
		}

		function handleUnselectNodeClick(d, i, el) {
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

		    var semantics = null;
		    if (!instantiated) {
		    	semantics = <SemanticsBox id="semantics" items={[]}/>;
		    }

		    // call react func
		    ReactDOM.render(
		      [<ElementInfoBox id="graphElement"
		      				   instantiated={instantiated}/>,
		       <MetaDataBox id="metaData"
		       				instantiated={instantiated}/>,
		       semantics
		       ],
		      document.getElementById('graphInfoBoxes')
		    );
		}

		function handleNodeClick(d, i, el) {
			// deselect all the selected elements
		    var svg = d3.select("#actionGraphSvg");

		    var highlight;
			if (instantiated) {
				highlight = INSTANCE_HIGHLIGHT_COLOR;
			} else {
				highlight = HIGHLIGHT_COLOR;
			}

			expandSideBar();

		    svg.selectAll(".arrow")
		      .style("stroke", d3.rgb("#B8B8B8"))
		      .attr("marker-end", "url(#actionGraphSvgarrow)");
		    svg.selectAll("circle")
		      .attr("stroke-width", 0);
		    // select current element
			d3.select(el)
		      .attr("stroke-width", 2)
		      .attr("stroke", d3.rgb(highlight));

		    // If gene node is selected add Create variant button
		    var button = null;
		    if (!instantiated && metaTyping[d.id] == "protoform") {
		    	button = [
		    		<div style={{"text-align": "center"}}>
	    				<a 
		    				onClick={showGeneVariants(model_id, d.id, d.attrs["uniprotid"].data[0], instantiated, readonly)}
		    				className="btn btn-default btn-md panel-button add-interaction-button">
				       			<span class="glyphicon glyphicon-eye-open"></span> Show variants
				       	</a>
	    				<a 
		    				href={model_id + "/add-variant/" + d.id}
		    				className="btn btn-default btn-md panel-button add-interaction-button">
				       			<span class="glyphicon glyphicon-plus"></span> Add variant
				       	</a>
				    </div>
				];
		    }

		    if (metaTyping[d.id] == "mod" || metaTyping[d.id] == "bnd") {
		    	button =
	    			<div style={{"text-align": "center"}}>
	    				<a 
		    				onClick={showActionNuggets(model_id, d.id, instantiated, readonly)}
		    				className="btn btn-default btn-md panel-button add-interaction-button">
				       			<span class="glyphicon glyphicon-eye-open"></span> Show nuggets
				       	</a>
				    </div>;
		    }

		    var semantics = null;
		    if (!instantiated) {
		    	semantics = <SemanticsBox id="semantics"
		       				 elementId={d.id}
 	       				 	 semantics={d.semantics}
		       				 elementType="node"
		       				 editable={false}
		       				 readonly={readonly}/>;
		    }

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
		       				   onDataUpdate={updateNodeAttrs(d, i)}/>,
		       	semantics,
		       	button],
		      document.getElementById('graphInfoBoxes')
		    );
		}


		function handleEdgeClick(d, i, el) {
			// deselect all the selected elements
			var svg = d3.select("#actionGraphSvg");

			var highlight;
			if (instantiated) {
				highlight = INSTANCE_HIGHLIGHT_COLOR;
			} else {
				highlight = HIGHLIGHT_COLOR;
			}

			expandSideBar();

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

		    var semantics = null;
		    if (!instantiated) {
		    	semantics = <SemanticsBox id="semantics"
		       				 elementId={"dummy"}
		       				 elementType="edge"
		       				 editable={false}
		       				 eadonly={readonly}
		       				/>;
		    }

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
		       				onDataUpdate={updateEdgeAttrs(d, i)}/>,
		       	semantics
		       ],
		      document.getElementById('graphInfoBoxes')
		    );
		}

		function handleDragStarted(d_id) {
			if ((metaTyping[d_id] != "state") &&
				(metaTyping[d_id] != "bnd") && 
				(metaTyping[d_id] != "mod")) {
				return getAllComponents(
					graph, metaTyping, d_id).concat([d_id]);
			} else {
				return [d_id];
			}
		}

	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}


function hideAGLabels() {
	var button = document.getElementById("showLabelsButton");
	button.innerHTML = "Show labels";
	button.onclick = showAGLabels;
	hideLabels("actionGraphSvg");
}

function showAGLabels() {
	var button = document.getElementById("showLabelsButton");

	button.innerHTML = "Hide labels";
	button.onclick = hideAGLabels;
	displayLabels("actionGraphSvg");
}


function expandSideBar() {
	var sidebar = $('#agSidebarWrapper');

	if (!sidebar.hasClass('selected')) {
		sidebar.addClass('selected');
		sidebar.removeClass('collapsed');
		$('#agContentWrapper').addClass('collapsed');
	}
}

function toggleSideBar() {
	$('#agSidebarWrapper').toggleClass('collapsed');
    $('#agContentWrapper').toggleClass('collapsed');
}

$(document).ready(function() {
  var button = $('#collapseButton'); 
  button.on('click', toggleSideBar);
});
