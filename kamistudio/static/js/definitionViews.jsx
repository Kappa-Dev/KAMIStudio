
function updateDefinitionDesc(modelId, definitionId) {
}

function updateProductNodeAttrs(modelId, definitionId, graph, metaTyping, d, i) {

}

function updateProductEdgeAttrs(modelId, definitionId, graph, metaTyping, d, i) {

}

function drawDefinitionGraph(modelId, definitionId, graphId, graph, metaTyping, 
							 readonly, modifiable=false,
							 onRemoveComponent=null,
							 onSetAA=null) {   
   	var width = 200,
    	height = 200,
    	svgId = graphId + "Svg",
    	// agTyping = data["agTyping"],
    	nodeSizes = computeNodeSizes(
    		graph, metaTyping, NUGGET_META_SIZES, 0.5),
    	nodeColors = computeNodeColors(
			graph, metaTyping, META_COLORS),
		highlight = HIGHLIGHT_COLOR;


    // initLinkStrengthDistance(graph, metaTyping, 1);
	initCircleRadius(graph, metaTyping, NUGGET_META_SIZES, 0.5);

	var simulationConf = {
		"charge_strength": -200,
		"distance": 35,
		"strength": 0.2,
		"collide_strength": 1,
		"y_strength": 0
	}

	function handleNodeClick(d, i, el) {
    	// deselect all the selected elements
	      var svg = d3.select("#" + svgId);

	      svg.selectAll(".arrow")
	        .style("stroke", d3.rgb("#B8B8B8"))
	        .attr("marker-end", "url(#" + svgId + "arrow)");
	      svg.selectAll("circle")
	        .attr("stroke-width", 0);
	      // select current element
	      d3.select(el)
	          .attr("stroke-width", 2)
	          .attr("stroke", d3.rgb(highlight));

	      var button = null,
	      	  residueSelector = [];
	      if (modifiable) {
		      if (metaTyping[d.id] != "gene") {
		      	button = <button 
						onClick={
							function(e) {
								e.preventDefault();
								removeComponent(d)
							}
						}
						className="btn btn-default btn-md panel-button add-interaction-button">
			       			<span className="glyphicon glyphicon-minus"></span> Remove component
			       	</button>;
				if (metaTyping[d.id] == "residue") {
			    	if ("aa" in d.attrs) {
			    		var aa = d.attrs["aa"].data;

			    		var choices = aa.map(
			    			function(val) {
			    				var checked = false,
			    					suffix = "";
			    				if (d.canonical_aa && d.canonical_aa == val) {
			    					checked = true;
			    					suffix = " (Wild Type)";
			    				}
			    				if (aa.length == 1) {
			    					checked = true;
			    				}
			    				return [
			    					<input onChange={() => onSetAA(d, val)}
			    						   type="radio"
			    						   name={"aa" + d.id}
			    						   value={"aa" + d.id + val}
			    						   defaultChecked={checked}/>,
			    					" " + val + suffix,
			    					<br/>
			    				];
			    			}
			    		);
			    		residueSelector = 
			    			<div>
			    				<h4>Select the key residue</h4>
			    				{choices}
			    			</div>;
			    	}
			    }
		      }
		  }

	      // call react func
	      ReactDOM.render(
	          [<ElementInfoBox id={graphId + "GraphElement"}
	                     elementId={d.id}
	                     elementType="node"
	                     metaType={metaTyping[d.id]}
	                     editable={false}/>,
                <MetaDataBox id={graphId + "MetaData"}
	                     elementId={d.id}
	                     elementType="node"
	                     metaType={metaTyping[d.id]}
	                     attrs={d.attrs}
	                     editable={false}
	                     readonly={readonly}
	                     onDataUpdate={updateProductNodeAttrs(
	                        modelId, definitionId, graph, metaTyping, d, i)}/>,
	            residueSelector, 
	            <br/>,
	            button],
	          document.getElementById(svgId + "InfoBoxes")
	      );

	      function removeComponent(d) {
	      	var componentId = d.id;
	      	var subcomponents = getAllComponents(graph, metaTyping, componentId);
	      	const target = (el) => el == componentId || subcomponents.includes(el);

	      	svg.selectAll(".node")
	      	   .filter((d) => target(d.id))
	      	   .remove();
	      	graph.nodes.filter(
	      		(d) => target(d.id));

	      	svg.selectAll(".link")
	      		.filter((d) => target(d.source.id) || target(d.target.id))
	      		.remove();
	      	graph.links.filter(
	      		(d) => target(d.source.id) || target(d.target.id));
	      	if (onRemoveComponent) {
		      	onRemoveComponent(d, metaTyping[componentId]);
		    }
	      }
	}

	function handleEdgeClick(d, i, el) {
		// deselect all the selected elements
	    var svg = d3.select("#" + svgId);

	    svg.selectAll("circle")
	      .attr("stroke-width", 0);
	    svg.selectAll(".arrow")
	      .style("stroke", d3.rgb("#B8B8B8"))
	      .attr("marker-end", "url(#" + svgId + "arrow)");
	    d3.select(el)
	      // .attr("stroke-width", 2)
	      .select(".arrow")
	      .style("stroke", d3.rgb(highlight))
	      .attr("marker-end", "url(#" + svgId + "arrow-selected)");

	    // call react func
	    ReactDOM.render(
	          [<ElementInfoBox id={graphId + "graphElement"}
	                   elementType="edge"
	                   sourceId={d.source.id}
	                   targetId={d.target.id}
	                   sourceMetaType={metaTyping[d.source.id]}
	                   targetMetaType={metaTyping[d.target.id]}
	                   editable={false} />,
	         	<MetaDataBox id={graphId + "metaData"}
	                sourceId={d.source.id}
	                targetId={d.target.id}
	                elementType="edge"
	                sourceMetaType={metaTyping[d.source.id]}
	                targetMetaType={metaTyping[d.target.id]}
	                attrs={d.attrs}
	                editable={true}
	                readonly={readonly}
	                onDataUpdate={updateProductEdgeAttrs(
	                    modelId, definitionId, graph, metaTyping, d, i)}/>
	          ],
	          document.getElementById(svgId + 'InfoBoxes'));
	};

	function handleDragStarted(d_id) {
      if ((metaTyping[d_id] != "state") &&
        (metaTyping[d_id] != "bnd") && 
        (metaTyping[d_id] != "mod")) {
        return getAllComponents(
          graph, metaTyping, d_id).concat([d_id]);
      } else {
        return [d_id];
      }
    };

	var clickHandlers =  {
        "nodeClick": handleNodeClick,
        "edgeClick": handleEdgeClick,
      }

	visualiseGraph(
		graph,
        svgId,
        nodeColors,
        nodeSizes,
        null,
        highlight,
        simulationConf,
        {},
        null,
        null,
        clickHandlers,
        handleDragStarted,
        100,
  		false);
}




