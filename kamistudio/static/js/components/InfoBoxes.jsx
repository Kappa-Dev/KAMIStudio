/**
 * Collection of React components for info-boxes.
 */


class EditableBox extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			expanded: props.expanded,
			editing: false,
			updatedData: {}
		};

		this.handleEditClick = this.handleEditClick.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleCancelClick = this.handleCancelClick.bind(this);
		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.handleCollapse = this.handleCollapse.bind(this);
	}

	handleEditClick() {
		let newState = { ...this.state };
		newState.editing = true;
		this.setState(newState);
	}

	handleSaveClick() {
		if (Object.keys(this.state.updatedData).length > 0) {
			for (var k in this.state.updatedData) {
				this.props.data[k] = this.state.updatedData[k];
			}
			this.props.onDataUpdate(this.state.updatedData, this.props.data);
		}
		this.handleCancelClick();
	}

	handleCancelClick() {
		let newState = { ...this.state };
		newState.editing = false;
		newState.updatedData = {};
		this.setState(newState);
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		var val;
		if (event) {
			val = event.target.value;
		} else {
			val = value;
		}

		let newState = { ...this.state };
		newState.updatedData[field] = val.split(",");
		this.setState(newState);
	}

	handleCollapse() {
		let newState = { ...this.state };
		newState.expanded = !newState.expanded;
		this.setState(newState);
	}

	render() {
		var content = null;
		if (this.state.expanded) {
			if (this.props.items.length > 0) {
				if (this.state.editing) {
					var items = this.props.items.map(
						(item, key) =>
						    !this.props.protected.includes(item[0]) ?
							    <tr key={key}>
								  	<th scope="row">{item[1]}</th>
								  	<td>
								  		<input type="text"
							          		   className="form-control"
							          		   name={item[1]}
							          		   id={item[0]}
							          		   onChange={this.handleFieldChange(item[0])}
							          		   value={item[0] in this.state.updatedData ? this.state.updatedData[item[0]] : this.props.data[item[0]]} />
							          </td>
								</tr>
								:
								<tr key={key}>
								  	<th scope="row">{item[1]}</th>
								  	<td>{item[2]}</td>
								</tr>
					);
				} else {
					var items = this.props.items.map((item, key) =>
					    <tr key={key}>
						  	<th scope="row">{item[1]}</th>
						  	<td>{item[2]}</td>
						</tr>
					);
				}
				var borderFlag = "";
				if (this.props.noBorders) {
					borderFlag = " no-borders";
				}

				content =
					<div className="table-responsive">
						<table className={"table table info-table" + borderFlag}>
							<tbody>
								{items}
							</tbody>
						</table>
					</div>;
			} else {
				content = 
					<div className="small-faded" id={this.props.id + "noSelectedElements"}>
						{this.props.message}
					</div>;
			}
		}

		var topButton = null;
		if (this.state.expanded && this.props.editable)  {
			if (this.props.editAction) {
				topButton = 
					<div className="col-sm-4">
						<div style={{"float": "right"}}>
							<button 
							   type="button" onClick={() => this.props.editAction()}
							   title={this.props.editText}
							   className="btn btn-default btn-sm panel-button editable-box right-button">
							   	<span className="glyphicon glyphicon-pencil"></span> {this.props.editText}
							</button>
							{this.props.allTopButtons}
						</div>
					</div>;
			} else {
				if (this.props.items.length > 0) {
					if (!this.state.editing) {
						var disable = false;
						if (this.props.readonly) {
							disable = true;
						}
						topButton = 
							<div className="col-sm-4">
								<div style={{"float": "right"}}>
									<button 
									   type="button" onClick={this.handleEditClick}
									   title="Edit"
									   className="btn btn-default btn-sm panel-button editable-box right-button" disabled={disable}>
									   	<span className="glyphicon glyphicon-pencil"></span>
									</button>
									{this.props.allTopButtons}
								</div>
							</div>;
					}
				}
			}
		}

		var cancelButton = null;
		var saveButton = null;
		if (this.state.editing) {
			cancelButton = <button 
				   type="button" onClick={this.handleCancelClick}
				   className="btn btn-default btn-sm panel-button editable-box right-button">
				   Cancel
				</button>;
			saveButton = 
				<button 
				   type="button" onClick={() => this.handleSaveClick()}
				   className="btn btn-primary btn-sm panel-button editable-box right-button">
				   Save
				</button>;
		}

		var title = null;
		if (this.props.expandable) {
			var suffix = "";
			if (this.props.instantiated) {
				suffix = " instantiation-link";
			}
			if (this.state.expanded) {
				title = 
					<a className="info-box-title" onClick={this.handleCollapse}>
						<h4 className={"editable-box" + suffix}>
							<span className="glyphicon glyphicon-menu-down"></span> {this.props.name}
						</h4>
					</a>;
				
			} else {
				title =
					<a className="info-box-title" onClick={this.handleCollapse}>
						<h4 className={"editable-box" + suffix}>
							<span className="glyphicon glyphicon-menu-right"></span> {this.props.name}
						</h4>
					</a>;
			}
		} else {
			if (this.props.name) {
				title = <h4 className="editable-box">{this.props.name}</h4>;
			}
		}

		var infoIcon = null;
		if (this.props.onInfo) {
			infoIcon = <div class="info-tooltip">
							<span class="glyphicon glyphicon-question-sign"></span>
						  	<span class="tooltiptext">{this.props.onInfo}</span>
					   </div> ;
		}

		return ([
			<div className="row">
				<div className={"col-sm-" + (12 - (topButton ? 4 : 0))}>
					{title}
					{infoIcon}
				</div>
				{topButton}
			</div>,
            <div id={this.props.id}>
            	{content}
            </div>,
            <div className="row">
				<div className="col-sm-12">
					<div style={{"float": "right"}}>
						{[cancelButton, saveButton]}
					</div>
				</div>
			</div>,
        ]);
	}
}


class DropDownRow extends React.Component {
	constructor(props) {
		super(props);
	}



	render() {
		var content = null;
		if (typeof this.props.items !== 'undefined') {
			// <span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span>
			content =
				<tr>{" " + this.props.name + " (" + Object.keys(this.props.items).length + ")"}</tr>;
		}
		return (content);
	}
}

