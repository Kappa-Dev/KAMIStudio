/**
 * Collection of React components for lists and filtered lists.
 */

class FilteredList extends React.Component {

	constructor(props) {
		super(props);

		this.filterList = this.filterList.bind(this);
		this.componentWillMount = this.componentWillMount.bind(this);

		this.state = {
			initialItems: [],
			items : null,
			waiting : props.waiting ? props.waiting : true
		}
	}

	componentWillMount() {
		if (this.props.onFetchItems) {
		    this.props.onFetchItems(this, this.props.filterItems);
		}
	}

	filterList(event) {
		var state = Object.assign({}, this.state),
			updatedList = (this.props.items) ? this.props.items.slice() : this.state.initialItems.slice();

		updatedList = updatedList.filter(
			(item) => this.props.itemFilter(item, event.target.value));

		state["items"] = updatedList;
		this.setState(state);
	}

  	render() {
  		var loader = null,
  			message = null,
  			list = null;

  		if ((this.state.initialItems.length == 0) && (!this.props.items)) {
  			if (this.state.waiting) {
				loader = 
					<div id="loadingBlock" style={{"margin":"auto"}} className="loading-elements center-block" display="none;">
						<p>Loading...</p>
						<div id="loader"></div>
					</div>;
			} else {
				message = <p style={{"margin-left": "15pt"}}>No elements</p>;
			}
	  	} else {
	  		var props = {};
  			if (this.props.listComponentProps) {
  				for (var k in this.props.listComponentProps) {
  					props[k] = this.props.listComponentProps[k]
  				}
  			}

  			props.items = (this.state.items === null && this.props.items) ? this.props.items : this.state.items;
	  		props.onItemClick = this.props.onItemClick;

	  		if (props.items.length == 0 && this.props.items.length !== 0 || this.state.initialItems.length !== 0) {
	  			message = <p style={
	  				{"margin-left": "15pt",
	  				 "height": "350pt"}
	  			}>No matches</p>;
	  		} else {
		  		list = React.createElement(
	  				this.props.listComponent, props);
		  	}
  		}

	    return (
	      <div className="filter-list">
	      	<div className="row">  
		        <div className="col-md-12">
		        	<input className="form-control search" type="text" placeholder="Search" onChange={this.filterList}/>
	     		</div>
	     	</div>
	     	<div className="row">  
		        <div className="col-md-12">
		        	{loader}
			     	{message}
			     	{list}
			    </div>
			</div>
	      </div>
	    );
  	}

}

