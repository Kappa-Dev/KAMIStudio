function singleValueToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = (attr_name in data) ? data[attr_name].data[0] : 
		<p className="faded">not specified</p>;
	return value;
};

function multipleValuesToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = (attr_name in data) ? value = data[attr_name].data.join(", ") : 
		<p className="faded">not specified</p>;
	return value;
};

function getSingleValue(data, attr_name) {
	return attr_name in data ? data[attr_name].data[0] : null;
};

function getMultipleValues(data, attr_name) {
	return attr_name in data ? data[attr_name].data : null;
};

function boolRepresentation(flag) {
	if (typeof flag === "string") {
		var els = flag.split(", "),
			newEls = [];
		for (var i = els.length - 1; i >= 0; i--) {
			if (els[i] === "true") {
				newEls.push("+");
			} else {
				newEls.push("-");
			}
		}
		return newEls.join(", ");
	} else {
		return flag ? "+" : "-";
	}
}


class EditableBox extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			expanded: props.expanded,
			editing: false,
			updatedData: {}
		};
		this.handleEditClick = this.handleEditClick.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleCancelClick = this.handleCancelClick.bind(this);
		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.handleCollapse = this.handleCollapse.bind(this);
	}

	handleEditClick() {
		let newState = { ...this.state };
		newState.editing = true;
		this.setState(newState);
	}

	handleSaveClick() {
		if (Object.keys(this.state.updatedData).length > 0) {
			for (var k in this.state.updatedData) {
				this.props.data[k] = this.state.updatedData[k];
			}
			this.props.onDataUpdate(this.state.updatedData, this.props.data);
		}
		this.handleCancelClick();
	}

	handleCancelClick() {
		let newState = { ...this.state };
		newState.editing = false;
		newState.updatedData = {};
		this.setState(newState);
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		var val;
		if (event) {
			val = event.target.value;
		} else {
			val = value;
		}

		let newState = { ...this.state };
		newState.updatedData[field] = val;
		this.setState(newState);
	}

	handleCollapse() {
		let newState = { ...this.state };
		newState.expanded = !newState.expanded;
		this.setState(newState);
	}

	render() {
		var content = null;
		if (this.state.expanded) {
			if (this.props.items.length > 0) {
				if (this.state.editing) {

					var items = this.props.items.map(
						(item, key) =>
						    !this.props.protected.includes(item[0]) ?
							    <tr key={key}>
								  	<th scope="row">{item[1]}</th>
								  	<td>
								  		<input type="text"
							          		   className="form-control"
							          		   name={item[1]}
							          		   id={item[0]}
							          		   onChange={this.handleFieldChange(item[0])}
							          		   value={item[0] in this.state.updatedData ? this.state.updatedData[item[0]] : this.props.data[item[0]]} />
							          	</td>
								</tr>
								:
								<tr key={key}>
								  	<th scope="row">{item[1]}</th>
								  	<td>{item[2]}</td>
								</tr>
					);
				} else {
					var items = this.props.items.map((item, key) =>
					    <tr key={key}>
						  	<th scope="row">{item[1]}</th>
						  	<td>{item[2]}</td>
						</tr>
					);
				}
				var borderFlag = "";
				if (this.props.noBorders) {
					borderFlag = " no-borders";
				}

				content =
					<div className="table-responsive">
						<table className={"table table info-table" + borderFlag}>
							<tbody>
								{items}
							</tbody>
						</table>
					</div>;
			} else {
				content = 
					<p id={this.props.id + "noSelectedElements"}>
						{this.props.message}
					</p>;
			}
		}

		var topButton = null;
		if (this.state.expanded) {
			if (this.props.items.length > 0) {
				if ((this.props.editable) && (!this.state.editing)) {
					var disable = false;
					if (this.props.readonly) {
						disable = true;
					}
					topButton = 
						<div className="col-md-4">
							<div style={{"float": "right"}}>
								<button 
								   type="button" onClick={this.handleEditClick}
								   className="btn btn-default btn-sm panel-button editable-box right-button" disabled={disable}>
								   	<span className="glyphicon glyphicon-pencil"></span> Edit
								</button>
							</div>
						</div>;
				}
			}
		}

		var cancelButton = null;
		var saveButton = null;
		if (this.state.editing) {
			cancelButton = <button 
				   type="button" onClick={this.handleCancelClick}
				   className="btn btn-default btn-sm panel-button editable-box right-button">
				   Cancel
				</button>;
			saveButton = 
				<button 
				   type="button" onClick={() => this.handleSaveClick()}
				   className="btn btn-primary btn-sm panel-button editable-box right-button">
				   Save
				</button>;
		}

		var title;
		if (this.props.expandable) {
			var suffix = "";
			if (this.props.instantiated) {
				suffix = " instantiation-link";
			}
			if (this.state.expanded) {
				title = 
					<a className="info-box-title" onClick={this.handleCollapse}>
						<h3 className={"editable-box" + suffix}>
							<span className="glyphicon glyphicon-menu-down"></span> {this.props.name}
						</h3>
					</a>;
				
			} else {
				title =
					<a className="info-box-title" onClick={this.handleCollapse}>
						<h3 className={"editable-box" + suffix}>
							<span className="glyphicon glyphicon-menu-right"></span> {this.props.name}
						</h3>
					</a>;
			}
		} else {
			title = <h3 className="editable-box">{this.props.name}</h3>;
		}

		return ([
			<div className="row">
				<div className={"col-md-" + (topButton ? "8" : "12")}>
					{title}
				</div>
				{topButton}
			</div>,
            <div id={this.props.id}>
            	{content}
            </div>,
            <div className="row">
				<div className="col-md-12">
					<div style={{"float": "right"}}>
						{[cancelButton, saveButton]}
					</div>
				</div>
			</div>,
        ]);
	}
}


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
				data={{}}
				expandable={true}
				expanded={true}
				instantiated={this.props.instantiated}
				editable={this.props.editable}/>
		);
	}
}


