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


class EditableBox extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			edited: false,
			items: props.items 
		};
	}


	render() {
		var content;
		if (this.props.items.length > 0) {
			var items = this.props.items.map((item, key) =>
			    <tr>
				  	<th scope="row">{item[1]}</th>
				  	<td>{item[2]}</td>
				</tr>
			);
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

		var editButton = null;
		if (this.props.items.length > 0) {
			editButton = 
				<a href="" 
				   type="button" 
				   className="btn btn-default btn-md panel-button editable-box right-button">
				   	<span class="glyphicon glyphicon-pencil"></span> Edit
				</a>;
		}

		return ([
			<div className="row">
				<div className="col-md-8">
					<h3 class="editable-box">{this.props.name}</h3>
				</div>
				<div className="col-md-4">
					{editButton}
				</div>
			</div>,
            <div id={this.props.id}>
            	{content}
            </div>
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
				items = [
					["id", "Node ID", this.props.elementId],
					["type", "Node Type", [<span className={"dot dot-" + this.props.metaType}></span>, " " + this.props.metaType]]
				];
			}
		} else {
			if ((!this.props.sourceId) || (!this.props.targetId)) {
				message = "Click on an element to select";
			} else {
				items = [
					["sourceId", "Source ID", this.props.sourceId],
					["sourceType", "Source Type", [<span className={"dot dot-" + this.props.sourceMetaType}></span>, " " + this.props.sourceMetaType]],
					["targetId", "Target ID", this.props.targetId],
					["targetType", "Target Type", [<span className={"dot dot-" + this.props.targetMetaType}></span>, " " + this.props.targetMetaType]]
				];
			}
		}

		return (
			<EditableBox
				id="elementInfo"
				name="Element"
				items={items}
				message={message}/>
		);
	}
}


class MetaDataBox extends React.Component {
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
				} else if (this.props.metaType === "residue") {
					var aa = singleValueToString(this.props.attrs, "aa"),
						test = singleValueToString(this.props.attrs, "test");
					items = [
						["aa", "Amino Acid", aa],
						["test", "Test", String(test)]
					];
				} else if (this.props.metaType === "state") {
					var name = singleValueToString(this.props.attrs, "name"),
						test = singleValueToString(this.props.attrs, "test");
					items = [
						["name", "Name", name],
						["test", "Test", String(test)]
					];
				} else if (this.props.metaType === "mod") {
					var value = singleValueToString(this.props.attrs, "value"),
						rate = singleValueToString(this.props.attrs, "rate");
					items = [
						["value", "Value", value],
						["rate", "Rate", rate],
					];
				} else if (this.props.metaType === "bnd") {
					var rate = singleValueToString(this.props.attrs, "rate");
					items = [
						["rate", "Rate", rate],
					];
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
				} else if (this.props.sourceMetaType === "residue")  {
					var loc = singleValueToString(this.props.attrs, "loc");
					items = [
						["loc", "Location", loc]
					];
				} else {
					message = "Not available for this element"
				}
			}
		}


		return (
			<EditableBox id="metaData"
						 name="Meta-data"
						 items={items}
						 message={message} />
		);
	}
}