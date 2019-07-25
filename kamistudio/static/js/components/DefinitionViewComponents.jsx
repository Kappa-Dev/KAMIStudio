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

    onItemClick(id, protoformGene, products) {
    	if (id === this.state.selected) {
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
	        </div>
	    ]);
	}
}


function DefinitionGraphView(props) {
	return ([
		<svg id={props.svgId} style={{"display": props.svgDisplay}} preserveAspectRatio="xMinYMin meet"
    viewBox="0 0 300 300"></svg>,
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
		        	<div className="row">
	                	<div className="col-md-6">
	                		<h4>Protoform</h4>
			                {protoform}
	                	</div>
	                	<div className="col-md-6">
	                		<h4>{"Product" + wt}</h4>
	                		{productMessage}
			                {product}
			            </div>
	                </div>;
	          //   removeButton = 
	        		// <a href="#"
	        		//    type="button"
	        		//    className="btn btn-default btn-md panel-button" 
	        		//    disabled={this.props.readonly}>
	        		// 	<span class="glyphicon glyphicon-remove"></span> Delete
	        		// </a>;
	        }
	    }

        return([
        	<h3 className="editable-box" style={{"display": "inline"}}>Definition preview</h3>,
        	removeButton,
            <div id="definitionPreview">
            	{loader}
            	{message}
                {content}
            </div>
        ]);
    }
}