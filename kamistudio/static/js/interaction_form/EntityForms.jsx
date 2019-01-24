function addRegionToValue(value) {
	var newRegionData = {
		name: "",
		interproid: "",
		start: "",
		end: "",
		order: "",
		sites: [],
		residues: [], 
		states: []
	};
	let data = { ...value };
	data["regions"].push(newRegionData);
	return data
}

function addSiteToValue(value) {
	var newSiteData = {
		name: "",
		interproid: "",
		start: "",
		end: "",
		order: "",
		residues: [], 
		states: []
	};
	let data = { ...value };
	data["sites"].push(newSiteData);
	return data
}

function addResidueToValue(value) {
	var newResidueData = {
		aa: "",
		loc: "",
		test: true,
		state: null
	};
	let data = { ...value };
	data["residues"].push(newResidueData);
	return data
}

function addStateToValue(value) {
	var newStateData = {
		name: "",
		test: true
	};
	let data = { ...value };
	data["states"].push(newStateData);
	return data
}

class StateForm extends React.Component {

	constructor(props) {
		super(props);

		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.handleTestChange = this.handleTestChange.bind(this);
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		if (event) {
			data[field] = event.target.value;
		} else {
			data[field] = value;
		}
		this.props.onChange(null, data);
	}


	handleTestChange(e) {
		let data = { ...this.props.value };
		var val = e.currentTarget.value;
		if (val === "true") {
			data["test"] = true;
		} else {
			data["test"] = false;
		}
		this.props.onChange(null, data);
	}

	render() {
		let targetCheckbox;
		if (this.props.possibleTarget) {
			targetCheckbox =
				<Checkbox 
					id={"targetFlag" + this.props.id}
					name={"setAsTarget" + this.props.id}
					value="targetSelection"
					label=" Set as the target of modification"
					onClick={() => this.props.onSelectTargetClick("State", this.props.id)}/>
		} else {
			targetCheckbox = null;
		}

		return(
			<div className="form-block nested-form">
				<div className="row">
					<div className="col-md-4">
						<LabeledTextInput
		                	label="Name"
		                	name="name"
		                	onChange={this.handleFieldChange("name")}
		                	placeholder=""
		                	value={this.props.value.name} />  
					</div>
					<div className="col-md-4">
						<label for="">Test</label><br/>
						<RadioInput
							id="stateTestTrue"
							name={"test" + this.props.id}
							value={true}
							onChange={this.handleTestChange}
							checked={this.props.value.test} /> True
						<br />
						<RadioInput
							id="stateTestFalse"
							name={"test" + this.props.id}
							value={false}
							onChange={this.handleTestChange}
							checked={!this.props.value.test} /> False
					</div>
					<div className="col-md-4">
						<button type="button"
						        className="btn btn-default btn-sm remove-form-button"
						        onClick={() => this.props.onRemoveClick(this.props.id)}>
						        <span className="glyphicon glyphicon-remove"></span>
						</button>
					</div>
				</div>
				{targetCheckbox}
			</div>
		);
	}
}

class ResidueForm extends React.Component {
	constructor(props) {
		super(props);

		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.handleTestChange = this.handleTestChange.bind(this);
		this.handleSpecifyStateClick = this.handleSpecifyStateClick.bind(this);
		this.handleStateFieldChange = this.handleStateFieldChange.bind(this);
		this.handleStateTestChange = this.handleStateTestChange.bind(this);
		this.handleRemoveStateClick = this.handleRemoveStateClick.bind(this);
	}

	handleSpecifyStateClick() {
		let data = { ...this.props.value };
		data["state"] = {
			name: "",
			test: true
		}
		this.props.onChange(null, data);
	}

	handleRemoveStateClick() {
		let data = { ...this.props.value };
		data["state"] = null;
		this.props.onChange(null, data);
	}


	handleFieldChange = (field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		if (event) {
			data[field] = event.target.value;
		} else {
			data[field] = value;
		}
		this.props.onChange(null, data);
	}

	handleTestChange(e) {
		let data = { ...this.props.value };
		var val = e.currentTarget.value;
		if (val === "true") {
			data["test"] = true;
		} else {
			data["test"] = false;
		}
		this.props.onChange(null, data);
	}


	handleStateFieldChange = (field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		if (event) {
			data["state"][field] = event.target.value;
		} else {
			data["state"][field] = value;
		}
		this.props.onChange(null, data);
	}