function generateNodeMetaDataItems(elementId, metaType, attrs) {
	var message = "",
		items = [],
		data = {};

	if (!elementId) {
		message = "Click on an element to select";
	} else {
		if (metaType === "gene") {

			var uniprot = singleValueToString(attrs, "uniprotid"),
				hgnc = singleValueToString(attrs, "hgnc_symbol"),
				synonyms = multipleValuesToString(attrs, "synonyms");
			items = [
				[
					"uniprotid",
					"UniProt AC",
					<a href={"https://www.uniprot.org/uniprot/" + uniprot}>
						{uniprot}
					</a>
				],
				["hgnc_symbol", "HGNC Symbol", hgnc],
				["synonyms", "Synonyms", synonyms]
			];
			data["uniprotid"] = getSingleValue(attrs, "uniprotid");
			data["hgnc_symbol"] = getSingleValue(attrs, "hgnc_symbol");
			data["synonyms"] = getMultipleValues(attrs, "synonyms");

		} else if ((metaType === "region") || (metaType === "site")) {
			var name = singleValueToString(attrs, "name"),
				interproValue = singleValueToString(attrs, "interproid");

			var interpro;
			if (interproValue[0] != "I") {
				interpro = interproValue;
			} else {
				interpro =
					<a href={"http://www.ebi.ac.uk/interpro/entry/" + interproValue}>
						{interproValue}
					</a> 
			}

			items = [
				["name", "Name", name],
				["interproid", "InterPro ID", interpro]
			];
			data["interproid"] = getSingleValue(attrs, "interproid");
			data["name"] = getSingleValue(attrs, "name");
		} else if (metaType === "residue") {
			var aa = multipleValuesToString(attrs, "aa"),
				test = singleValueToString(attrs, "test");
			items = [
				["aa", "Amino Acid", aa],
				["test", "Test", boolRepresentation(test)]
			];
			data["aa"] = getMultipleValues(attrs, "aa");
			data["test"] = getSingleValue(attrs, "test");
		} else if (metaType === "state") {
			var name = singleValueToString(attrs, "name"),
				test = singleValueToString(attrs, "test");
			items = [
				["name", "Name", name],
				["test", "Test", boolRepresentation(test)]
			];
			data["name"] = getSingleValue(attrs, "name");
			data["test"] = getSingleValue(attrs, "test");
		} else if (metaType === "mod") {
			var value = singleValueToString(attrs, "value"),
				rate = singleValueToString(attrs, "rate");
			items = [
				["value", "Value", boolRepresentation(value)],
				["rate", "Rate", rate],
			];
			data["value"] = getSingleValue(attrs, "value");
			data["rate"] = getSingleValue(attrs, "rate");
		} else if (metaType === "bnd") {
			var rate = singleValueToString(attrs, "rate"),
				test = multipleValuesToString(attrs, "test"),
				type = multipleValuesToString(attrs, "type");
			items = [
				["rate", "Rate", rate],
				["test", "Test", boolRepresentation(test)],
				["type", "Type", type]
			];
			data["rate"] = getSingleValue(attrs, "rate"),
			data["test"] = getMultipleValues(attrs, "test");
			data["type"] = getMultipleValues(attrs, "type");
		} else {
			message = "No meta-data available";
		}
	}
	return [message, items, data];
}

