class SelectionItem extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<li>{this.props.name}</li>
		);
	}
}

class FilteredList extends React.Component {
	
	constructor(props) {
		super(props);

		this.filterList = this.filterList.bind(this);
		this.componentWillMount = this.componentWillMount.bind(this);

		this.state = {
			items : []
		}
	}

	filterList(event) {
		var updatedList = this.props.items;
	
		updatedList = updatedList.filter(
			function(item){
		  		return item.toLowerCase().search(
		    		event.target.value.toLowerCase()) !== -1;
			});
		this.setState({items: updatedList});
	}
		
	componentWillMount() {
	    this.setState({
	    	items: this.props.items
	    })
	}
  	
  	render() {
  		var listItems = this.state.items.map(
  				function(item) {
          			return <li class="not-selected"><a>{item}</a></li>
        		});
       
	    return (
	      <div className="filter-list">
	      	<div class="row">  
		        <div class="col-md-12">
		        	<input class="form-control search" type="text" placeholder="Search" onChange={this.filterList}/>
	     		</div>
	     	</div>
	     	<div class="row">  
		        <div class="col-md-12">
			     	<ul class="nav nuggets-nav list-group-striped list-unstyled components">
			     		{listItems}
			     	</ul>
			    </div>
			</div>
	      </div>
	    );
  	}
}


class SelectionDialog extends React.Component {
	render() {

		return (
			<div class="selection-dialog" id={this.props.id}>
				<h2 style={{"display": "inline-block"}} class="selection-dialog-title">{this.props.title}</h2>
				<a class="cancel-link"
					onClick={this.props.onRemove}>
					<span class="glyphicon glyphicon-remove"></span>
				</a>
				<FilteredList items={[
					"hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there","hello",
					"there",
					]}/>
			</div>
		);
	}
}

class SelectionWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			choices: [],
			activeDialog: false
		};

		this.onButtonClick = this.onButtonClick.bind(this);
		this.onRemoveDialog = this.onRemoveDialog.bind(this);
	}

	onButtonClick() {
		var state = Object.assign({}, this.state);
		state.activeDialog = true;
		this.setState(state);
	}

	onRemoveDialog() {
		var state = Object.assign({}, this.state);
		state.activeDialog = false;
		this.setState(state);
	}

	render() {
		var content = this.state.choices.map((item, key) =>
			<SelectionItem selectionId={item}/>),
			dialog = null;

		if (this.state.activeDialog) {
			dialog = <SelectionDialog
				id={this.props.id + "SelectionDialog"}
				title={this.props.selectionDialogTitle}
				onRemove={this.onRemoveDialog}/>;
		}

		return ([
			dialog,
			<div id={this.props.id + "Selection"}>
				<ul>
					{content}
				</ul>
			</div>,
			<a type="button"
			   onClick={this.onButtonClick}
			   className="btn btn-default btn-md panel-button add-button add-enzyme-region" >
			   <span class="glyphicon glyphicon-plus"></span> {this.props.buttonLabel}
			</a>
		]);
	}
}