class InteractionForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			interactionType: "mod"
		}

		this.handleAddInteractionClick = this.handleAddInteractionClick.bind(this);
	}

	handleModBndSwitch(e) {
		// handle switching between Mod and Bnd form types
		this.setState({
        	interactionType: e.currentTarget.value,
        	data: null
        });
	}

	handleCancelClick() {
		console.log("Handle cancel button click");
	}

	handleAddInteractionClick() {
		console.log("Handle add interaction button click");
	}

	render() {
		let innerForm;
		if (this.state.interactionType === "mod") {
			innerForm = 
				<GenericModificationForm />;
		} else {
			innerForm = <BindingForm />;
		}

		return([
			<h2 className="mb-6">Interaction type</h2>,
			<form id="interactionForm"
			      noValidate 
			      method="post">

			{/* Radio buttons switching between Mod and Bnd */}
				<div className="mb-3">
					<RadioInput 
						id={"modRadioOption"}
						onChange={(e) => this.handleModBndSwitch(e)}
						name={"modorbnd"}
						value={"mod"}
						checked={this.state.interactionType === "mod" ? "checked" : ""} /> Modification
				</div>
				<div className="mb-3">
					<RadioInput 
						id={"bndRadioOption"}
						onChange={(e) => this.handleModBndSwitch(e)}
						name={"modorbnd"}
						value={"bnd"}
						checked={this.state.interactionType === "bnd" ? "checked" : ""} /> Binding
				</div>

			{/* Separator */}
				<div className="row">
					<div className="col-md-12">
					  <hr className="mb-4" />
					</div>
				</div>

			{/* Invalid input error messages go here */}
			    <div className="row form-row">
			        <div className="col-md-4 mb-3">
			          <div id="invalidFeedbackGlobal" className="invalid-feedback" style={{"display": "none"}}>
			            Input to some fields is invalid.
			          </div>
			        </div>
	        		<div className="col-md-4 mb-3">
			        </div>
			    </div>

			{/* General interaction info */}
			    <div className="row">
			        <div className="col-md-6">
			          	<LabeledTextInput
				          	label={"Description"}
				          	name={"interactionDesc"}
				          	id={"interactionDesc"}
				          	placeholder={"Description of the new interaction"}
				          	value={""}/>
			        </div>
			        <div className="col-md-2">
			        	<LabeledTextInput
				          	label={"Bimolecular rate"}
				          	name={"biRate"}
				          	id={"biRate"}
				          	placeholder={""}
				          	value={""}/>
			        </div>
			    </div>

			{/* Inner interaction-specific form */}
				{innerForm}

			{/* Buttons */}
				<div className="row form-row">
			        <div className="col-md-6 mb-6">
			        	<Button id={"cancelInteractionButton"}
			        			buttonClass={"default"}
			        			onClick={() => handleCancelClick}
			        			content={"Cancel"}/>
			        </div>
			        <div className="col-md-6 mb-6" id="buttons" style={{"textAlign" : "right"}}>
			        	<Button id={"previewBuggetButton"}
			        			buttonClass={"primary"}
			        			onClick={() => handlePreviewClick}
			        			content={"Nugget preview"}/>
			        	<Button id={"submitInteraction"}
			        			buttonClass={"primary"}
			        			onClick={() => handleAddInteractionClick}
			        			content={[<span className="glyphicon glyphicon-ok edit-sign"></span>, " Add to the model"]} />
			        </div>
			    </div>

			</form>
		]);
	}

}