function generateEdgeMetaDataItems(sourceId, targetId,
								   sourceMetaType, targetMetaType, attrs) {
	var message = "",
		items = [],
		data = {};
	if ((!sourceId) || (!targetId)) {
		message = "Click on an element to select";
	} else {
		//  region/gene, site/gene, site/region
		if (((sourceMetaType === "region") && (targetMetaType === "gene")) ||
			((sourceMetaType === "site") && (targetMetaType === "gene")) ||
			((sourceMetaType === "site") && (targetMetaType === "region"))) {
			var start = singleValueToString(attrs, "start"),
				end = singleValueToString(attrs, "end"),
				order = singleValueToString(attrs, "order");
			items = [
				["start", "Start", start],
				["end", "End", end],
				["order", "Order", order]
			];
			data["start"] = getSingleValue(attrs, "start");
			data["end"] = getSingleValue(attrs, "end");
			data["order"] = getSingleValue(attrs, "order");
		} else if (sourceMetaType === "residue")  {
			var loc = singleValueToString(attrs, "loc");
			items = [
				["loc", "Location", loc]
			];
			data["loc"] = getSingleValue(attrs, "loc");
		} else {
			message = "Not available for this element"
		}
	}
	return [message, items, data];
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
				this.props.elementId, this.props.metaType, this.props.attrs);
			
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
					 expandable={true}
					 expanded={false} />
	);
}

function AGElementBox(props) {
	console.log(props.agElementId, props.elementType);
	if (props.elementType == "node") {
		var result = generateNodeMetaDataItems(
				props.agElementId, props.metaType, props.attrs),
			message = result[0],
			items = result[1],
			data = result[2];
	} else {
		message = "Not available for this element";
		items = [];
		data = {};
	}

	return (
		<EditableBox id="agData"
					 name={"Identification"}
					 items={items}
					 message={message}
					 readonly={props.readonly}
					 editable={false}
					 protected={[]}
					 data={data}
					 expandable={true}
					 expanded={false}
					 instantiated={props.instantiated}
					 onDataUpdate={props.onDataUpdate}
					 instantiated={props.instantiated}/>
	);
}


// function NuggetsBox(props) {
// 	var items = [],
// 		message = "",
// 		data = {};

// 	if (!props.elementId) {
// 		message = "Click on an element to select";
// 	} else {
// 		if (props.elementType === "node") {
// 			items = [[
// 				"semantics",
// 				"Semantics",
// 				props.semantics ? props.semantics.join(", ") : <p className="faded">not specified</p>
// 			]];
// 		} else {
// 			message = "Not available for this element";
// 		}
// 	}

// 	return (
// 		<EditableBox id="nuggetData"
// 					 name="Associated nuggets"
// 					 items={items}
// 					 message={message}
// 					 readonly={props.readonly}
// 					 editable={false}
// 					 protected={[]}
// 					 data={data}
// 					 expandable={true}
// 					 expanded={false} />
// 	);
// }


function RateDataBox(props) {
	var rateItems = [
		["default_bnd_rate", "Binding rate", props.default_bnd_rate ? props.default_bnd_rate : <p className="faded">not specified</p>],
		["default_brk_rate", "Unbinding rate", props.default_brk_rate ? props.default_brk_rate : <p className="faded">not specified</p>],
		["default_mod_rate", "Modification rate", props.default_mod_rate ? props.default_mod_rate : <p className="faded">not specified</p>]
	];

	var rateData = {
		default_bnd_rate: props.default_bnd_rate,
		default_brk_rate: props.default_brk_rate,
		default_mod_rate: props.default_mod_rate, 
	};
	return (
		<EditableBox id={props.id}
			 name="Default interaction rates"
			 items={rateItems}
			 editable={true}
			 expandable={false}
			 expanded={true}
			 readonly={props.readonly}
			 onDataUpdate={props.onDataUpdate}
			 data={rateData}
			 noBorders={true}
			 protected={[]}
			 instantiated={props.instantiated} />
	)
}


class KBMetaDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var items = [
			["name", "Name", this.props.kbName ? this.props.kbName : <p className="faded">not specified</p>],
			["desc", "Desciption", this.props.desc ? this.props.desc : <p className="faded">not specified</p>],
			["organism", "Organism", this.props.organism ? this.props.organism : <p className="faded">not specified</p>],
			["creation_time", "Created", this.props.creation_time],
			["last_modified", "Last modified", this.props.last_modified]
		];
		var data = {
			"name": this.props.kbName,
			"desc": this.props.desc,
			"organism": this.props.organism,
			"creation_time": this.props.creation_time,
			"last_modified": this.props.last_modified
		}

		return (
			<EditableBox id={this.props.id}
						 name={this.props.name}
						 items={items}
						 editable={this.props.editable}
						 readonly={this.props.readonly}
						 onDataUpdate={this.props.onDataUpdate}
						 data={data}
						 noBorders={true}
						 expandable={false}
						 expanded={true}
						 protected={this.props.protected}
						 instantiated={this.props.instantiated}
						 onDataUpdate={this.props.onDataUpdate}/>);
	}
}