	handleStateTestChange(e) {
		let data = { ...this.props.value };
		var val = e.currentTarget.value;
		if (val === "true") {
			data["state"]["test"] = true;
		} else {
			data["state"]["test"] = false;
		}
		this.props.onChange(null, data);
	}

	render() {

		let stateForm, specifyStateButton, targetCheckbox;

		if (!this.props.value.state) {
			specifyStateButton = 
				<a type="button"
				   onClick={this.handleSpecifyStateClick}
			 	   className="btn btn-default btn-md panel-button add-button add-enzyme-state">
			 		<span className="glyphicon glyphicon-plus"></span> Specify state
			 	</a>;
		 	stateForm = null;
		 	targetCheckbox = null;
		} else {
			specifyStateButton = null;
			if (this.props.possibleTarget) {
				targetCheckbox =
					<Checkbox 
						id={"targetFlag" + this.props.id}
						name={"setAsTarget" + this.props.id}
						value="targetSelection"
						label=" Set as the target of modification"
						onClick={() => this.props.onSelectTargetClick("Residue", this.props.id)}/>;
			} else { 
				targetCheckbox = null; 
			}
			stateForm =
				<div className="form-block nested-form">
					<div className="row">
						<div className="col-md-4">
							<LabeledTextInput
			                	label="Name"
			                	name="name"
			                	onChange={this.handleStateFieldChange("name")}
			                	placeholder=""
			                	value={this.props.value.state.name} />  
						</div>
						<div className="col-md-4">
							<label for="">Test</label><br/>
							<RadioInput
								name={"stateTest" + this.props.id}
								value={true}
								onChange={this.handleStateTestChange}
								checked={this.props.value.state.test} /> True
							<br />
							<RadioInput
								name={"stateTest" + this.props.id}
								value={false}
								onChange={this.handleStateTestChange}
								checked={!this.props.value.state.test} /> False
						</div>
						<div className="col-md-4">
							<button type="button"
									className="btn btn-default btn-sm remove-form-button"
									onClick={this.handleRemoveStateClick}>
									<span className="glyphicon glyphicon-remove"></span>
							</button>
						</div>
					</div>
					{targetCheckbox}
				</div>;
		}

		return(
			<div className="form-block nested-form">
				<div className="row">
					<div className="col-md-3">
						<LabeledTextInput
		                	label="Amino acid"
		                	name="aa"
		                	onChange={this.handleFieldChange("aa")}
		                	placeholder=""
		                	value={this.props.value.aa} />  
					</div>
					<div className="col-md-2">
						<LabeledTextInput
		                	label="Location"
		                	name="loc"
		                	onChange={this.handleFieldChange("loc")}
		                	placeholder=""
		                	value={this.props.value.loc} />  
					</div>
					<div className="col-md-3">
						<label for="">Test</label><br/>
						<RadioInput
							name={"residueTest" + this.props.id}
							value={true}
							onChange={this.handleTestChange}
							checked={this.props.value.test} /> True
						<br />
						<RadioInput
							name={"residueTest" + this.props.id}
							value={false}
							onChange={this.handleTestChange}
							checked={!this.props.value.test} /> False
					</div>
					<div className="col-md-4">
						<button type="button"
								className="btn btn-default btn-sm remove-form-button"
								onClick={() => this.props.onRemoveClick(this.props.id)}>
							<span className="glyphicon glyphicon-remove"></span>
						</button>
					</div>
				</div>
				<div className="row">
					<div className="col-md-2">
						<label>State</label>
					</div>
					<div className="col-md-10 mb-3">
						{stateForm}
						{specifyStateButton}
					</div>
				</div>
			</div>
		);
	}

}

class SiteForm extends React.Component {
	constructor(props) {
		super(props);

		this.handleFieldChange = this.handleFieldChange.bind(this);
    	this.handleAddResidue = this.handleAddResidue.bind(this);
    	this.handleAddState = this.handleAddState.bind(this);
    	this.handleRemoveElement = this.handleRemoveElement.bind(this);
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		if (event) {
			data[field] = event.target.value;
		} else {
			data[field] = value;
		}
		this.props.onChange(null, data);
	}

	handleRemoveElement = (type) => (id) => {
		let data = { ...this.props.value };
		data[type].splice(id - 1, 1);
		this.props.onChange(null, data);
	}

	handleAddResidue() {
		let data = addResidueToValue(this.props.value);
		this.props.onChange(null, data);
	}


