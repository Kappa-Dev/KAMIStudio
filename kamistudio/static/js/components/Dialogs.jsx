/**
 * Collection of React components for dialogs.
 */

function Dialog(props) {
	return (
		<div className="selection-dialog dialog" id={props.id}>
			<h2 style={{"display": "inline-block"}} className="selection-dialog-title">{props.title}</h2>
			<a className="cancel-link"
				onClick={props.onRemove}>
				<span className="glyphicon glyphicon-remove"></span>
			</a>
			{props.content}
		</div>
	)
}

