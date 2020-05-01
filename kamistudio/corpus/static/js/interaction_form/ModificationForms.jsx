class ActorForm extends React.Component {
	render() {
		return(
			<div id={this.props.actorId + "Block"} class="form-block">
	          	<div class="mb-3">
	            	<h4 class="mb-3">{this.props.actorId}</h4>
	          	</div>
	          	<ProtoformForm
	          		enzyme={this.props.enzyme}
	          		substrate={this.props.substrate}
	          		binding={this.props.binding}
	          		id={this.props.actorId}
	          		value={this.props.value}
	          		actorId={this.props.actorId}
	          		onChange={this.props.onChange} />
	        </div>
		);
	}
}

class ModificationTargetForm extends React.Component {

	handleStateResidueSwitch(e) {
		console.log(e.currentTarget.value);
		// handle switching between State as a target and Residue as a target
        let data;
        if (e.currentTarget.value === "Residue") {
        	console.log("hrere");
			data = {
				type: "Residue",
				data: {
					aa: "",
					loc: "",
					test: true,
					state: {
						name: "",
						test: true
					}
				}
			};
		} else {
			data = {
				type: "State",
				data: {
					name: "",
					test: true
				}
			};
		}
		this.props.onChange(null, data);
	}

	render() {
		let subform;
		if (this.props.value.type == "Residue") {
			subform = 
				<ResidueForm 
					id="modTarget"
					value={this.props.value.data}
					onChange={this.props.onChange}/>;
		} else {
			subform =
				<StateForm 
					id="modTarget"
					value={this.props.value.data}
					onChange={this.props.onChange}/>;
		}
		return(
			<div id="modificationTargetBlock" className="form-block">

	          <div className="mb-3">
	            <h4 className="mb-3">Modification target</h4>
	          </div>

	          <div id="inputTarget">
	          	<div className="mb-3">
                	<RadioInput 
						id={"stateRadioOption"}
						onChange={(e) => this.handleStateResidueSwitch(e)}
						name={"stateorresidue"}
						value={"State"}
						checked={this.props.value.type === "State" ? "checked" : ""} /> State 
					<RadioInput 
						id={"residueRadioOption"}
						onChange={(e) => this.handleStateResidueSwitch(e)}
						name={"stateorresidue"}
						value={"Residue"}
						checked={this.props.value.type === "Residue" ? "checked" : ""} /> Residue
           		</div>
	          </div>

		      {subform}
		    </div>
		);
	}
}


class ModificationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {
				enzyme: {
					type: "Gene",
					data: {
						uniprotid: "",
						hgnc_symbol: "",
						synonyms: "",
						location: "",
						regions: [],
						sites: [],
						residues: [],
						states: []
					}
				},
				substrate: {
					type: "Gene",
					data: {
						uniprotid: "",
						hgnc_symbol: "",
						synonyms: "",
						location: "",
						regions: [],
						sites: [],
						residues: [],
						states: []
					}
				},
				target: {
					type: "State",
					data: {
						name: "",
						test: true
					}
				}
			}
		}
	}

	handleFieldChange = (field, subfield) => (event, value, selectedKey) => {
		let data = { ...this.state.data };
		if (subfield) {
			data[field][subfield] = value;
		} else {
			data[field] = value;
		}
		this.setState({ data });
	}

	render() {
		return([
			<ActorForm actorId="Enzyme"
					   onChange={this.handleFieldChange("enzyme", null)}
					   value={this.state.data.enzyme}
					   enzyme={true}
					   substrate={false}
					   binding={false} />,
			<ActorForm actorId="Substrate"
					   onChange={this.handleFieldChange("substrate", null)}
					   value={this.state.data.substrate}
					   enzyme={false}
					   substrate={true}
					   binding={false}  />,
			<ModificationTargetForm
				value={this.state.data.target}
				onChange={this.handleFieldChange("target", null)} />
		]);
	}
}

class AnonymousModificationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: null
		}
	}

	render() {
		return([
			<ActorForm actorId="Substrate" />,
			<ModificationTargetForm />]);
	}
}

class SelfModificationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: null
		}
	}

	render() {
		return(<ActorForm actorId="Substrate" />);
	}
}


class LigandModificationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {
				enzyme: {
					type: "Gene",
					data: {
						uniprotid: "",
						hgnc_symbol: "",
						synonyms: "",
						location: "",
						regions: [],
						sites: [],
						residues: [],
						states: []
					}
				},
				substrate: {
					type: "Gene",
					data: {
						uniprotid: "",
						hgnc_symbol: "",
						synonyms: "",
						location: "",
						regions: [],
						sites: [],
						residues: [],
						states: []
					}
				},

				target: {
					type: "State",
					data: {
						name: "",
						test: true
					}
				},
				enzyme_bnd_subactor: "gene",
				substrate_bnd_subactor: "gene",
				enzyme_bnd_region: null,
				enzyme_bnd_site: null,
				substrate_bnd_region: null,
				substrate_bnd_site: null,
			}
		}
	}

	handleFieldChange = (field, subfield) => (event, value, selectedKey) => {
		let data = { ...this.state.data };
		if (subfield) {
			data[field][subfield] = value;
		} else {
			data[field] = value;
		}
		this.setState({ data });
	}

	render() {
		return([
			<ActorForm actorId="Enzyme"
					   onChange={this.handleFieldChange("enzyme", null)}
					   value={this.state.data.enzyme}
					   enzyme={true}
					   substrate={false}
					   binding={true} />,
			<ActorForm actorId="Substrate"
					   onChange={this.handleFieldChange("substrate", null)}
					   value={this.state.data.substrate}
					   enzyme={false}
					   substrate={true}
					   binding={true}  />,
			<ModificationTargetForm
				value={this.state.data.target}
				onChange={this.handleFieldChange("target", null)} />
		]);
	}
}

class GenericModificationForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			modType: "Modification",
			data: null
		}
	}

	handleModTypeChange(e) {
		this.setState({
        	modType: e.currentTarget.value
        });
	}


	render() {

		let modTypeSelectionOptions = [
			["Modification", "Default", this.state.modType === "Modification"],
			["AnonymousModification", "Anonymous", this.state.modType === "AnonymousModification"],
			["SelfModification", "Self modification", this.state.modType === "SelfModification"],
			["LigandModification", "Ligand modification", this.state.modType === "LigandModification"]
		];

		let innerForm;
		switch(this.state.modType) {
		  case "AnonymousModification":
		    innerForm = <AnonymousModificationForm />;
		    break;
		  case "SelfModification":
		    innerForm = <SelfModificationForm />;
		  	break;
		  case "LigandModification":
		    innerForm = <LigandModificationForm />;
		  	break;
		  default:
		    // act as a normal modification
		    innerForm = <ModificationForm />;
		    break;
		} 

		return (
			<div id="mod">
		        <div className="row form-row">
			        <div className="col-md-4 mb-3">
			            <h3 className="mb-3">New modification interaction</h3>
			        </div>
			        <div className="col-md-4 mb-3">
			            <LabeledDropdown label={"Type of modification:"}
			            				 onChange={(e) => this.handleModTypeChange(e)}
			            				 name={"modType"}
			            				 id={"modTypeSelection"}
			            				 options={modTypeSelectionOptions}/>
			        </div>
		   		</div>
		   		{innerForm}
		    </div>
		);
	}
}
