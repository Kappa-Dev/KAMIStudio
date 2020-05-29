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
		var items = this.props.products.map((item, key) =>
				<li className={item[0] === this.state.selected ? "subitem selected-subitem" : "subitem"}>
					<a onClick={() => this.onItemClick(item[0])} className="inner-selector">
						Variant {item[0]} {" " + (item[2] ? "(Wild type)" : "")} 
						<p style={{"display": "inline", "float": "right"}}>{item[1]}</p>
					</a>
				</li>
			),
			itemClass = this.props.active ? "selected" : "not-selected",
			display = this.props.active ? {"display": "initial"} : {"display": "none"},
			spanClass = this.props.active ? "glyphicon glyphicon-menu-down" : "glyphicon glyphicon-menu-right";
	    return (
	        <li className={this.props.active ? "selected" : "not-selected"}>
	          <a className="nugget-selector" style={{"padding-left": "10pt"}}
	             onClick={() => this.props.onClick(this.props.id, this.props.protoformGene, this.props.products)}>
	             <span className={spanClass}></span> Gene {this.props.label}<div className="nugget-desc"></div>
	          </a>
	          <ul className="inner-list-unstyled" style={display}>
	          	{items}
	          </ul>
	        </li>
	    );
	}
}


class DefinitionList extends React.Component {

    constructor(props) {
        super(props);

        this.onItemClick = this.onItemClick.bind(this);
        this.setSubitemClick = this.setSubitemClick.bind(this);

        this.state = {
            activeNoVariantsDialog: false,
            selected: null,
            subitemClick: null
        };
    }

    setSubitemClick(f) {
    	let state = Object.assign({}, this.state);
    	state["subitemClick"] = f;
    	this.setState(state);
    }

    selectItem(id) {
        var state = Object.assign({}, this.state);
        state.selected = id;
        this.setState(state);
    }

    onItemClick(id, protoformGene, products, close=true) {
    	if ((id === this.state.selected) && close) {
    		this.setState({
	    		selected: null,
	    		subitemClick: null
	    	});
    	} else {
    		var onSubitemClick = this.props.onItemClick(
	    		id, protoformGene, products, this.setSubitemClick);
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
	                            label={this.props.items[key].label}
	                            active={((this.state.selected === key) || (this.props.preselected === key))}
	                            protoformGene={key}
	                            products={this.props.items[key].variants}
	                            onClick={this.onItemClick}
	                            onItemClick={this.props.onSubitemClick} />
	                    </div>);
	    return ([
	        <div id="definitionListView">
	            <ul className="nav nuggets-nav list-group-striped list-unstyled components">
	                {content}
	            </ul>
	            <div id="definitionDialog" style={{"height": "100%", "width": "100%"}}></div>
	        </div>
	    ]);
	}
}


class DefinitionGraphView extends React.Component {

    constructor(props) {
        super(props);

        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.clearSvg = this.clearSvg.bind(this);
        this.draw = this.draw.bind(this);
    }

    clearSvg() {
        var svg = d3.select("#" + this.props.svgId);
        svg.selectAll("*").remove();
    }

    draw() {
        if (this.props.graph) {
            drawDefinitionGraph(
                this.props.corpusId,
                this.props.definitionId,
                this.props.graphId,
                JSON.parse(JSON.stringify(
                    this.props.graph)),
                this.props.metaTyping,
                this.props.readonly);
        }
    }

    componentDidMount() {
        this.clearSvg();
        this.draw();
    }

    componentDidUpdate() {
        if (this.props.refreshing) {
            this.clearSvg();
            this.draw();
        }
    }

    render() {
    	var removeButton = null;

    	if (this.props.removable) {
            removeButton = 
    	        <div style={{"display": "inline-block", "float": "right"}}>
    		        <button 
    		           type="button" onClick={this.props.onRemove}
    		           disabled={this.props.readonly}
    		           className="btn btn-default btn-sm panel-button editable-box right-button">
    		            <span className="glyphicon glyphicon-trash"></span>
    		        </button>
    		    </div>;
    	}

    	var boxes =
    		<div id={this.props.svgId + "InfoBoxes"}>
            	<ElementInfoBox style={{"display": this.props.svgDisplay}} id={this.props.elementInfoBoxId} items={[]}/>
            	<MetaDataBox style={{"display": this.props.svgDisplay}} id={this.props.metaDataBoxId} items={[]}/>
            </div>;
        if (this.props.svgDisplay == "none") {
        	boxes = null;
        }

        var content;
        if (this.props.loading) {
            content = (
                <div id="loadingBlock" className="loading-elements center-block">
                    <div id={this.props.instantiated ? "loaderModel" : "loader"}></div>
                 </div>
            );
        } else {
            content = [
                <div class="svg-wrapper">
                    <svg id={this.props.svgId} style={{"display": this.props.svgDisplay}} preserveAspectRatio="xMinYMin meet"
        viewBox="0 0 300 300"></svg>
                </div>,
                boxes
            ];
        }

    	return ([
            <div>
        	    <h4 style={{"display": "inline-block"}}>{this.props.title}</h4>
    		    {removeButton}
            </div>,
            content
     	]);
    };
}


