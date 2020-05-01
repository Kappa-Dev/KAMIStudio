
function VariantSelectionDialog(props) {
	var filteredList = <FilteredList 
			onFetchItems={props.onFetchItems}
			onItemClick={props.onItemClick}
			filterItems={props.filterItems}
			listComponent={GeneList}
			itemFilter={
				(item, value) => item.join(", ").toLowerCase().search(
		    			value.toLowerCase()) !== -1
			}/>;
	return (
		<Dialog
			id={props.id}
			title={props.title}
			onRemove={props.onRemove}
			content={filteredList} />
	);
}



class VariantSelectionItem extends React.Component {

	constructor(props) {
		super(props);

		this.onSelection = this.onSelection.bind(this);
		this.isSelected = this.isSelected.bind(this);
		this.defaultItem = this.defaultItem.bind(this);
		this.getDefaultItem = this.getDefaultItem.bind(this);

		this.state = {
			selected: [],
			defaultDeselected: false
		}
	}

	defaultItem(item) {
		return this.props.subitems[item][1];
	}

	getDefaultItem() {
		for (var item in this.props.subitems) {
			if (this.defaultItem(item)) {
				return item;
			}
		}
	}

	isSelected(item) {
		if (this.defaultItem(item)) {
			return !this.state.defaultDeselected;
		} else {
			return this.state.selected.includes(item);
		}
	}

	onSelection(selectionId, item) {
		var state = Object.assign({}, this.state);

		if (this.defaultItem(item)) {
			state.defaultDeselected = !state.defaultDeselected;
		} else {
			if (state.selected.includes(item)) {
				state.selected.splice(state.selected.indexOf(item), 1);
			} else {
				state.selected.push(item);
			}
		}

		this.setState(state);

		var allSelected = [...state.selected];
		if (!state.defaultDeselected) {
			allSelected.push(this.getDefaultItem());
		}

		this.props.onSubitemChange(
			this.props.selectionId, allSelected);
	}

	render() {
		var subitems = null;
		if (Object.keys(this.props.subitems).length > 0) { 
			var subitems = Object.keys(this.props.subitems).map(
				(item) =>
					[<input type="checkbox"
							onChange={() => this.onSelection(this.props.selectionId, item)}
							name={this.props.selectionId}
							value={this.props.selectionId + item}
							checked={this.isSelected(item)}/>,
					 " " + item + " (" + this.props.subitems[item][0] + ")",
					 <br/>]
			);
		} 
		var message = Object.keys(this.props.subitems).length > 0 ? "" : "No variants specified, Wild Type is selected by default";
		return (
			<li>
				{this.props.selectionId} (Wild type if no variants selected) {message}
				<button type="button" className="close"
						onClick={() => this.props.onRemove(this.props.selectionId)}
						ariaLabel="Close">
		          <span aria-hidden="true">&times;</span>
		        </button>
				<br/>
				{subitems}
			</li>
		);
	}
}

class InstantiationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			name: null,
			desc: null,
			default_bnd_rate: null,
			default_brk_rate: null,
			default_mod_rate: null,
			choices: [],
			activeDialog: false
		};

		this.onButtonClick = this.onButtonClick.bind(this);
		this.onRemoveDialog = this.onRemoveDialog.bind(this);
		this.onItemClick = this.onItemClick.bind(this);
		this.onSubitemChange = this.onSubitemChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.onRemoveItem = this.onRemoveItem.bind(this);
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

	onItemClick(uniprotid, hgnc) {
		// console.log(uniprotid, hgnc);
		var state = Object.assign({}, this.state),
			variants = {};

		state.activeDialog = false;
		
		state["choices"].push({
			"uniprotid": uniprotid,
			"hgnc": hgnc,
			"variants": variants,
			"selectedVariants": []
		})
		this.setState(state);
		this.props.onFetchSubitems(this, state["choices"].length - 1, uniprotid);
	}

	onSubitemChange(uniprotid, items) {
		var state = Object.assign({}, this.state);
		for (var i=0; i < state["choices"].length; i++) {
			if (state["choices"][i]["uniprotid"] == uniprotid) {
				state["choices"][i]["selectedVariants"] = items;
			}
		}
		this.setState(state);
	}

	onSubmit(e) {
		e.preventDefault();
		if (!this.props.readonly) {
	        // get our form data out of state
	        $("#progressBlock").attr("style", "padding-top: 5px; display: inline-block;");

	        const data = this.state;
	        const url = "/corpus/" + this.props.modelId + "/instantiate";
	        $.ajax({
			    url: url,
			    type: 'post',
			    dataType: "json",
			    contentType: 'application/json',
			    data:  JSON.stringify(data),
			}).done(function (data) {
				window.location.href = data["redirect"];
			}).fail(function (e) {
			    console.log("Failed to instantiate corpus");
			});
		}
	}

	handleFieldChange = (field) => (event, value, selectedKey) => {
		var val;
		if (event) {
			val = event.target.value;
		} else {
			val = value;
		}

		let newState = { ...this.state };
		newState[field] = val;
		this.setState(newState);
	}

	onRemoveItem(itemId) {
		var state = {...this.state};
		var indexToRemove = -1;
		for (var i = state.choices.length - 1; i >= 0; i--) {
			if (this.state.choices[i].uniprotid == itemId) {
				indexToRemove = i;
				break;
			}
		}
		state.choices.splice(indexToRemove, 1);
		this.setState(state);
	}

	render() {
		var content = this.state.choices.map((item, key) =>
			<VariantSelectionItem selectionId={item["uniprotid"]}
						   selectionText={String(item["uniprotid"]) + item["hgnc"]}
						   subitems={item["variants"]} 
						   onSubitemChange={this.onSubitemChange}
						   onRemove={this.onRemoveItem}
						   noSubitemsMessage={" Wild Type (no variants found, default selection)"}/>),
			dialog = null;

		if (this.state.activeDialog) {
			dialog = <VariantSelectionDialog
				id={this.props.id + "SelectionDialog"}
				modelId={this.props.modelId}
				title={this.props.selectionDialogTitle}
				onRemove={this.onRemoveDialog}
				onFetchItems={this.props.onFetchItems}
				onItemClick={this.onItemClick}
				filterItems={this.state.choices.map((item) => item["uniprotid"])}/>;
		}

		return (
			<form id="instantationForm">
				<div class="col-md-6">
				    <div class="model-input-form-block">
						<div class="row form-row">
						      <label for="name">Name</label>
						      <input type="text" class="form-control"
						      		 name="name" 
						      		 id="name"
						      		 placeholder=""
						      		 value={this.state.name}
						      		 onChange={this.handleFieldChange("name")}/>
						</div>

						<div class="row form-row">
						    <label for="desc">Description</label>
						    <input type="text" class="form-control" name="desc"
						    	   placeholder=""
						    	   value={this.state.desc}
						    	   id="desc"
						    	   onChange={this.handleFieldChange("desc")}/>
						</div>

						<div class="row form-row">
						    <label for="default_bnd_rate">Default binding rate</label>
						    <input type="text" class="form-control" name="default_bnd_rate"
						    	   placeholder=""
						    	   value={this.state.default_bnd_rate}
						    	   id="default_bnd_rate"
						    	   onChange={this.handleFieldChange("default_bnd_rate")}/>
						</div>

						<div class="row form-row">
						    <label for="default_brk_rate">Default unbinding rate</label>
						    <input type="text" class="form-control" name="default_brk_rate"
						    	   placeholder=""
						    	   value={this.state.default_brk_rate}
						    	   id="default_brk_rate"
						    	   onChange={this.handleFieldChange("default_brk_rate")}/>
						</div>

						<div class="row form-row">
						    <label for="default_mod_rate">Default modification rate</label>
						    <input type="text" class="form-control" name="default_mod_rate"
						    	   placeholder=""
						    	   value={this.state.default_mod_rate}
						    	   id="default_mod_rate"
						    	   onChange={this.handleFieldChange("default_mod_rate")}/>
						</div>

						<div class="row form-row">
						    <label for="desc">Variant selection</label>
						    <p>Select non-wild-type variants for instantation of the model</p>
						    <div id="variantSelectionWidget">
						    	{dialog}
								<div id={this.props.id + "Selection"}>
									<ul className="selection-items">
										{content}
									</ul>
								</div>
								<a type="button"
								   onClick={this.onButtonClick}
								   className="btn btn-default btn-md panel-button add-button add-enzyme-region">
								   <span className="glyphicon glyphicon-plus"></span> {this.props.buttonLabel}
								</a>
								<div className="row form-row">
									<div className="col-md-6">
										<div id="progressBlock" style={{"padding-top": "10px", "display": "none"}}>
	          								<div id="progressMessage">Instantiating the corpus... It may take a moment.</div>
											<div id="loadingBlock"  className="loading-elements center-block">
												<p>Loading...</p>
												<div id="loader"></div>
											</div>
										</div>
									</div>
									<div className="col-md-6" style={{"text-align": "right"}}>
										<button type="submit" 
												className="btn btn-primary btn-lg" 
												name="importForm"
												disabled={this.props.readonly}
												onClick={this.onSubmit}>
												<span className="glyphicon glyphicon-play"></span> Instantiate
										</button> 
									</div>
								</div>
						    </div>
						</div>
					</div>
				</div>
			</form>);
	}
}
