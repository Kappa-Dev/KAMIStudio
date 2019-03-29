function DefinitionListItem(props) {
    return (
        <li className="not-selected">
          <a className="nugget-selector"
             onClick={() => props.onClick(props.id, props.desc, props.protoformGene, props.productNames)}>
             Gene {props.protoformGene}<div className="nugget-desc"><p>{props.desc}</p></div>
          </a>
        </li>
    );
}

function DefinitionList(props) {
    var content = Object.keys(props.items).map(
        (key, i) => <div id={"definitionListItem" + key}>
                        <DefinitionListItem
                            id={key}
                            desc={props.items[key][0]}
                            protoformGene={props.items[key][1]}
                            productNames={props.items[key][2]}
                            onClick={props.onItemClick} />
                    </div>);
    return ([
        <div id="definitionListView">
            <ul className="nav nuggets-nav list-group-striped list-unstyled components">
                {content}
            </ul>
        </div>
    ]);
}


function DefinitionGraphView(props) {
	return (
		<div className="row">
            <div class="col-md-6">
                <div style={{"text-align": "center"}}>
                	<svg id={props.svgId} style={{"display": props.svgDisplay}} width="200" height="200"></svg>
                </div>
            </div>
            <div id={props.svgId + "InfoBoxes"} class="col-md-6">
                <ElementInfoBox id={props.elementInfoBoxId} items={[]}/>
                <MetaDataBox id={props.metaDataBoxId} items={[]}/>
            </div>
       	</div>);
}

class DefinitionPreview extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        var message = null,
            fields,
            svgDisplay = "none",
            elementInfoBoxes = null,
            protoform = null,
            products = null;
        if (!this.props.id) {
            message = "No definition selected";
            fields = <EditableBox
                        id="definitionInfo"
                        name="Definition info"
                        data={{}}
                        editable={this.props.editable}
                        message={message}
                        items={[]}
                        noBorders={true}
                        protected={["id"]}
                        editable={true} />;
        } else {

            var items = [
                    ["id", "Definition ID", this.props.id],
                    ["desc", "Description", this.props.desc ? this.props.desc : <p className="faded">not specified</p>],
                    ["gene", "Gene", this.props.protoformGene],
                    ["products", "Products", this.props.productNames]
                ],
                data = {
                    "id": this.props.id,
                    "desc": this.props.desc,
                    "gene": this.props.protoformGene,
                    "products": this.props.productNames
                };
            fields = <EditableBox
                        id="definitionInfo"
                        name="Definition info"
                        data={data}
                        editable={this.props.editable}
                        items={items}
                        noBorders={true}
                        protected={["id"]}
                        editable={true}
                        onDataUpdate={this.props.onDataUpdate} />;
            svgDisplay = "inline-block";
           
            protoform = [
            	<h4>Protoform</h4>,
            	<DefinitionGraphView
            		svgId="protoformSvg"
            		svgDisplay={svgDisplay}
            		elementInfoBoxId="protoformGraphElementInfo"
            		metaDataBoxId="protoformGraphMetaModelInfo"/>
        	];
        	var productItems = 
	        	this.props.productNames.map(
	        		(item, key) =>
			        	<li className="not-selected">
				          <a className="nugget-selector"
				             onClick={() => this.props.onProductSelect(item, svgDisplay)}>{item}
				          </a>
				        </li>);

        	products = [
        		<h4>Products</h4>,
        		<div id="productListView">
		            <ul className="nav nuggets-nav list-group-striped list-unstyled components">
		                {productItems}
		            </ul>
		        </div>,
		        <div id="productView">
		        </div>
            ];
        }

        return(
            <div id="definitionPreview">
                {fields}
                {protoform}
                {products}
            </div>
        );
    }
}

function updateDefinitionDesc(modelId, definitionId) {
}

function updateProductNodeAttrs(modelId, definitionId, graph, metaTyping, d, i) {

}

function updateProductEdgeAttrs(modelId, definitionId, graph, metaTyping, d, i) {

}

function drawDefinitionGraph(modelId, definitionId, graphId, graph, metaTyping) {    
   	var width = 200,
    	height = 200,
    	svgId = graphId + "Svg",
    	// agTyping = data["agTyping"],
    	nodeSizes = computeNodeSizes(
    		graph, metaTyping, NUGGET_META_SIZES, 0.5),
    	nodeColors = computeNodeColors(
			graph, metaTyping, META_COLORS),
		highlight = HIGHLIGHT_COLOR;

    initLinkStrengthDistance(graph, metaTyping, 0.5);
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


function viewDefinition(modelId) {
	return function(definitionId, desc, protoformGene, productNames) {

		var url = "/corpus/" + modelId + "/raw-definition/" + definitionId;
		$.ajax({
		    url: url,
		    type: 'get',
		    dataType: "json"
		}).done(
			function (data) {

				function showProductPreview() {
					return function(productName, svgDisplay) {
						ReactDOM.render(
							<DefinitionGraphView
					    		svgId="productSvg"
					    		svgDisplay={svgDisplay}
					    		elementInfoBoxId="productGraphElementInfo"
					    		metaDataBoxId="productGraphMetaModelInfo"/>,
					    	document.getElementById("productView"));

						d3.select("#productSvg").selectAll("*").remove();

						drawDefinitionGraph(
							modelId,
							definitionId,
							"product",
							data["product_graphs"][productName],
							data["product_graphs_meta_typing"][productName]);
					}
				}

				ReactDOM.render(
			        <DefinitionPreview
			            id={definitionId}
			            desc={desc}
			            protoformGene={protoformGene}
			            productNames={productNames}
			            onDataUpdate={updateDefinitionDesc(modelId, definitionId)}
			            onProductSelect={showProductPreview()}/>,
			        document.getElementById('definitionViewWidget')
			    );

				d3.select("#protoformSvg").selectAll("*").remove();
    			d3.selectAll(".product-svg").selectAll("*").remove();
				// console.log(data);
				drawDefinitionGraph(
					modelId,
					definitionId,
					"protoform",
					data["protoform_graph"],
					data["protoform_graph_meta_typing"]);

			}
		).fail(function (e) {
		    console.log("Failed to load a definition");
		});
	}
}

function renderDefinitionList(modelId, definitionList) {
	
    ReactDOM.render(
        <DefinitionList 
            items={JSON.parse(definitionList)}
            onItemClick={viewDefinition(modelId)}/>,
        document.getElementById('definitionView')
    );

    ReactDOM.render(
        <DefinitionPreview />,
        document.getElementById('definitionViewWidget')
    );
}