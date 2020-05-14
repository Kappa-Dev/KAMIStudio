/**
 * Collection of React components for dialogs.
 */

function Dialog(props) {

	var modalFooter = null;
	if (props.footerContent) {
		modalFooter = <div className="modal-footer" >{props.footerContent}</div>;
	}

	return (
		<div className="modal" id="exampleModalCenter" tabIndex="-1" role="dialog" 
			 aria-labelledby="exampleModalCenterTitle"
			 aria-hidden="true"
			 style={{"display": "block"}}>
		  <div id={props.id} className="modal-dialog modal-dialog-centered" role="document" style={props.customStyle}>
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


class InBlockDialog extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidMount() {
		$(document).ready(
			function() {
			    $("#myModal").modal("show");

			    //appending modal background inside the blue div
			    $('.modal-backdrop').appendTo("#modalBlock");   
			        //remove the padding right and modal-open class from the body tag which bootstrap adds when a modal is shown
			        $('body').removeClass("modal-open")
			        $('body').css("padding-right", "");     
		  	});
	}

	render() {
		var modalFooter = null;

		if (this.props.footerContent) {
			modalFooter = <div className="modal-footer" >{this.props.footerContent}</div>;
		}

		return (
			<div id="modalBlock">
				<div id="myModal" className="modal fade modal-block" role="dialog">
			      <div className="modal-dialog">
			        <div className="modal-content">
			          <div className="modal-header">
			            <button type="button" className="close" onClick={this.props.onRemove}>&times;</button>
			            <h4 className="modal-title">{this.props.title}</h4>
			          </div>
			          <div className="modal-body">
			            {this.props.content}
			          </div>
			          {modalFooter}
			        </div>
			      </div>
			    </div>
			</div>
		);
	}
}

class ConfirmDialog extends React.Component {

	constructor(props) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
	}

	onConfirm() {
        $("#" + this.props.id + "ConfirmButton").attr("disabled", true);
        $("#" + this.props.id + "CancelButton").attr("disabled", true);        
        $("#" + this.props.id + "LoadingBlock").css("display", "block");
       	this.props.onConfirm();
    }

	render() {
		content = <div style={{"text-align": "center"}}>
            <h5>{this.props.text}</h5>

            <div style={{"margin-top": "15pt"}}>
                <button 
                   type="button" onClick={this.props.onCancel}
                   id={this.props.id + "CancelButton"}
                   className={"btn btn-primary btn-sm panel-button editable-box right-button " + (this.props.instantiated ? "instantiation" : "")}>
                    Cancel
                </button>
                <button 
                   type="button" onClick={this.onConfirm}
                   id={this.props.id + "ConfirmButton"}
                   className={"btn btn-default btn-sm panel-button editable-box right-button"
               			+ (this.props.instantiated ? " instantiation" : "")}>
                    {this.props.confirmText}
                </button>
                <div id={this.props.id + "LoadingBlock"} class="loading-elements center-block"
                          style={{"margin-bottom": "20pt", "display": "none"}}>
                    <div class="small-faded">{this.props.loadingMessage}</div>
                    <div id={this.props.instantiated ? "loaderModel" : "loader"}></div>
                </div>
            </div>
          </div>;

        return (
          <Dialog title={this.props.title}
                  content={content}
                  onRemove={this.props.onCancel}
                  customStyle={this.props.customStyle} />
        );
	}
}