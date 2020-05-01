function LabeledDropdown(props) {
	return ([
		<label for="{props.forId}">{props.label}</label>,
        <select onChange={() => props.onChange()} className="form-control"
        	    name={props.name} id={props.id}>
        	{
        		props.options.map((option, i)) =>
        			<option name={props.name} id={option[0]} value={option[0]}>
        				{option[1]}
        			</option>
        	}

        </select>
	]);
}

export default LabeledDropdown;