	handleAddState() {
		let data = addStateToValue(this.props.value);
		this.props.onChange(null, data);
	}

	handleAddBond() {

	}

	render() {

		let actorCheckbox, bindingBox;
		if (this.props.possibleActor) {
			actorCheckbox =
				<Checkbox 
					id={"modActorFlag" + this.props.id}
					name={"setAsModActor" + this.props.id}
					value="modActorSelection"
					label=" Set as the actor of modification"
					onClick={() => this.props.onSelectActorClick("site", this.props.id)}/>;
		} else { 
			actorCheckbox = null; 
		}

		if (this.props.possibleBinding) {
			bindingBox =
				<Checkbox 
					id={"bndActorFlag" + this.props.id}
					name={"setAsBndActor" + this.props.id}
					value="bndActorSelection"
					label=" Set as the actor of binding"
					onClick={() => this.props.onSelectBindingClick("site", this.props.id)}/>;
		} else {
			bindingBox = null;
		}


		return(
			<div className="form-block nested-form">
				<div className="row">
					<div className="col-md-4">
						<h4 className="mb-3">Site</h4>
					</div>
					<div className="col-md-8">
						<button type="button"
								className="btn btn-default btn-sm remove-form-button"
								onClick={() => this.props.onRemoveClick(this.props.id)}>
							<span className="glyphicon glyphicon-remove"></span>
						</button>
					</div>
				</div>

				<div className="row">
	                <div className="col-md-4">
						<LabeledTextInput
		                	label="Name"
		                	name="name"
		                	onChange={this.handleFieldChange("name")}
		                	placeholder=""
		                	value={this.props.value.name} />  
	                </div>
	                <div className="col-md-4">
	                	<LabeledTextInput
		                	label="InterPro ID"
		                	name="interproid" 
		                	onChange={this.handleFieldChange("interproid")}
		                	placeholder=""
		                	value={this.props.value.interpoid} />  
	                </div>
                </div>

                <div className="row">
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="Start"
		                	name="start" 
		                	onChange={this.handleFieldChange("start")}
		                	placeholder=""
		                	value={this.props.value.start} />
                	</div>
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="End"
		                	name="end" 
		                	onChange={this.handleFieldChange("end")}
		                	placeholder=""
		                	value={this.props.value.end} />
		            </div>
                	<div className="col-md-2"></div>
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="Order"
		                	name="order" 
		                	onChange={this.handleFieldChange("order")}
		                	placeholder=""
		                	value={this.props.value.order} />
                	</div>
                	
                </div>

                <div className="row">
					{actorCheckbox}
				</div>

				<div className="row">
					{bindingBox}
				</div>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	component={ResidueForm}
		        	fieldLabel="Residues"
		        	possibleTarget={this.props.possibleTarget}
		        	onSelectTargetClick={this.props.onSelectTargetClick}
		        	buttonLabel="Add residue"
		        	onAddClick={this.handleAddResidue}
		        	onRemoveClick={this.handleRemoveElement("residues")}
		        	onChange={this.handleFieldChange("residues")}
		        	value={this.props.value.residues}/>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	component={StateForm}
		        	fieldLabel="States"
		        	possibleTarget={this.props.possibleTarget}
		        	onSelectTargetClick={this.props.onSelectTargetClick}
		        	buttonLabel="Add state"
		        	onAddClick={this.handleAddState}
		        	onRemoveClick={this.handleRemoveElement("states")}
		        	onChange={this.handleFieldChange("states")}
		        	value={this.props.value.states}/>


			</div>
		);
	}

}

class RegionForm extends React.Component {

	constructor(props) {
		super(props);
	
    	this.handleAddSite = this.handleAddSite.bind(this);
    	this.handleAddResidue = this.handleAddResidue.bind(this);
    	this.handleAddState = this.handleAddState.bind(this);
    	this.handleRemoveElement = this.handleRemoveElement.bind(this);
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		if (event) {
			data[field] = event.target.value;
		} else {
			data[field] = value;
		}
		this.props.onChange(null, data);
	}

	handleRemoveElement = (type) => (id) => {
		let data = { ...this.props.value };
		data[type].splice(id - 1, 1);
		this.props.onChange(null, data);
	}

	handleAddSite() {
		let data = addSiteToValue(this.props.value);
		this.props.onChange(null, data);
	}

	handleAddResidue() {
		let data = addResidueToValue(this.props.value);
		this.props.onChange(null, data);
	}


