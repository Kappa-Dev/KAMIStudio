class DefinitionListItem extends React.Component {

	constructor(props) {
        super(props);

        this.state = {
        	selected: null
        };
        this.onItemClick = this.onItemClick.bind(this);
    }

    onItemClick(id) {
    	if (id === this.state.selected) {
    		this.setState({
	    		selected: null 
	    	});
    	} else {
	    	this.setState({
	    		selected: id 
	    	});
	    	this.props.onItemClick(id);
	    }
    }

    render() {
		var items = this.props.productNames.map((item, key) =>
				<li class={item === this.state.selected ? "selected" : "not-selected"}>
					<a onClick={() => this.onItemClick(item)} class="inner-selector">Variant {item}</a>
				</li>
			),
			itemClass = this.props.active ? "selected" : "not-selected",
			display = this.props.active ? {"display": "initial"} : {"display": "none"},
			spanClass = this.props.active ? "glyphicon glyphicon-menu-down" : "glyphicon glyphicon-menu-right";
	    return (
	        <li className="not-selected">
	          <a className="nugget-selector" style={{"padding-left": "10pt"}}
	             onClick={() => this.props.onClick(this.props.id, this.props.protoformGene, this.props.productNames)}>
	             <span class={spanClass}></span> Gene {this.props.protoformGene}<div className="nugget-desc"></div>
	          </a>
	          <ul class="inner-list-unstyled" style={display}>
	          	{items}
	          </ul>
	        </li>
	    );
	}
}


class DefinitionList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
        	selected: null,
        	subitemClick: null
        };
        this.onItemClick = this.onItemClick.bind(this);
        this.setSubitemClick = this.setSubitemClick.bind(this);
    }

    setSubitemClick(f) {
    	let state = Object.assign({}, this.state);
    	state["subitemClick"] = f;
    	this.setState(state);
    }

    onItemClick(id, protoformGene, productNames) {
    	if (id === this.state.selected) {
    		this.setState({
	    		selected: null,
	    		subitemClick: null
	    	});
    	} else {
    		var onSubitemClick = this.props.onItemClick(
	    		id, protoformGene, productNames, this.setSubitemClick);
	    	this.setState({
	    		selected: id
	    	});
	    	
	    }
    }

    render() {
	    var content = Object.keys(this.props.items).map(
	        (key, i) => <div id={"definitionListItem" + key}>
	                        <DefinitionListItem
	                            id={key}
	                            active={this.state.selected === key}
	                            protoformGene={this.props.items[key][0]}
	                            productNames={this.props.items[key][1]}
	                            onClick={this.onItemClick}
	                            onItemClick={this.state.subitemClick} />
	                    </div>);
	    return ([
	        <div id="definitionListView">
	            <ul className="nav nuggets-nav list-group-striped list-unstyled components">
	                {content}
	            </ul>
	        </div>
	    ]);
	}
}


function DefinitionGraphView(props) {
	return ([
		<svg id={props.svgId} style={{"display": props.svgDisplay}} width="200" height="200"></svg>,
        <div id={props.svgId + "InfoBoxes"}>
        	<ElementInfoBox style={{"display": props.svgDisplay}} id={props.elementInfoBoxId} items={[]}/>
        	<MetaDataBox style={{"display": props.svgDisplay}} id={props.metaDataBoxId} items={[]}/>
        </div>
 	]);
}


