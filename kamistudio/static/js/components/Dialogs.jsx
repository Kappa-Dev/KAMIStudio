/**
 * Collection of React components for dialogs.
 */

function Dialog(props) {

	var modalFooter = null;
	if (props.footerContent) {
		modalFooter = <div className="modal-footer" >{props.footerContent}</div>;
	}

	return (
		<div className="modal" id="exampleModalCenter" tabindex="-1" role="dialog" 
			 aria-labelledby="exampleModalCenterTitle"
			 aria-hidden="true"
			 style={{"display": "block"}}>
		  <div className="modal-dialog modal-dialog-centered" role="document" style={props.customStyle}>
		    <div className="modal-content">
		      <div className="modal-header">
		        <h3 className="modal-title" id="exampleModalLongTitle">{props.title}</h3>
		        <button type="button" className="close" onClick={props.onRemove} aria-label="Close">
		          <span aria-hidden="true">&times;</span>
		        </button>
		      </div>
		      <div className="modal-body">
		        {props.content}
		      </div>
		      {modalFooter}
		    </div>
		  </div>
		</div>
	)
}