	handleAddState() {
		let data = addStateToValue(this.props.value);
		this.props.onChange(null, data);
	}

	handleAddBond() {

	}

	render() {
		let actorCheckbox, bindingBox;
		if (this.props.possibleActor) {
			actorCheckbox =
				<Checkbox 
					id={"modActorFlag" + this.props.id}
					name={"setAsModActor" + this.props.id}
					value="modActorSelection"
					label=" Set as the actor of modification"
					onClick={() => this.props.onSelectActorClick("region", this.props.id)}/>;
		} else { 
			actorCheckbox = null; 
		}

		if (this.props.possibleBinding) {
			bindingBox =
				<Checkbox 
					id={"bndActorFlag" + this.props.id}
					name={"setAsBndActor" + this.props.id}
					value="bndActorSelection"
					label=" Set as the actor of binding"
					onClick={() => this.props.onSelectBindingClick("region", this.props.id)}/>;
		} else {
			bindingBox = null;
		}

		return (
			<div className="form-block nested-form">
				<div className="row">
					<div className="col-md-4">
						<h4 className="mb-3">Region</h4>
					</div>
					<div className="col-md-8">
						<button type="button"
								className="btn btn-default btn-sm remove-form-button"
								onClick={() => this.props.onRemoveClick(this.props.id)}>
							<span className="glyphicon glyphicon-remove"></span>
						</button>
					</div>
				</div>

				<div className="row">
	                <div className="col-md-4">
						<LabeledTextInput
		                	label="Name"
		                	name="name"
		                	onChange={this.handleFieldChange("name")}
		                	placeholder=""
		                	value={this.props.value.name} />  
	                </div>
	                <div className="col-md-4">
	                	<LabeledTextInput
		                	label="InterPro ID"
		                	name="interproid" 
		                	onChange={this.handleFieldChange("interproid")}
		                	placeholder=""
		                	value={this.props.value.interpoid} />  
	                </div>
                </div>

                <div className="row">
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="Start"
		                	name="start" 
		                	onChange={this.handleFieldChange("start")}
		                	placeholder=""
		                	value={this.props.value.start} />
                	</div>
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="End"
		                	name="end" 
		                	onChange={this.handleFieldChange("end")}
		                	placeholder=""
		                	value={this.props.value.end} />
		            </div>
                	<div className="col-md-2"></div>
                	<div className="col-md-2">
                		<LabeledTextInput
		                	label="Order"
		                	name="order" 
		                	onChange={this.handleFieldChange("order")}
		                	placeholder=""
		                	value={this.props.value.order} />
                	</div>
                </div>

                <div className="row">
                	{actorCheckbox}
                </div>

                <div className="row">
                	{bindingBox}
                </div>

		        <RowSeparator />
		 
		        <ElementContainer
		        	id={this.props.id}
		        	component={SiteForm}
		        	possibleTarget={this.props.possibleTarget}
		        	onSelectTargetClick={this.props.onSelectTargetClick}
		        	possibleActor={this.props.possibleActor}
		        	possibleActor={this.props.possibleBinding}
		        	onSelectActorClick={this.props.onSelectActorClick}
		        	onSelectBindingClick={this.props.onSelectBindingClick}
		        	fieldLabel="Sites"
		        	buttonLabel="Add site"
		        	onAddClick={this.handleAddSite}
		        	onRemoveClick={this.handleRemoveElement("sites")}
		        	onChange={this.handleFieldChange("sites")}
		        	value={this.props.value.sites}/>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	component={ResidueForm}
		        	possibleTarget={this.props.possibleTarget}
		        	onSelectTargetClick={this.props.onSelectTargetClick}
		        	fieldLabel="Residues"
		        	buttonLabel="Add residue"
		        	onAddClick={this.handleAddResidue}
		        	onRemoveClick={this.handleRemoveElement("residues")}
		        	onChange={this.handleFieldChange("residues")}
		        	value={this.props.value.residues}/>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	component={StateForm}
		        	possibleTarget={this.props.possibleTarget}
		        	onSelectTargetClick={this.props.onSelectTargetClick}
		        	fieldLabel="States"
		        	buttonLabel="Add state"
		        	onAddClick={this.handleAddState}
		        	onRemoveClick={this.handleRemoveElement("states")}
		        	onChange={this.handleFieldChange("states")}
		        	value={this.props.value.states}/>

			</div>
		);
	}

}


