function LabeledTextInput(props) {
	return([
		<label for={props.forId}>{props.label}</label>,
        <input type="text"
          		 className="form-control"
          		 name={props.name}
          		 id={props.id}
          		 placeholder={props.placeholder}
          		 value={props.value}>
	]);
}

export default LabeledTextInput;