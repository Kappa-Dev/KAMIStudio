
class ElementInfoBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var items = [];
		var message = "";
		if (this.props.elementType === "node") {
			if (!this.props.elementId) {
				message = "Click on an element to select";
			} else {
				var type;
				var suffix = "";
				if (this.props.instantiated) {
					if (this.props.metaType === "gene") {
						type = "protein";
						suffix += "-instance";
					} else {
						type = this.props.metaType;
					}
				} else {
					if (this.props.metaType === "gene") {
						type = "protoform";
					} else {
						type = this.props.metaType;
					}
				}
				items = [
					["id", "Node ID", this.props.elementId],
					["type", "Node Type", [<span className={"dot dot-" + this.props.metaType + suffix}></span>, " " + type]]
				];
			}
		} else {
			if ((!this.props.sourceId) || (!this.props.targetId)) {
				message = "Click on an element to select";
			} else {
				var sourceType,
					sourceSuffix = "",
					targetSuffix = "";
				if (this.props.instantiated) {
					if (this.props.sourceMetaType === "gene") {
						sourceType = "protein";
						sourceSuffix += "-instance";
					} else {
						sourceType = this.props.sourceMetaType;
					}
					var targetType;
					if (this.props.targetMetaType === "gene") {
						targetType = "protein";
						targetSuffix += "-instance";
					} else {
						targetType = this.props.targetMetaType;
					}
				} else {
					if (this.props.sourceMetaType === "gene") {
						sourceType = "protoform";
					} else {
						sourceType = this.props.sourceMetaType;
					}
					var targetType;
					if (this.props.targetMetaType === "gene") {
						targetType = "protoform";
					} else {
						targetType = this.props.targetMetaType;
					}
				}
				items = [
					["sourceId", "Source ID", this.props.sourceId],
					["sourceType", "Source Type",[<span className={"dot dot-" + this.props.sourceMetaType + sourceSuffix}></span>, " " + sourceType]],
					["targetId", "Target ID", this.props.targetId],
					["targetType", "Target Type", [<span className={"dot dot-" + this.props.targetMetaType + targetSuffix}></span>, " " + targetType]]
				];
			}
		}

		return (
			<EditableBox
				id="elementInfo"
				name="Element"
				items={items}
				message={message}
				onInfo={
					"Information on a graph element"
				}
				data={{}}
				expandable={true}
				expanded={true}
				instantiated={this.props.instantiated}
				editable={this.props.editable}/>
		);
	}
}


class MetaDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var items = [],
			data = {},
			message = "",
		    result = null;
		if (this.props.elementType === "node") {
			result = generateNodeMetaDataItems(
				this.props.elementId, this.props.metaType, this.props.attrs,
				this.props.instantiated);
		} else {
			result = generateEdgeMetaDataItems(
				this.props.sourceId, this.props.targetId,
				this.props.sourceMetaType, this.props.targetMetaType,
				this.props.attrs);
		}
		message = result[0];
		items = result[1];
		data = result[2];

		return (
			<EditableBox id="metaData"
						 name={this.props.name ? this.props.name : "Meta-data"}
						 items={items}
						 message={message}
						 readonly={this.props.readonly}
						 editable={this.props.editable}
						 protected={[]}
						 data={data}
						 onInfo={
							"Meta-data of an element"
						 }
						 expandable={true}
						 expanded={true}
						 onDataUpdate={this.props.onDataUpdate}
						 instantiated={this.props.instantiated}/>
		);
	}
}

function SemanticsBox(props) {
	var items = [],
		message = "",
		data = {};

	if (!props.elementId) {
		message = "Click on an element to select";
	} else {
		if (props.elementType === "node") {
			items = [[
				"semantics",
				"Semantics",
				props.semantics ? props.semantics.join(", ") : <p className="faded">not specified</p>
			]];
		} else {
			message = "Not available for this element";
		}
	}

	return (
		<EditableBox id="semanticData"
					 name="Semantics"
					 items={items}
					 message={message}
					 readonly={props.readonly}
					 editable={false}
					 protected={[]}
					 data={data}
					 onInfo={
						"Protein-protein interation semantic role of an element"
					 }
					 expandable={true}
					 expanded={false} />
	);
}

function NuggetSemanticBox(props) {
	var items = [],
		message = "",
		data = {};

	if (!props.elementId) {
		message = "Click on an element to select";
	} else {
		if (props.elementType === "node") {
			if (props.semantics) {
				for (var k in props.semantics) {
					items.push([
						k,
						k in PRETTY_SEMANTIC_NUGGET_NAMES ? PRETTY_SEMANTIC_NUGGET_NAMES[k] : k,
						props.semantics[k].map(
							(item) => item in PRETY_SEMANTIC_NAMES ? PRETY_SEMANTIC_NAMES[item] : item 
						).join(", ")
					])
				}
			} else {
				message = "No semantics specified";
				items = null;
			}
		} else {
			message = "Not available for this element";
		}
	}

	return (
		<EditableBox id="semanticData"
					 name="Semantics"
					 items={items}
					 message={message}
					 readonly={props.readonly}
					 editable={false}
					 protected={[]}
					 data={data}
					 onInfo={
						"Protein-protein interation semantic role of an element"
					 }
					 expandable={true}
					 expanded={false} />
	);
}



function ReferenceNodeList(props) {
	var listItems;
	if (props.items.length !== 0) {
	    listItems = props.items.map(
	    	(item) => 
	    		<li class="not-selected">
	    			<a onClick={() => props.onItemClick(item[0])}
	    			   style={{"padding-left": "5pt"}}>
		  				<div class="node-desc">{item[1]}</div>
		  				<div class="node-id">ID: {item[0]}</div>
	  				</a>
	    		</li>);
	} else {
	 	listItems = <p style={{"margin-left": "15px"}}>No reference candidates found</p>;
	}

    return (
        <ul className="nav nuggets-nav list-group-striped list-unstyled components">
            {listItems}
        </ul>
    );
}