class ElementContainer extends React.Component {

	handleFieldChange = (index) => (event, value, selectedKey) => {
		let data = [...this.props.value];
		data[index] = value;
		this.props.onChange(null, data);
	}

	render() {
		// console.log(this.props.value);
		return(
			<div className="row form-row">
		        <div className="col-md-2 mb-3">
		          <label>{this.props.fieldLabel}</label>
		        </div>
		        <div className="col-md-10 mb-3">
		          {this.props.value.map((subform, index) => 
					    React.createElement(
			  				this.props.component,
			  				{
			  					id:
			  						this.props.id + this.props.fieldLabel + (index + 1),
			          			value: subform,
			          			possibleTarget: this.props.possibleTarget,
			          			possibleActor: this.props.possibleActor,
			          			possibleBinding: this.props.possibleBinding,
			          			onSelectTargetClick: this.props.onSelectTargetClick,
			          			onSelectActorClick: this.props.onSelectActorClick,
			          			onSelectBindingClick: this.props.onSelectBindingClick,
	        					onChange: this.handleFieldChange(index),
	        					onRemoveClick: this.props.onRemoveClick
	        				}))}
		          <a type="button"
		             className="btn btn-default btn-md panel-button add-button add-enzyme-region"
		             onClick={this.props.onAddClick}>
		             <span className="glyphicon glyphicon-plus"></span> {this.props.buttonLabel}
		          </a>
		        </div>
		    </div>
		);
	}
}


class ProtoformForm extends React.Component {

	constructor(props) {
		super(props);

    	this.handleAddRegion = this.handleAddRegion.bind(this);
    	this.handleAddSite = this.handleAddSite.bind(this);
    	this.handleAddResidue = this.handleAddResidue.bind(this);
    	this.handleAddState = this.handleAddState.bind(this);
    	this.handleRemoveElement = this.handleRemoveElement.bind(this);
	}

	handleFieldChange = (superfield, field) => (event, value, selectedKey) => {
		let data = { ...this.props.value };
		let newValue;
		if (event) {
			newValue = event.target.value;
		} else {
			newValue = value;
		}
		if (superfield) {
			data["data"][superfield][field] = newValue;
		} else {
			data["data"][field] = newValue;
		}
		this.props.onChange(null, data);
	}

	handleRemoveElement = (superfield, type) => (id) => {
		let data = { ...this.props.value };
		if (superfield) {	
			data["data"][superfield][type].splice(id - 1, 1);
		} else {
			data["data"][type].splice(id - 1, 1);
		}
		this.props.onChange(null, data);
	}

	handleAddRegion = (subfield) => () => {
		let data = { ...this.props.value };
		if (subfield) {
			data["data"][subfield] = addRegionToValue(data["data"][subfield]);
		} else {
			data["data"] = addRegionToValue(data["data"]);
		}
		this.props.onChange(null, data);
	}

	handleAddSite = (subfield) => () => {
		let data = { ...this.props.value };
		if (subfield) {
			data["data"][subfield] = addSiteToValue(data["data"][subfield]);
		} else {
			data["data"] = addSiteToValue(data["data"]);
		}
		this.props.onChange(null, data);
	}

	handleAddResidue = (subfield) => () => {
		let data = { ...this.props.value };
		if (subfield) {
			data["data"][subfield] = addResidueToValue(data["data"][subfield]);
		} else {
			data["data"] = addResidueToValue(data["data"]);
		}
		this.props.onChange(null, data);
	}


	handleAddState = (subfield) => () => {
		let data = { ...this.props.value };
		if (subfield) {
			data["data"][subfield] = addStateToValue(data["data"][subfield]);
		} else {
			data["data"] = addStateToValue(data["data"]);
		}
		this.props.onChange(null, data);
	}

	handleAddBond = (subfield) => () => {

	}

	onSelectTargetClick(type, id) {
		console.log("Selected target: ", type, id);
	}


	onSelectActorClick(type, id) {
		console.log("Selected actor", type, id);
	}


	onSelectBindingClick(type, id) {
		console.log("Selected binding", type, id);
	}


