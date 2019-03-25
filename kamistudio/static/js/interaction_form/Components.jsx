function LabeledDropdown(props) {
	return ([
		<label for={props.name}>{props.label}</label>,
        <select onChange={props.onChange} className={"form-control"}
        	    name={props.name} id={props.id}>
        	{props.options.map((option, i) =>
        			<option name={props.name}
        					id={option[0]}
        					value={option[0]}
        					selected={option[2]} >
        				{option[1]}
        			</option>)}
        </select>
	]);
}

function LabeledTextInput(props) {
	return([
		<label htmlFor={props.name}>{props.label}</label>,
        <input type="text"
          	   className="form-control"
          	   name={props.name}
          	   id={props.id}
          	   placeholder={props.placeholder}
          	   value={props.value}
          	   onChange={props.onChange}
          	   required={props.required} />,
        <div className="invalid-feedback" style={{"display": "none"}}>
	        {props.invalidMessage}
	    </div>
	]);
}

function RadioInput(props) {
	return (
		<input type="radio"
		       id={props.id}
		       onChange={props.onChange}
		       name={props.name}
		       value={props.value}
		       checked={props.checked} />);
}

function Button(props) {
	return(
		<button type="button"
				id={props.id}
				className={"btn btn-" + props.buttonClass + " btn-lg"}
				onClick={props.onClick}>{props.content}</button>
	);
}


function SubelementContainer(props) {
	return(
		<div className="row form-row">
	        <div className="col-md-2 mb-3">
	          <label>{props.label}</label>
	        </div>
	        <div className="col-md-10 mb-3">
	          {props.content}
	          <a type="button"
	             className="btn btn-default btn-md panel-button add-button add-enzyme-region"
	             onClick={props.onClick}>
	             <span className="glyphicon glyphicon-plus"></span> {props.buttonLabel}
	          </a>
	        </div>
	    </div>
	);
}


function RowSeparator(props) {
	return(
		<div className="row">
	        <div className="col-md-12">
	          <hr className="mb-4" />
	        </div>
	     </div>
	);
}

function Checkbox(props) {
	return(
		<label>
			<input onClick={props.onClick}
				   type="checkbox"
				   className="radio"
				   id={props.id}
				   value={props.value}
				   name={props.name}
				   style={{display: "inline-block"}} /> {props.label}
		</label>
		);
}