class ReferenceSelectionDialog extends React.Component {
	
	constructor(props) {
		super(props);

		this.state = {
			candidates: null
		}

		this.onReferenceSelection = this.onReferenceSelection.bind(this);
	}

	componentWillMount() {
		if (this.props.onFetchItems) {
		    this.props.onFetchItems(this);
		}
	}

	onReferenceSelection(elementId) {
		if (elementId) {
			if (this.state.candidates) {
				this.props.onItemClick(
					elementId, this.state.candidates[elementId][1]);
			}
		} else {
			this.props.onItemClick(null, null);
		}
	}

	render() {
		var content = null, footer = null;
		if (this.state.candidates !== null) {
			content = [
				<FilteredList
					items={Object.keys(this.state.candidates).map(
						(key) => [key, this.state.candidates[key][0]]	
					)}
					waiting={true}
					onItemClick={this.onReferenceSelection}
					filterItems={this.props.filterItems}
					listComponent={ReferenceNodeList}
					itemFilter={
						(item, value) => item.join(", ").toLowerCase().search(
				    			value.toLowerCase()) !== -1
					}/>
			];
			footer = [<a type="button"
		                   onClick={() => this.onReferenceSelection(null)}
		                   id="selectNotIdentified" className="btn btn-default btn-md">
		                    No reference node
		              </a>,
		              <div class="info-tooltip">
							<span class="glyphicon glyphicon-question-sign"></span>
					  		<span class="tooltiptext">This will mark the reference node as 'Not identified' and create a new reference node in the action graph automatically</span>
					  </div>];
		} else {
			content = 
				<div id="loadingBlock"  className="loading-elements center-block">
					<p>Loading...</p>
					<div id="loader"></div>
				</div>;
		}

		return (
			<Dialog
				id={this.props.id}
				title={this.props.title}
				onRemove={this.props.onRemove}
				content={content}
				footerContent={footer}/>
		);
	}
}


class ReferenceElementBox extends React.Component {

	constructor(props) {
		super(props);
		
		this.onRemoveDialog = this.onRemoveDialog.bind(this);
		this.openSpecifyDialog = this.openSpecifyDialog.bind(this);
		this.onCandidateSelect = this.onCandidateSelect.bind(this);

		this.state = {
			activeDialog: false,
		}
	}

	openSpecifyDialog() {
		this.setState({
			activeDialog: true
		});
	}

	onRemoveDialog() {
		var state = Object.assign({}, this.state);
		state.activeDialog = false;
		this.setState(state);
	}

	onCandidateSelect(agElementId, attrs) {
		var state = Object.assign({}, this.state);
		state.activeDialog = false;
		state.nonDefaultAGElement = agElementId;
		state.nonDefaultAttrs = attrs;
		this.setState(state);
		if (this.props.onCandidateSelect) {
			this.props.onCandidateSelect(this.props.elementId, agElementId);
		}
	}

	render() {
		var message,
			items = [],
			data = {},
			editable = false,
			dialog = null,
			editableMetaTypes = [
				"region",
				"site",
				"residue",
				"bnd",
				"mod"
			];

		if (this.props.elementType) {
			if (this.props.elementType == "node") {
				var attrs = null, agElementId = null;
				if (this.state.nonDefaultAGElement) {
					attrs = this.state.nonDefaultAttrs;
					agElementId = this.state.nonDefaultAGElement;
				} else {
					if (this.props.agElementId) {
						attrs = this.props.attrs;
						agElementId = this.props.agElementId;
					}
				}
				if (attrs) {
					var result = generateNodeMetaDataItems(
							agElementId, this.props.metaType, attrs),
						message = result[0],
						items = result[1],
						data = result[2];
						editable = editableMetaTypes.includes(this.props.metaType);
				} else {
					message = "Not identified";
					editable = editableMetaTypes.includes(this.props.metaType);
				}
			} else {
				var attrs = null, 
					agSourceId = null,
					agTargetId = null;

				if (this.props.agSourceId && this.props.agTargetId) {
					attrs = this.props.attrs;
					agSourceId = this.props.agSourceId;
					agTargetId = this.props.agTargetId;
				}
				if (attrs) {
					var result = generateEdgeMetaDataItems(
							agSourceId, agSourceId,
							this.props.sourceMetaType,
							this.props.targetMetaType,
							attrs),
						message = result[0],
						items = result[1],
						data = result[2];
						editable = false;
				} else {
					message = "Not identified";
					editable = false;
				}
			}
		} else {
			message = "Click on an element to select";
		}

		var disable = false;

		if (this.state.activeDialog) {
			dialog = <ReferenceSelectionDialog
				id={this.props.id + "SelectionDialog"}
				title={"Select a reference node"}
				onRemove={this.onRemoveDialog} 
				onRemoveReference={this.onRemoveReference}
				onFetchItems={
					this.props.onFetchCandidates(
						this.props.elementId, this.props.metaType)}
				onItemClick={this.onCandidateSelect} />;
		};

		return ([
			<EditableBox id="agData"
						 name={"Identification"}
						 items={items}
						 message={message}
						 readonly={this.props.readonly}
						 editable={editable}
						 protected={[]}
						 data={data}
						 expandable={true}
						 expanded={false}
						 onInfo={
						 	"Identification by a reference element of the action graph"
						 }
						 editText={"Change"}
						 editAction={this.openSpecifyDialog}
						 instantiated={this.props.instantiated}
						 onDataUpdate={this.props.onDataUpdate}
						 instantiated={this.props.instantiated}/>,
			dialog
		]);
	}
}