class DefinitionPreview extends React.Component {

    constructor(props) {
        super(props);   

        this.state = {
            dialog: false
        };
        this.showConfirmDeletion = this.showConfirmDeletion.bind(this);
        this.hideDeleteConfirmationDialog = this.hideDeleteConfirmationDialog.bind(this);
        this.removeActiveVariant = this.removeActiveVariant.bind(this);
    }

    showConfirmDeletion() {
        var state = Object.assign({}, this.state);
        state.dialog = true;
        this.setState(state);
    }

    hideDeleteConfirmationDialog() {
        var state = Object.assign({}, this.state);
        state.dialog = false;
        this.setState(state);
    }

    removeActiveVariant() {
        this.hideDeleteConfirmationDialog();

        if (this.props.onRemoveVariant) {
            this.props.onRemoveVariant(this.props.definitionId, this.props.activeProduct);
        }
    }

    render() {
        var message = null,
        	loader = null,
            svgDisplay = "none",
            elementInfoBoxes = null,
            protoform = null,
            product = null,
            productMessage = null,
            content = null,
            dialog = null,
            removeButton = null;
        if (this.props.loading) {
        	loader = 
	        	<div id="loadingBlock" className="loading-elements center-block">
	                <div id="loader"></div>
	             </div>;
        } else {
	        if (!this.props.definitionId) {
	            message = <p style={{"margin-top": "20pt"}}>No definition selected</p>;
	        } else {

	            svgDisplay = "inline-block";
           
                if (this.props.protoformData) {
    	            protoform = 
    	            	<DefinitionGraphView
    	            		title="Protoform"
    	            		svgId="protoformSvg"
    	            		svgDisplay={svgDisplay}
    	            		removable={false}
    	            		readonly={this.props.readonly}
    	            		elementInfoBoxId="protoformGraphElementInfo"
    	            		metaDataBoxId="protoformGraphMetaModelInfo"
                            corpusId={this.props.corpusId}
                            definitionId={this.props.definitionId}
                            graph={this.props.protoformData["protoform_graph"]}
                            graphId="protoform"
                            metaTyping={this.props.protoformData["protoform_meta_typing"]}/>;
                }

	        	if (this.props.productData) {
                    if (this.state.dialog) {
                        var dContent = (
                            <div style={{"textAlign": "center"}}>
                                <h5>
                                    {"Are you sure you want to remove the variant?"}
                                </h5>

                                <div style={{"margin-top": "15pt"}}>
                                    <button 
                                       type="button" onClick={this.hideDeleteConfirmationDialog}
                                       className="btn btn-primary btn-sm panel-button editable-box right-button">
                                        Cancel
                                    </button>
                                    <button 
                                       type="button" onClick={this.removeActiveVariant}
                                       className="btn btn-default btn-sm panel-button editable-box right-button">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                        dialog = (
                            <Dialog content={dContent} 
                                title="Delete a variant"
                                customStyle={{"margin": "150pt auto", "width": "50%"}}
                                onRemove={this.hideDeleteConfirmationDialog}/>
                        );
                    }
                    product =
	        			<DefinitionGraphView
	        				title="Product"
		            		svgId="productSvg"
		            		svgDisplay={svgDisplay}
		            		removable={true}
	            			readonly={this.props.readonly}
		            		onRemove={this.showConfirmDeletion}
		            		elementInfoBoxId="productGraphElementInfo"
		            		metaDataBoxId="productGraphMetaModelInfo"
                            corpusId={this.props.corpusId}
                            definitionId={this.props.definitionId}
                            graph={this.props.productData["graph"]}
                            graphId="product"
                            refreshing={true}
                            metaTyping={this.props.productData["meta_typing"]}/>;
		        } else {
		        	product = <p>No product selected</p>;
		        }
		        var wt = this.props.wildType ? " (WT)" : "";
		        content = (
		        	<div className="row">
	                	<div className="col-md-6">
			                {protoform}
	                	</div>
	                	<div className="col-md-6">
			                {product}
			            </div>
	                </div>
                );
	        }
	    }

        return([
        	<h3 className="editable-box" style={{"display": "inline"}}>Definition preview</h3>,
        	removeButton,
            <div id="definitionPreview">
            	{loader}
            	{message}
                {content}
                <div id="variantDeleteConfirmationDialog">
                    {dialog}
                </div>
            </div>
        ]);
    }
}


class DefinitionView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeDefinition: null,
            activeDefinitionData: null,
            activeVariant: null
        }

        this.showDefinition = this.showDefinition.bind(this);
        this.showVariant = this.showVariant.bind(this);
    }

    showDefinition(definitionId, protoformGene, products) {
        var state = Object.assign({}, this.state);
        state.activeDefinition = definitionId;
        this.setState(state);
        getRawDefinition(
            this.props.corpusId, protoformGene,
            (data) => {
                var state = Object.assign({}, this.state);
                state.activeDefinitionData = data;
                if (this.state.activeVariant) {
                    var productData = generateProductGraph(
                        this.state.activeDefinitionData,
                        this.state.activeVariant);
                    state.activeVariantData = productData;
                }
                this.setState(state);
            });
    }

    showVariant(productName) {
        var state = Object.assign({}, this.state);
        state.activeVariant = productName;

        if (this.state.activeDefinitionData) {
            // generate a product graph
            var productData = generateProductGraph(
                this.state.activeDefinitionData,
                state.activeVariant);
            state.activeVariantData = {}
            state.activeVariantData["graph"] = productData[0];
            state.activeVariantData["meta_typing"] = productData[1];
        }

        this.setState(state);
    }

    render() {
        var preview = null,
            content = (
            <div className="progress-block">
                <div id="progressMessage" className="small-faded">Loading definitions...</div>
                    <div id="loadingBlock" className="loading-elements center-block" style={{"marginTop": "20pt"}}>
                        <div id="loader"></div>
                    </div> 
            </div>
        );

        if (this.props.definitions) {
            var backButton = null;
            content = (
                <DefinitionList 
                    items={this.props.definitions}
                    preselected={this.props.preselectedDefinition}
                    backButton={backButton}
                    onItemClick={this.showDefinition}
                    onSubitemClick={this.showVariant}/>
            );
            if (this.state.activeDefinition) {
                var wildType = false;
                if (this.state.activeDefinitionData) {
                    if (this.state.activeVariant == this.state.activeDefinitionData["wild_type"]) {
                        wildType = true;
                    }
                }
                preview = (
                    <DefinitionPreview
                        corpusId={this.props.corpusId}
                        definitionId={this.state.activeDefinition}
                        protoformData={this.state.activeDefinitionData}
                        activeProduct={this.state.activeVariant}
                        productData={this.state.activeVariantData}
                        readonly={this.props.readonly}
                        loading={(this.state.activeDefinitionData) ? false : true}
                        editable={false}
                        wildType={wildType}
                        onRemoveVariant={this.props.onRemoveVariant}
                        onDataUpdate={updateDefinitionDesc(this.props.corpusId, this.state.activeDefinition)}/>
                );
            } else {
                preview = (
                    <DefinitionPreview
                        corpusId={this.props.corpusId}
                        readonly={this.props.readonly} />
                );
            }
        }

        return [
            <div className="col-sm-6">
                <h3>Definitions</h3>
                <div id="definitionView">{content}</div>
            </div>,
            <div className="col-sm-6">
                <div id="definitionViewWidget">
                    {preview}
                </div>
            </div>
        ]
    }
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
    	this.showInteractiveProtoform();
    }

    showInteractiveProtoform() {
		var graph = JSON.parse(this.props.graphRepr),
			metaTyping = JSON.parse(this.props.metaTypingRepr),
			canonical_sequence = this.props.canonicalSequence;

		for (var i = graph.nodes.length - 1; i >= 0; i--) {
			var metaType = metaTyping[graph.nodes[i].id];
			if (metaType == "residue") {
				// find edge to the gene with location
				for (var j = graph.links.length - 1; j >= 0; j--) {
					if ((graph.links[j].source == graph.nodes[i].id) &&
						(metaTyping[graph.links[j].target] == "gene")) {
						if ("loc" in graph.links[j].attrs) {
							var loc = graph.links[j].attrs["loc"].data[0];
							if (canonical_sequence) {
								graph.nodes[i].canonical_aa = canonical_sequence[loc - 1];
								var newState = {...this.state};
								newState.selectedAA.push(
									[graph.nodes[i].id, graph.nodes[i].attrs, graph.nodes[i].canonical_aa]);
								this.setState(newState);
								// this.onSetAA(graph.nodes[i].id, graph.nodes[i].canonical_aa);
							}
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
		newState.removedComponents.push(
            [component.id, component.attrs, metaType]);
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
				<div className="col-md-8">
				    <div className="model-input-form-block">
    					<div className="row form-row">
						    <label for="default_mod_rate">Variant name</label>
						    <input type="text" className="form-control" name="variant_name"
						    	   placeholder=""
						    	   value={this.state.variant_name}
						    	   id="variant_name"
						    	   onChange={this.handleFieldChange("variant_name")}/>
						</div>
						<div className="row form-row">
						    <label for="default_mod_rate">Variant description</label>
						    <input type="text" className="form-control" name="desc"
						    	   placeholder=""
						    	   value={this.state.desc}
						    	   id="desc"
						    	   onChange={this.handleFieldChange("desc")}/>
						</div>
						<div className="row form-row">
							<input 
								onChange={(e) => this.handleSetWt(e)}
								type="checkbox" name="wt" value="wt" id="wtCheckBox"/> Set as a wild type<br/>
						</div>
						<div className="row form-row">
							<div className="col-md-6" style={{"overflow-x": "hidden"}}>
						      <svg id="protoformSvg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 300 300"></svg>
						    </div>
						    <div className="col-md-6">
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