	render() {
		let subfield = this.props.value.type === "Gene" ? null : "gene";

		return(
			<div className="protoform-block">
				<div className="row form-row">
	              <div className="col-md-4 mb-3">
	                <LabeledTextInput
	                	label="UniProt AC*"
	                	name="uniprotid"
	                	onChange={this.handleFieldChange(subfield, "uniprotid")}
	                	value={
	                		this.props.value.type === "Gene" ? this.props.value.data.uniprotid : this.props.value.data.gene.uniprotid 
	                	}
	                	placeholder=""
	                	required={true}
	                	invalidMessage="UniProt acession number is required." />
	              </div>
	              <div className="col-md-4 mb-3">
	              	<LabeledTextInput
	                	label="HGNC Symbol"
	                	name="hgnc_symbol"
	                	value={
	                		this.props.value.type === "Gene" ? this.props.value.data.hgnc_symbol : this.props.value.data.gene.hgnc_symbol 
	                	}
	                	onChange={this.handleFieldChange(subfield, 'hgnc_symbol')}
	                	placeholder="" />  
	              </div>
	          	</div>
	          
		         <div className="row form-row">
		            
		            <div className="col-md-4 mb-3">
			            <LabeledTextInput
		                	label="Synonyms"
		                	name="synonyms" 
		                	value={
		                		this.props.value.type === "Gene" ? this.props.value.data.synonyms : this.props.value.data.gene.synonyms 
		                	}
		                	onChange={this.handleFieldChange(subfield: "gene", 'synonyms')}
		                	placeholder="" /> 
		            </div>
		            <div className="col-md-4 mb-3">
			            <LabeledTextInput
		                	label="Location"
		                	name="location"
		                	value={
		                		this.props.value.type === "Gene" ? this.props.value.data.location : this.props.value.data.gene.location 
		                	}
		                	onChange={this.handleFieldChange(subfield, 'location')}
		                	placeholder="" />
		            </div>
		        </div>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	component={RegionForm}
		        	possibleTarget={this.props.substrate}
		        	onSelectTargetClick={this.onSelectTargetClick}
		        	possibleActor={this.props.enzyme}
		        	possibleBinding={this.props.binding}
		        	onSelectActorClick={this.onSelectActorClick}
		        	onSelectBindingClick={this.onSelectBindingClick}
		        	fieldLabel="Regions"
		        	buttonLabel="Add region"
		        	onAddClick={this.handleAddRegion(subfield)}
		        	onRemoveClick={this.handleRemoveElement(subfield, "regions")}
		        	onChange={this.handleFieldChange(subfield, "regions")}
		        	value={
		        		!subfield ? this.props.value.data.regions : this.props.value.data.gene.regions
		        	}/>
		        
		        <RowSeparator />
		 
		        <ElementContainer
		        	id={this.props.id}
		        	component={SiteForm}
		        	possibleTarget={this.props.substrate}
		        	onSelectTargetClick={this.onSelectTargetClick}
		        	possibleActor={this.props.enzyme}
		        	possibleBinding={this.props.binding}
		        	onSelectActorClick={this.onSelectActorClick}
		        	onSelectBindingClick={this.onSelectBindingClick}
		        	fieldLabel="Sites"
		        	buttonLabel="Add site"
		        	onAddClick={this.handleAddSite(subfield)}
		        	onRemoveClick={this.handleRemoveElement(subfield, "sites")}
		        	onChange={this.handleFieldChange(subfield, "sites")}
		        	value={
		        		!subfield ? this.props.value.data.sites : this.props.value.data[subfield].sites
		        	}/>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	possibleTarget={this.props.substrate}
		        	onSelectTargetClick={this.onSelectTargetClick}
		        	component={ResidueForm}
		        	fieldLabel="Residues"
		        	buttonLabel="Add residue"
		        	onAddClick={this.handleAddResidue(subfield)}
		        	onRemoveClick={this.handleRemoveElement(subfield, "residues")}
		        	onChange={this.handleFieldChange(subfield, "residues")}
		        	value={
		        		!subfield ? this.props.value.data.residues : this.props.value.data[subfield].residues
		        	}/>

		        <RowSeparator />

		        <ElementContainer
		        	id={this.props.id}
		        	possibleTarget={this.props.substrate}
		        	onSelectTargetClick={this.onSelectTargetClick}
		        	component={StateForm}
		        	fieldLabel="States"
		        	buttonLabel="Add state"
		        	onAddClick={this.handleAddState(subfield)}
		        	onRemoveClick={this.handleRemoveElement(subfield, "states")}
		        	onChange={this.handleFieldChange(subfield, "states")}
		        	value={
		        		!subfield ? this.props.value.data.states : this.props.value.data[subfield].states
		        	}/>

			</div>
		);
	}
}