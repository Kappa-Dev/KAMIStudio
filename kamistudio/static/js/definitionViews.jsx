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

function drawDefinitionGraph(modelId, definitionId, graphId, graph, metaTyping, readonly) {   
   	var width = 200,
    	height = 200,
    	svgId = graphId + "Svg",
    	// agTyping = data["agTyping"],
    	nodeSizes = computeNodeSizes(
    		graph, metaTyping, NUGGET_META_SIZES, 0.5),
    	nodeColors = computeNodeColors(
			graph, metaTyping, META_COLORS),
		highlight = HIGHLIGHT_COLOR;

    initLinkStrengthDistance(graph, metaTyping, 1);
	initCircleRadius(graph, metaTyping, NUGGET_META_SIZES, 0.5);

	var simulationConf = {
		"charge_strength": -200,
		"collide_strength": 2.5,
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
	                        modelId, definitionId, graph, metaTyping, d, i)}/>],
	          document.getElementById(svgId + "InfoBoxes")
	      );
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
        handleDragStarted(graph, metaTyping),
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

function renderDefinitionList(modelId, definitionList, instantiated, readonly) {
    ReactDOM.render(
        <DefinitionList 
            items={JSON.parse(definitionList)}
            onItemClick={viewDefinition(modelId, readonly)}/>,
        document.getElementById('definitionView')
    );

    ReactDOM.render(
        <DefinitionPreview editable={false}/>,
        document.getElementById('definitionViewWidget')
    );
}