function hideDeleteConfirmationDialog() {
    /* Hide delete nugget confirmation dialog */
    ReactDOM.render(
        null,
        document.getElementById("variantDeleteConfirmationDialog")
    );
}


function viewDefinition(modelId, readonly, allDefinitions) {
	return function(definitionId, protoformGene, products, callback) {

		function showDeleteConfirmationDialog(productName) {
		    /* Show delete nugget confirmation dialog */
			var content = <div style={{"textAlign": "center"}}>
		                    <h5>
		                        {"Are you sure you want to remove the variant?"}
		                    </h5>

		                    <div style={{"margin-top": "15pt"}}>
		                        <button 
		                           type="button" onClick={hideDeleteConfirmationDialog}
		                           className="btn btn-primary btn-sm panel-button editable-box right-button">
		                            Cancel
		                        </button>
		                        <button 
		                           type="button" onClick={() => removeVariant(productName)}
		                           className="btn btn-default btn-sm panel-button editable-box right-button">
		                            Delete
		                        </button>
		                    </div>
		                  </div>;
		    ReactDOM.render(
		        <Dialog content={content} 
		                title="Delete a nugget"
		                customStyle={{"margin": "150pt auto"}}
		                onRemove={hideDeleteConfirmationDialog}/>,
		        document.getElementById("variantDeleteConfirmationDialog")
		    );
		}


		function removeVariant(productName) {
			hideDeleteConfirmationDialog();

			// send a removal request
			getData(modelId + "/remove-variant/" + definitionId + "/" + productName);

			// update preview
			var indexToRemove = products.indexOf(productName);
			if (indexToRemove !== -1) products.splice(indexToRemove, 1);

			// update definition list
			var indexToRemove = -1;
			for (var i = allDefinitions[definitionId].variants.length - 1; i >= 0; i--) {
				if (allDefinitions[definitionId].variants[i][0] == productName) {
					indexToRemove = i;
					break;
				}
			}
			if (indexToRemove !== -1) allDefinitions[definitionId].variants.splice(indexToRemove, 1);

			renderDefinitionList(modelId, readonly)(allDefinitions);

			ReactDOM.render(
		        <DefinitionPreview
					readonly={readonly}
		        	wildType={false}
		            id={definitionId}
		            protoformGene={protoformGene}
		            productNames={products.map((item) => item[0])}
		            editable={false}
		            onDataUpdate={updateDefinitionDesc(modelId, definitionId)}/>,
		        document.getElementById('definitionViewWidget')
		    );
		}



		ReactDOM.render(
			<DefinitionPreview
				readonly={readonly}
			 	loading={true}/>,
			document.getElementById("definitionViewWidget"));

		var url = "/corpus/" + modelId + "/raw-definition/" + protoformGene;
		$.ajax({
		    url: url,
		    type: 'get',
		    dataType: "json"
		}).done(
			function(data) {
				function viewProduct(productName) {
					ReactDOM.render(
						 <DefinitionPreview
							readonly={readonly}
						 	wildType={productName == data["wild_type"]}
				            id={definitionId}
				            productId={productName}
				            onRemove={() => showDeleteConfirmationDialog(productName)}
				            protoformGene={protoformGene}
				            productNames={products.map((item) => item[0])}
				            editable={false}
				            onDataUpdate={updateDefinitionDesc(modelId, definitionId)}/>,
				    	document.getElementById("definitionViewWidget"));

					d3.select("#productSvg").selectAll("*").remove();
					drawDefinitionGraph(
						modelId,
						definitionId,
						"product",
						data["product_graphs"][productName],
						data["product_graphs_meta_typing"][productName],
						readonly);
				}

				ReactDOM.render(
			        <DefinitionPreview
						readonly={readonly}
			        	wildType={false}
			            id={definitionId}
			            protoformGene={protoformGene}
			            productNames={products.map((item) => item[0])}
			            editable={false}
			            onDataUpdate={updateDefinitionDesc(modelId, definitionId)}/>,
			        document.getElementById('definitionViewWidget')
			    );
				callback(viewProduct);

				d3.select("#protoformSvg").selectAll("*").remove();
    			d3.selectAll(".product-svg").selectAll("*").remove();
				// console.log(data);
				drawDefinitionGraph(
					modelId,
					definitionId,
					"protoform",
					data["protoform_graph"],
					data["protoform_graph_meta_typing"],
					readonly);
			}
		).fail(function (e) {
		    console.log("Failed to load a definition");
		});
	}
}

function renderDefinitionList(modelId, readonly) {
	// fetch definitions list from the server 
   return function (data) {
    	var labels;
    	for (var k in data) {
    		labels = [data[k].attrs["uniprotid"].data[0]];
    		if ("hgnc_symbol" in data[k].attrs) {
				labels.push(data[k].attrs["hgnc_symbol"].data[0]);
			} 
			if ("synonyms" in data[k].attrs) {
				labels += (data[k].attrs["synonyms"].data);
			}
			data[k].label = labels.join(" / ");
    	}

        ReactDOM.render(
	        <DefinitionList 
	            items={data}
	            onItemClick={viewDefinition(modelId, readonly, data)}/>,
	        document.getElementById('definitionView'));

	    ReactDOM.render(
	        <DefinitionPreview editable={false}/>,
	        document.getElementById('definitionViewWidget')
	    );
    };
}
