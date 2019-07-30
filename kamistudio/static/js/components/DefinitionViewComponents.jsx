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
				<li className={item[0] === this.state.selected ? "selected" : "not-selected"}>
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
	        <li className="not-selected">
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
	                            active={this.state.selected === key}
	                            protoformGene={key}
	                            products={this.props.items[key].variants}
	                            onClick={this.onItemClick}
	                            onItemClick={this.state.subitemClick} />
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


function DefinitionGraphView(props) {
	var removeButton = null;

	if (props.removable) {
        removeButton = 
	        <div style={{"display": "inline-block", "float": "right"}}>
		        <button 
		           type="button" onClick={props.onRemove} disable={props.readonly}
		           className="btn btn-default btn-sm panel-button editable-box right-button">
		            <span className="glyphicon glyphicon-trash"></span>
		        </button>
		    </div>;
	}

	var boxes =
		<div id={props.svgId + "InfoBoxes"}>
        	<ElementInfoBox style={{"display": props.svgDisplay}} id={props.elementInfoBoxId} items={[]}/>
        	<MetaDataBox style={{"display": props.svgDisplay}} id={props.metaDataBoxId} items={[]}/>
        </div>;
    if (props.svgDisplay == "none") {
    	boxes = null;
    }

	return ([
		<h4 style={{"display": "inline-block"}}>{props.title}</h4>,
		removeButton,
		<svg id={props.svgId} style={{"display": props.svgDisplay}} preserveAspectRatio="xMinYMin meet"
    viewBox="0 0 300 300"></svg>,
        boxes
 	]);
}


class DefinitionPreview extends React.Component {

    constructor(props) {
        super(props);

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
            removeButton = null;
        if (this.props.loading) {
        	loader = 
	        	<div id="loadingBlock" className="loading-elements center-block">
	                <div id="loader"></div>
	             </div>;
        } else {
	        if (!this.props.id) {
	            message = <p style={{"margin-top": "20pt"}}>No definition selected</p>;
	        } else {

	            svgDisplay = "inline-block";
	           
	            protoform = 
	            	<DefinitionGraphView
	            		title="Protoform"
	            		svgId="protoformSvg"
	            		svgDisplay={svgDisplay}
	            		removable={false}
	            		readonly={this.props.readonly}
	            		elementInfoBoxId="protoformGraphElementInfo"
	            		metaDataBoxId="protoformGraphMetaModelInfo"/>;

	        	if (this.props.productId) {
	        		product =
	        			<DefinitionGraphView
	        				title="Product"
		            		svgId="productSvg"
		            		svgDisplay={svgDisplay}
		            		removable={true}
	            			readonly={this.props.readonly}
		            		onRemove={this.props.onRemove}
		            		elementInfoBoxId="productGraphElementInfo"
		            		metaDataBoxId="productGraphMetaModelInfo"/>;
		        } else {
		        	productMessage = <p>No product selected</p>;
		        	product = 
		        		<DefinitionGraphView
		            		svgId="productSvg"
		            		svgDisplay={"none"}
	            			readonly={this.props.readonly}
		            		elementInfoBoxId="productGraphElementInfo"
							metaDataBoxId="productGraphMetaModelInfo"/>;
		        }
		        var wt = this.props.wildType ? " (WT)" : "";
		        content = 
		        	<div className="row">
	                	<div className="col-md-6">
			                {protoform}
	                	</div>
	                	<div className="col-md-6">
			                {product}
			                {productMessage}
			            </div>
	                </div>;
	        }
	    }

        return([
        	<h3 className="editable-box" style={{"display": "inline"}}>Definition preview</h3>,
        	removeButton,
            <div id="definitionPreview">
            	{loader}
            	{message}
                {content}
                <div id="variantDeleteConfirmationDialog"></div>
            </div>
        ]);
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
			if (metaTyping[graph.nodes[i].id] == "residue") {
				// find edge to the gene with location
				for (var j = graph.links.length - 1; j >= 0; j--) {
					if ((graph.links[j].source == graph.nodes[i].id) &&
						(metaTyping[graph.links[j].target] == "gene")) {
						if ("loc" in graph.links[j].attrs) {
							var loc = graph.links[j].attrs["loc"].data[0];
							if (canonical_sequence) {
								graph.nodes[i].canonical_aa = canonical_sequence[loc - 1];
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
		newState.removedComponents.push([component.id, component.attrs, metaType]);
		this.setState(newState);
	}

	onSetAA(component, aa) {
		var newState = Object.assign({}, this.state);
		newState.selectedAA.push([component.id, component.attrs, aa]);
		this.setState(newState);
	}

	onSubmit(e) {
		console.log("On submit activated");
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
							<div className="col-md-6" style={{"overflow-x": "scroll"}}>
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