class DropDownRow extends React.Component {
	constructor(props) {
		super(props);
	}



	render() {
		var content = null;
		if (typeof this.props.items !== 'undefined') {
			// <span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span>
			content =
				<tr>{" " + this.props.name + " (" + Object.keys(this.props.items).length + ")"}</tr>;
		}
		return (content);
	}
}

class InteractionsDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var geneItems = this.props.genes ? JSON.parse(this.props.genes) : undefined,
			proteinItems = this.props.proteins ? JSON.parse(this.props.proteins) : undefined,
			modItems = this.props.modifications ? JSON.parse(this.props.modifications) : undefined,
			bndItems = this.props.bindings ? JSON.parse(this.props.bindings): undefined;
		
		return ([
			<h3 className="info-brand">Interactions</h3>,
    		<div className="table-responsive">
      			<table className="table info">
       				<tbody>
       					<DropDownRow name="Genes" items={geneItems}/>
       					<DropDownRow name="Proteins" items={proteinItems}/>
			          	<DropDownRow name="Modification mechanisms" items={modItems}/>
			          	<DropDownRow name="Bindings mechanisms" items={bndItems}/>
			        </tbody>
			    </table> 
			</div>
		]);
	}
}


class ModelDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var originCorpus;
		if (this.props.corpusId) {
			originCorpus = 
				<b>
					<a className="instantiation-link" href={this.props.corpusUrl}>
						{this.props.corpusName}
					</a>
				</b>;
		} else {
		    originCorpus = <p>No corpus associated</p>;
		}

		var seedGenes = this.props.seedGenes ? JSON.parse(this.props.seedGenes) : {},
			definitions = this.props.definitions ? JSON.parse(this.props.definitions) : {};
		
		return ([
			<div id="modelMetaData">
				<KBMetaDataBox
					id="modelMetaData"
					name="Meta-data"
					editable={true}
					readonly={this.props.readonly}
					kbName={this.props.kbName}
					desc={this.props.desc}
					organism={this.props.organism}
					creation_time={this.props.creation_time}
					last_modified={this.props.last_modified}
					protected={["creation_time", "last_modified"]}
					instantiated={true}
					onDataUpdate={this.props.onDataUpdate}/>
			</div>,
			<hr className="sidebar-corpus-sep"/>,
			<h3 className="info-brand">Origin</h3>,
		    <div className="table-responsive">
		      <table className="table table info-table no-borders">
		        <tbody>
		          <tr>
		            <th scope="row">Corpus </th>
		            <td>
		              {originCorpus}
		            </td>
		          </tr>
		         {/* <DropDownRow name="Seed genes" items={seedGenes} />
		          <DropDownRow name="Definitions" items={definitions} />*/}
		        </tbody>
		      </table> 
    		</div>,
    		<hr className="sidebar-corpus-sep"/>,
   			<InteractionsDataBox
   				proteins={this.props.proteins}
   				modifications={this.props.modifications}
   				bindings={this.props.bindings}/>,
   			<hr className="sidebar-corpus-sep"/>,
			<div id="modelRateData">
				<RateDataBox
					id="modeRateDataBox"
					default_bnd_rate={this.props.default_bnd_rate}
					default_brk_rate={this.props.default_brk_rate}
					default_mod_rate={this.props.default_mod_rate}
					readonly={this.props.readonly}
					onDataUpdate={this.props.onRateDataUpdate}
					instantiated={true}/>
			</div>
		]);
				
	}
}

class CorpusDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		console.log(this.props.readonly);
		var genes, modifications, bindings;
		genes = 
			<th scope="row">
				<span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Genes ({ this.props.nGenes })
			</th>;
		modifications = <th scope="row"><span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Modifications ({ this.props.nModifications })</th>;
		bindings = <th scope="row"><span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Bindings ({ this.props.nBindings })</th>;
		return([
			<div id="modelMetaData">
				<KBMetaDataBox
					id="corpusMetaData"
					name="Meta-data"
					editable={true}
					readonly={this.props.readonly}
					kbName={this.props.kbName}
					desc={this.props.desc}
					organism={this.props.organism}
					creation_time={this.props.creation_time}
					last_modified={this.props.last_modified}
					protected={["creation_time", "last_modified"]}
					onDataUpdate={this.props.onDataUpdate}/>
			</div>,
			<hr className="sidebar-corpus-sep"/>,
   			<InteractionsDataBox
   				genes={this.props.genes}
   				modifications={this.props.modifications}
   				bindings={this.props.bindings}/>
		]);
	}
}