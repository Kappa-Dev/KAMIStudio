import { LabeledDropdown } from "./components/LabeledDropdown";


class GenericModificationForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			modType: "Modification"
		}
	}

	handleModTypeChange() {

	}

	render() {

		let modTypeSelectionOptions = [
			["Modification", "Default"],
			["AnonymousModification", "Anonymous"],
			["SelfModification", "Self modification"],
			["LigandModification", "Ligand modification"]
		];

		return (
			<div id="mod">
		        <div className="row form-row">
			        <div className="col-md-4 mb-3">
			            <h3 className="mb-3">New modification interaction</h3>
			        </div>
		        <div className="col-md-4 mb-3">
		           {/* <LabeledDropdown forId={"modType"}
		            				 label={"Type of modification:"}
		            				 onChange={() => handleModTypeChange()}
		            				 name={"modType"}
		            				 id={"modTypeSelection"}
		            				 options={modTypeSelectionOptions}/>*/}
		        </div>
		    </div>
		);
	}
}

export default GenericModificationForm;