class DefinitionPreview extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        var message = null,
            svgDisplay = "none",
            elementInfoBoxes = null,
            protoform = null,
            product = null,
            productMessage = null, content = null;
        if (!this.props.id) {
            message = "No definition selected";
        } else {

            svgDisplay = "inline-block";
           
            protoform = 
            	<DefinitionGraphView
            		svgId="protoformSvg"
            		svgDisplay={svgDisplay}
            		elementInfoBoxId="protoformGraphElementInfo"
            		metaDataBoxId="protoformGraphMetaModelInfo"/>;

        	if (this.props.productId) {
        		product =
        			<DefinitionGraphView
	            		svgId="productSvg"
	            		svgDisplay={svgDisplay}
	            		elementInfoBoxId="productGraphElementInfo"
	            		metaDataBoxId="productGraphMetaModelInfo"/>;
	        } else {
	        	productMessage = "No product selected";
	        	product =
        			<DefinitionGraphView
	            		svgId="productSvg"
	            		svgDisplay={"none"}
	            		elementInfoBoxId="productGraphElementInfo"
	            		metaDataBoxId="productGraphMetaModelInfo"/>;
	        }
	        var wt = this.props.wildType ? " (WT)" : "";
	        content = 
	        	<div class="row">
                	<div class="col-md-6">
                		<h4>Protoform</h4>
		                {protoform}
                	</div>
                	<div class="col-md-6">
                		<h4>{"Product" + wt}</h4>
                		{productMessage}
		                {product}
		            </div>
                </div>;
        }

        return([
        	<h3 className="editable-box">Definition preview</h3>,
            <div id="definitionPreview">
            	{message}
                {content}
            </div>
        ]);
    }
}

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
			       			<span class="glyphicon glyphicon-minus"></span> Remove component
			       	</button>;
				if (metaTyping[d.id] == "residue") {
			    	if ("aa" in d.attrs) {
			    		var aa = d.attrs["aa"].data.concat(["test"]);
			    		var choices = aa.map(
			    			function(val) {
			    				var checked = false,
			    					suffix = "";
			    				if ((d.canonical_aa) && d.canonical_aa == val) {
			    					checked = true;
			    					suffix = " (Wild Type)";
			    				}
			    				return [
			    					<input onChange={() => onSetAA(d, val)}
			    						   type="radio"
			    						   name="aa"
			    						   value={val}
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
	                     editable={true}
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



function viewDefinition(modelId, readonly) {
	return function(definitionId, protoformGene, productNames, callback) {
		var url = "/corpus/" + modelId + "/raw-definition/" + definitionId;
		$.ajax({
		    url: url,
		    type: 'get',
		    dataType: "json"
		}).done(
			function(data) {
				function viewProduct(productName) {
					ReactDOM.render(
						 <DefinitionPreview
						 	wildType={productName == data["wild_type"]}
				            id={definitionId}
				            productId={productName}
				            protoformGene={protoformGene}
				            productNames={productNames}
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
			        	wildType={false}
			            id={definitionId}
			            protoformGene={protoformGene}
			            productNames={productNames}
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
    $.ajax({
        url: modelId + "/definitions",
        type: 'get',
        dataType: "json",
    }).done(function (data) {
        var definitionList = data["definitions"];
        console.log(definitionList);
        ReactDOM.render(
        <DefinitionList 
            items={definitionList}
            onItemClick={viewDefinition(modelId, readonly)}/>,
        document.getElementById('definitionView')
	    );

	    ReactDOM.render(
	        <DefinitionPreview editable={false}/>,
	        document.getElementById('definitionViewWidget')
	    );
    }).fail(function (e) {
        console.log("Failed to load nuggets");
    });
}


class VariantForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
        	variant_name: null,
        	desc: null,
        	removedComponents: [],
        	selectedAA: [],
        	wt: false
        }
    }

    componentDidMount() {
    	console.log("here", d3.select("#protoformSvg"));
    	this.showInteractiveProtoform();
    	 	// this,
    	 	// this.props.corpus_id,
    	 	// this.props.graphRepr,
    	 	// this.props.metaTypingRepr,
    	 	// this.props.canonicalSequence,
    	 	// this.props.readonly);
    }

    showInteractiveProtoform() {
		var graph = JSON.parse(this.props.graphRepr),
			metaTyping = JSON.parse(this.props.metaTypingRepr),
			canonical_sequence = this.props.canonicalSequence;

		for (var i = graph.nodes.length - 1; i >= 0; i--) {
			if (metaTyping[graph.nodes[i].id] == "residue") {
				// find edge to the gene with location
				for (var j = graph.links.length - 1; j >= 0; j--) {
					if ((graph.links[j].source == graph.nodes[i].id) &&
						(metaTyping[graph.links[j].target] == "gene")) {
						if ("loc" in graph.links[j].attrs) {
							var loc = graph.links[j].attrs["loc"].data[0];
							graph.nodes[i].canonical_aa = canonical_sequence[loc - 1];
						}
					}
				}
			}
		}

		drawDefinitionGraph(
			this.props.corpusId,
			null, 
			"protoform",
			graph, 
			metaTyping,
			this.props.readonly,
			true,
			(c, type) => this.onRemoveComponent(c, type),
			(c, aa) => this.onSetAA(c, aa));
	}

	onRemoveComponent(component, metaType) {
		var newState = Object.assign({}, this.state);
		newState.removedComponents.push([component.id, component.attrs, metaType]);
		this.setState(newState);
	}

	onSetAA(component, aa) {
		var newState = Object.assign({}, this.state);
		newState.selectedAA.push([component.id, component.attrs, aa]);
		this.setState(newState);
	}

	onSubmit(e) {
		e.preventDefault();
		if (!this.props.readonly) {
	        // get our form data out of state
	        const data = this.state;
	        const url = "/corpus/" + this.props.corpusId + "/add-variant/" + this.props.geneId;
	        $.ajax({
			    url: url,
			    type: 'post',
			    dataType: "json",
			    contentType: 'application/json',
			    data:  JSON.stringify(data),
			}).done(function (data) {
				window.location.href = data["redirect"];
			}).fail(function (e) {
			    console.log("Failed to create a variant");
			});
		}
	}

    handleFieldChange = (field) => (event, value, selectedKey) => {
		var val;
		if (event) {
			val = event.target.value;
		} else {
			val = value;
		}

		let newState = { ...this.state };
		newState[field] = val;
		this.setState(newState);
	}

	handleSetWt(e) {
		var newState = Object.assign({}, this.state);
		newState.wt = document.getElementById('wtCheckBox').checked;
		this.setState(newState);
	}

    render() {
    	return (
    		<form id="variantForm">
				<div class="col-md-8">
				    <div class="model-input-form-block">
    					<div class="row form-row">
						    <label for="default_mod_rate">Variant name</label>
						    <input type="text" class="form-control" name="variant_name"
						    	   placeholder=""
						    	   value={this.state.variant_name}
						    	   id="variant_name"
						    	   onChange={this.handleFieldChange("variant_name")}/>
						</div>
						<div class="row form-row">
						    <label for="default_mod_rate">Variant description</label>
						    <input type="text" class="form-control" name="desc"
						    	   placeholder=""
						    	   value={this.state.desc}
						    	   id="desc"
						    	   onChange={this.handleFieldChange("desc")}/>
						</div>
						<div class="row form-row">
							<input 
								onChange={(e) => this.handleSetWt(e)}
								type="checkbox" name="wt" value="wt" id="wtCheckBox"/> Set as a wild type<br/>
						</div>
						<div class="row form-row">
							<div class="col-md-6" style={{"overflow-x": "scroll"}}>
						      <svg id="protoformSvg" width="300" height="300"></svg>
						    </div>
						    <div class="col-md-6">
						      <div id="protoformSvgInfoBoxes"></div>
						    </div>
						</div>
						<div className="row form-row" style={{"text-align": "right"}}>
							<button className="btn btn-primary btn-lg" 
									name="importForm"
									disabled={this.props.readonly}
									onClick={(e) => this.onSubmit(e)}>
									<span className="glyphicon glyphicon-plus"></span> Add variant
							</button> 
						</div>
					</div>
				</div>
			</form>
    	);
    }
}