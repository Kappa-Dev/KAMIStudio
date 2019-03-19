function singleValueToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = "";
	if (attr_name in data) {
		value = data[attr_name].data[0];
	} else {
		value = <p className="faded">not specified</p>;
	}

	return value;
}

function getSingleValue(data, attr_name) {
	return attr_name in data ? data[attr_name].data[0] : null;
}

class EditableBox extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			editing: false,
			updatedData: {}
		};
		this.handleEditClick = this.handleEditClick.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleCancelClick = this.handleCancelClick.bind(this);
		this.handleFieldChange = this.handleFieldChange.bind(this);
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
			this.props.onDataUpdate(this.state.updatedData);
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

	render() {
		var content;
		if (this.props.items.length > 0) {
			if (this.state.editing) {
				var items = this.props.items.map((item, key) =>
				    <tr>
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
				);
			} else {
				var items = this.props.items.map((item, key) =>
				    <tr>
					  	<th scope="row">{item[1]}</th>
					  	<td>{item[2]}</td>
					</tr>
				);
			}
			content =
				<table className="table table-hover info-table">
					<tbody>
						{items}
					</tbody>
				</table>;
		} else {
			content = 
				<p id={this.props.id + "noSelectedElements"}>
					{this.props.message}
				</p>;
		}

		var topButton = null;
		if ((this.props.editable) && (this.props.items.length > 0)) {
			if (!this.state.editing) {
				topButton = 
					<button 
					   type="button" onClick={this.handleEditClick}
					   className="btn btn-default btn-sm panel-button editable-box right-button">
					   	<span class="glyphicon glyphicon-pencil"></span> Edit
					</button>;
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

		return ([
			<div className="row">
				<div className="col-md-7">
					<h3 class="editable-box">{this.props.name}</h3>
				</div>
				<div className="col-md-5">
					<div style={{"float": "right"}}>
						{topButton}
					</div>
				</div>
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
				if (this.props.metaType === "gene") {
					type = "protoform";
				} else {
					type = this.props.metaType;
				}
				items = [
					["id", "Node ID", this.props.elementId],
					["type", "Node Type", [<span className={"dot dot-" + this.props.metaType}></span>, " " + type]]
				];
			}
		} else {
			if ((!this.props.sourceId) || (!this.props.targetId)) {
				message = "Click on an element to select";
			} else {
				var sourceType;
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
				items = [
					["sourceId", "Source ID", this.props.sourceId],
					["sourceType", "Source Type",[<span className={"dot dot-" + this.props.sourceMetaType}></span>, " " + sourceType]],
					["targetId", "Target ID", this.props.targetId],
					["targetType", "Target Type", [<span className={"dot dot-" + this.props.targetMetaType}></span>, " " + targetType]]
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
				editable={this.props.editable}/>
		);
	}
}


class MetaDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var items = [];
		var data = {};
		var message = "";
		if (this.props.elementType === "node") {
			if (!this.props.elementId) {
				message = "Click on an element to select";
			} else {
				if (this.props.metaType === "gene") {

					var uniprot = singleValueToString(this.props.attrs, "uniprotid"),
						hgnc = singleValueToString(this.props.attrs, "hgnc_symbol"),
						synonyms = singleValueToString(this.props.attrs, "synonyms");
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
					data["uniprotid"] = getSingleValue(this.props.attrs, "uniprotid");
					data["hgnc_symbol"] = getSingleValue(this.props.attrs, "hgnc_symbol");
					data["synonyms"] = getSingleValue(this.props.attrs, "synonyms");

				} else if ((this.props.metaType === "region") || (this.props.metaType === "site")) {
					var name = singleValueToString(this.props.attrs, "name"),
						interproValue = singleValueToString(this.props.attrs, "interproid");

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
					data["interproid"] = getSingleValue(this.props.attrs, "interproid");
					data["name"] = getSingleValue(this.props.attrs, "name");
				} else if (this.props.metaType === "residue") {
					var aa = singleValueToString(this.props.attrs, "aa"),
						test = singleValueToString(this.props.attrs, "test");
					items = [
						["aa", "Amino Acid", aa],
						["test", "Test", String(test)]
					];
					data["aa"] = getSingleValue(this.props.attrs, "aa");
					data["test"] = getSingleValue(this.props.attrs, "test");
				} else if (this.props.metaType === "state") {
					var name = singleValueToString(this.props.attrs, "name"),
						test = singleValueToString(this.props.attrs, "test");
					items = [
						["name", "Name", name],
						["test", "Test", String(test)]
					];
					data["name"] = getSingleValue(this.props.attrs, "name");
					data["test"] = getSingleValue(this.props.attrs, "test");
				} else if (this.props.metaType === "mod") {
					var value = singleValueToString(this.props.attrs, "value"),
						rate = singleValueToString(this.props.attrs, "rate");
					items = [
						["value", "Value", value],
						["rate", "Rate", rate],
					];
					data["value"] = getSingleValue(this.props.attrs, "value");
					data["rate"] = getSingleValue(this.props.attrs, "rate");
				} else if (this.props.metaType === "bnd") {
					var rate = singleValueToString(this.props.attrs, "rate");
					items = [
						["rate", "Rate", rate, rate],
					];
					data["rate"] = getSingleValue(this.props.attrs, "rate");
				} else {
					message = "No meta-data available";
				}
			}	
		} else {
			if ((!this.props.sourceId) || (!this.props.targetId)) {
				message = "Click on an element to select";
			} else {
				//  region/gene, site/gene, site/region
				if (((this.props.sourceMetaType === "region") && (this.props.targetMetaType === "gene")) ||
					((this.props.sourceMetaType === "site") && (this.props.targetMetaType === "gene")) ||
					((this.props.sourceMetaType === "site") && (this.props.targetMetaType === "region"))) {
					var start = singleValueToString(this.props.attrs, "start"),
						end = singleValueToString(this.props.attrs, "end"),
						order = singleValueToString(this.props.attrs, "order");
					items = [
						["start", "Start", start],
						["end", "End", end],
						["order", "Order", order]
					];
					data["start"] = getSingleValue(this.props.attrs, "start");
					data["end"] = getSingleValue(this.props.attrs, "end");
					data["order"] = getSingleValue(this.props.attrs, "order");
				} else if (this.props.sourceMetaType === "residue")  {
					var loc = singleValueToString(this.props.attrs, "loc");
					items = [
						["loc", "Location", loc]
					];
					data["loc"] = getSingleValue(this.props.attrs, "loc");
				} else {
					message = "Not available for this element"
				}
			}
		}


		return (
			<EditableBox id="metaData"
						 name="Meta-data"
						 items={items}
						 message={message}
						 editable={this.props.editable}
						 data={data} 
						 onDataUpdate={this.props.onDataUpdate}/>
		);
	}
}