function GeneList(props) {
	var listItems = props.items.map(
		function(item) {
			var synomyms = item[2] ? item[2].concat([item[1]]) : [item[1]];

			return (
				<li className="not-selected gene-item" >
					<a className="gene-link" onClick={() => props.onItemClick ? props.onItemClick(item[0], item[1], item[2]) : ""}>
	  					{item[0]}
	  					<div className="synonyms">{synomyms ? synomyms.join(", ") : ""}</div>
  					</a>
				</li>);
		}
    );
	return <ul className="nav nuggets-nav list-group-striped list-unstyled components">
	     		{listItems}
	       </ul>;
}

function getSynonyms(item) {
	var list = [];
	if (item[2]) {
		list = list.concat(item[2]);
	};
	if (item[1]) {
		list.push(item[1]);
	} 
	return list;
}


class SelectableGeneList extends React.Component {
	constructor(props) {
		super(props);

		this.onGeneSelection = this.onGeneSelection.bind(this);
		this.geneIsSelected = this.geneIsSelected.bind(this);
		this.onSelectAll = this.onSelectAll.bind(this);


		var initialSelectedIds = [],
			targetItems = this.props.preselectedItems ? this.props.preselectedItems : this.props.items;
		for (var i = targetItems.length - 1; i >= 0; i--) {
			initialSelectedIds.push(targetItems[i][0]);
		}

		this.state = {
			selected: initialSelectedIds,
			selectedAll: this.props.preselectedItems ? false : true
		}
		if (!this.props.preselectedItems) {
			if (this.props.onSelectionUpdate) {
				this.props.onSelectionUpdate(this.props.items);
			}
		}
	}

	geneIsSelected(item) {
		if (this.state.selectedAll) {
			return true;
		} else {
			for (var i = this.state.selected.length - 1; i >= 0; i--) {
				if (item[0] == this.state.selected[i]) {
					return true;
				}
			}
			return this.state.selected.includes(item);
		}
	}

	onGeneSelection(item) {
		var newState = Object.assign({}, this.state);
		if (this.state.selectedAll) {
			newState.selectedAll = false;
			// newState.selected = [...this.props.items];
			removeItem(newState.selected, item[0]);
		} else {
			if (this.geneIsSelected(item)) {
				removeItem(newState.selected, item[0]);
			} else {
				newState.selected.push(item[0]);
			}
		}
		this.setState(newState);
		if (this.props.onSelectionUpdate) {
			this.props.onSelectionUpdate(newState.selected);
		}
	}

	onSelectAll(item) {
		var newState = Object.assign({}, this.state);
		newState.selectedAll = !this.state.selectedAll;
		if (!newState.selectedAll) {
			newState.selected = [];
		} else {
			var allItems = [];
			for (var i = this.props.items.length - 1; i >= 0; i--) {
				allItems.push(this.props.items[i][0]);
			}
			newState.selected = allItems;
		}
		this.setState(newState);
		if (this.props.onSelectionUpdate) {
			this.props.onSelectionUpdate(newState.selected);
		}
	}

	render() {
		var listItems = this.props.items.map(
				(item) => (<li className="not-selected gene-item" >
					<label className="gene-item">
						<input type="checkbox"
							   className="gene-selector"
							   id={item[0]}
							   name={item[0]}
							   onChange={() => this.onGeneSelection(item)}
							   checked={this.geneIsSelected(item)}
							   /> 
						{item[0]}
	  					<div className="synonyms">{getSynonyms(item) ? getSynonyms(item).join(", ") : ""}</div>
  					</label>
				</li>)
	    );
		return (
			<ul className="nav nuggets-nav list-group-striped list-unstyled components">
	     		<li className="not-selected gene-item fixed" >
					<label className="gene-item">
						<input type="checkbox"
							   className="gene-selector"
							   id="all"
							   name="all"
							   onChange={() => this.onSelectAll()}
							   checked={this.state.selectedAll}/>
							   <div className="small-faded" style={{"display": "inline"}}>(select all)</div>
					</label> 
				</li>
	     		{listItems}
	       </ul>
	    );
	}
}


function VariantSelectionDialog(props) {
	var filteredList = <FilteredList 
			onFetchItems={props.onFetchItems}
			onItemClick={props.onItemClick}
			filterItems={props.filterItems}
			listComponent={GeneList}
			instantiated={props.instantiated}
			itemFilter={
				(item, value) => item.join(", ").toLowerCase().search(
		    			value.toLowerCase()) !== -1
			}/>;
	return (
		<Dialog
			id={props.id}
			title={props.title}
			onRemove={props.onRemove}
			instantiated={props.instantiated}
			content={filteredList} />
	);
}

function GeneSelectionWidget(props) {
	var filteredList = <FilteredList 
			instantiated={props.instantiated}
			onFetchItems={props.onFetchItems}
			filterItems={props.filterItems}
			listComponent={SelectableGeneList}
			listComponentProps={{
				"onSelectionUpdate": props.onUpdateSelected,
				"preselectedItems": props.preselectedItems
			}}
			itemFilter={
				(item, value) => item.join(", ").toLowerCase().search(
		    			value.toLowerCase()) !== -1}
			/>;
	return filteredList;
}


class VariantSelectionItem extends React.Component {

	constructor(props) {
		super(props);

		this.onSelection = this.onSelection.bind(this);
		this.isSelected = this.isSelected.bind(this);
		this.defaultItem = this.defaultItem.bind(this);
		this.getDefaultItem = this.getDefaultItem.bind(this);
		this.onShowVariantClick = this.onShowVariantClick.bind(this);
		this.onRemoveShowVariantDialog = this.onRemoveShowVariantDialog.bind(this);

		this.state = {
			selected: this.props.preselectedItems ? Object.keys(this.props.preselectedItems) : [],
			activeShowVariantDialog: false,
			activeVariant: null,
			activeVariantGraph: false,
			defaultDeselected: false
		}
	}

	defaultItem(item) {
		if (this.props.defaultDisabled) {
			return false;
		} else {
			return this.props.subitems[item][1];
		}
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

	onShowVariantClick(variantId) {
		console.log("here");
		var state = Object.assign({}, this.state);
		state.activeShowVariantDialog = true;
		state.activeVariant = variantId;
		this.setState(state);
		getRawDefinition(
			this.props.corpusId,
			this.props.selectionId,
			(data) => {
				var state = Object.assign({}, this.state);
				state.activeVariantGraph = true;
				this.setState(state);
				var productData = generateProductGraph(
					data, this.state.activeVariant);
				drawDefinitionGraph(
					this.props.corpusId, null, "variant",
					productData[0],
					productData[1],
					true, false);
			}
		);
	}

	onRemoveShowVariantDialog() {
		var state = Object.assign({}, this.state);
		state.activeShowVariantDialog = false;
		state.activeVariant = null;
		state.activeVariantGraph = false;
		this.setState(state);
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
			if (this.getDefaultItem()) {
				allSelected.push(this.getDefaultItem());
			}
		}

		this.props.onSubitemChange(
			this.props.selectionId, allSelected, item);
	}

	render() {
		var subitems = null;
		if (Object.keys(this.props.subitems).length > 0) { 
			var subitems = Object.keys(this.props.subitems).map(
				(item) => (
					<li className="not-selected gene-item variant-checkbox">
						<label className="gene-item">
							{[this.props.editable ? (
								<input type="checkbox"
									onChange={() => this.onSelection(this.props.selectionId, item)}
									name={this.props.selectionId}
									value={this.props.selectionId + item}
									checked={this.isSelected(item)}/>) : null,
						 	" " + item + (
						 		this.props.subitems[item][0] ? (" (" + this.props.subitems[item][0] + ")") : "")
						 	]}
					 	</label>
					 	<div className="synonyms show-link">
					 		<a onClick={() => this.onShowVariantClick(item)}>
					 			<span className="glyphicon glyphicon-eye-open"></span> Show variant
					 		</a>
					 	</div>
					</li>
				)
			);
		} 

		const noVarsMessage = [
			<br/>,
			<div className="no-vars-message">
				No variants specified, the wild type is selected by default
			</div>];
		var message = Object.keys(this.props.subitems).length > 0 ? "" : noVarsMessage,
			protoformSynonyms = getSynonyms(
				[null, this.props.selectionHGNC, this.props.selectionSynonyms]),
			
			protoformRepr = this.props.selectionId + (
					protoformSynonyms.length > 0 ? (" (" + protoformSynonyms.join(", ") + ")") : ""
				);

		var dialog = null;
		if (this.state.activeShowVariantDialog) {
			var dialogContent = (
				<DefinitionGraphView
						instantiated={this.props.instantiated}
						loading={!this.state.activeVariantGraph}
	            		title={"Variant '" + this.state.activeVariant + "' of the protoform " + protoformRepr}
	            		svgId="variantSvg"
	            		svgDisplay="inline-block"
	            		removable={false}
	            		readonly={this.props.readonly}
	            		elementInfoBoxId="variantGraphElementInfo"
	            		metaDataBoxId="varianGraphMetaModelInfo"/>
	        );

			dialog = (
				<Dialog id="showVariantDialog"
						title="Variant preview"
						onRemove={this.onRemoveShowVariantDialog}
						content={dialogContent} />
			);
		}

		var removeButton;
		if (this.props.editable) {
			removeButton = (
				<button type="button" className="close"
						onClick={() => this.props.onRemove(this.props.selectionId)}
						ariaLabel="Close">
		          <span aria-hidden="true">&times;</span>
		        </button>
			);
		}
		return (
			<li>
				<div className="var-selection-header">
					{protoformRepr}
					{removeButton}
				</div>
				{dialog}
				{message}
				<ul className="nav nuggets-nav list-group-striped list-unstyled components">
					{subitems}
				</ul>
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
			variantChoices: [],
			seedGenes: [],
			activeVariantSelectioDialog: false,
		};

		this.onSelectVariantButtonClick = this.onSelectVariantButtonClick.bind(this);
		this.onRemoveVariantSelectionDialog = this.onRemoveVariantSelectionDialog.bind(this);
		this.onVariantItemClick = this.onVariantItemClick.bind(this);
		this.onSubitemChange = this.onSubitemChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.handleFieldChange = this.handleFieldChange.bind(this);
		this.onRemoveItem = this.onRemoveItem.bind(this);
	}

	onSelectVariantButtonClick() {
		var state = Object.assign({}, this.state);
		state.activeVariantSelectioDialog = true;
		this.setState(state);
	}


	onRemoveVariantSelectionDialog() {
		var state = Object.assign({}, this.state);
		state.activeVariantSelectioDialog = false;
		this.setState(state);
	}


	onVariantItemClick(uniprotid, hgnc, synonyms) {
		var state = Object.assign({}, this.state),
			variants = {};

		state.activeVariantSelectioDialog = false;
		
		
		state["variantChoices"].push({
			"uniprotid": uniprotid,
			"hgnc": hgnc,
			"synonyms": synonyms,
			"variants": variants,
			"selectedVariants": []
		})

		this.setState(state);
		this.props.onFetchSubitems(this, state["variantChoices"].length - 1, uniprotid);
	}

	onUpdateSelected(selectedItems) {
		var state = Object.assign({}, this.state);
		state.seedGenes = selectedItems;
		this.setState(state);
	}

	onSubitemChange(uniprotid, items) {
		var state = Object.assign({}, this.state);
		for (var i=0; i < state["variantChoices"].length; i++) {
			if (state["variantChoices"][i]["uniprotid"] == uniprotid) {
				state["variantChoices"][i]["selectedVariants"] = items;
			}
		}
		this.setState(state);
	}

	onSubmit(e) {
		e.preventDefault();
		if (!this.props.readonly) {
	        // get our form data out of state
	        $("#progressBlock").attr("style", "padding-top: 5px; display: inline-block;");

	        var data = Object.assign({}, this.state);
	        // data.seedGenes = [];
	        // for (var i = this.state.seedGenes.length - 1; i >= 0; i--) {
	        // 	data.seedGenes.push(this.state.seedGenes[i][0]);
	        // }

	        const url = "/corpus/" + this.props.modelId + "/new-model";
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
		for (var i = state.variantChoices.length - 1; i >= 0; i--) {
			if (this.state.variantChoices[i].uniprotid == itemId) {
				indexToRemove = i;
				break;
			}
		}
		state.variantChoices.splice(indexToRemove, 1);
		this.setState(state);
	}

	render() {
		var content = this.state.variantChoices.map((item, key) =>
			<VariantSelectionItem 
						   editable={true}
						   corpusId={this.props.corpusId}
						   selectionId={item["uniprotid"]}
						   selectionHGNC={item["hgnc"]}
						   selectionSynonyms={item["synonyms"]}
						   selectionText={String(item["uniprotid"]) + item["hgnc"]}
						   subitems={item["variants"]} 
						   onSubitemChange={this.onSubitemChange}
						   onRemove={this.onRemoveItem}
						   noSubitemsMessage={" Wild Type (no variants found, default selection)"}/>),
			dialog = null;

		var genesContent = (
			<GeneSelectionWidget 
				id={this.props.id + "geneSelectionWidget"}
		 		modelId={this.props.modelId}
		 		title={this.props.selectionDialogTitle}
		 		onFetchItems={this.props.onFetchItems}
		 		onUpdateSelected={(items) => this.onUpdateSelected(items)}
		 		filterItems={this.state.variantChoices.map((item) => item[0])}/>
		 );

		if (this.state.activeVariantSelectioDialog) {
			dialog = <VariantSelectionDialog
				id={this.props.id + "SelectionDialog"}
				modelId={this.props.modelId}
				title={this.props.selectionDialogTitle}
				onRemove={this.onRemoveVariantSelectionDialog}
				onFetchItems={this.props.onFetchItems}
				onItemClick={this.onVariantItemClick}
				filterItems={this.state.variantChoices.map((item) => item["uniprotid"])}/>;
		}

		return (
			<form id="instantationForm">
				<div className="col-md-8">
				    <div className="model-input-form-block">
						<div className="row form-row">
						      <label for="name">Name</label>
						      <input type="text" className="form-control"
						      		 name="name" 
						      		 id="name"
						      		 placeholder=""
						      		 value={this.state.name}
						      		 onChange={this.handleFieldChange("name")}/>
						</div>

						<div className="row form-row">
						    <label for="desc">Description</label>
						    <input type="text" className="form-control" name="desc"
						    	   placeholder=""
						    	   value={this.state.desc}
						    	   id="desc"
						    	   onChange={this.handleFieldChange("desc")}/>
						</div>

						<div className="row form-row">
							<label>Default rates</label>
						</div>
						<div className="row form-row">
							<div className="col-md-4">
							    <label for="default_bnd_rate">Binding rate</label>
							    <input type="text" className="form-control" name="default_bnd_rate"
							    	   placeholder=""
							    	   value={this.state.default_bnd_rate}
							    	   id="default_bnd_rate"
							    	   onChange={this.handleFieldChange("default_bnd_rate")}/>
							</div>
							<div className="col-md-4">
							    <label for="default_brk_rate">Unbinding rate</label>
							    <input type="text" className="form-control" name="default_brk_rate"
							    	   placeholder=""
							    	   value={this.state.default_brk_rate}
							    	   id="default_brk_rate"
							    	   onChange={this.handleFieldChange("default_brk_rate")}/>
							</div>
							<div className="col-md-4">
							    <label for="default_mod_rate">Modification rate</label>
							    <input type="text" className="form-control" name="default_mod_rate"
							    	   placeholder=""
							    	   value={this.state.default_mod_rate}
							    	   id="default_mod_rate"
							    	   onChange={this.handleFieldChange("default_mod_rate")}/>
							</div>
						</div>

						<div className="row form-row">
						    <label for="desc">Seed protoforms</label>
						    <p>Select a set of seed protoforms (all genes are selected by default)</p>
						    <div id="geneSelectionWidget">
								<div id={"geneSelection"}>
									<ul className="gene-selection-items">
										{genesContent}
									</ul>
								</div>
						    </div>
						</div>

						<div className="row form-row">
						    <label for="desc">Non-wild type variants</label>
						    <p>Select variants (wild-type variants are selected by default)</p>
						    <div id="variantSelectionWidget">
						    	{dialog}
								<div id={this.props.id + "Selection"}>
									<ul className="selection-items">
										{content}
									</ul>
								</div>
								<a type="button"
								   onClick={this.onSelectVariantButtonClick}
								   className="btn btn-default btn-md panel-button add-button add-enzyme-region">
								   <span className="glyphicon glyphicon-plus"></span> {this.props.buttonLabel}
								</a>
								<div className="row form-row">
									<div className="col-md-6">
										<div className="progress-block" style={{"padding-top": "10px", "display": "none"}}>
	          								<div id="progressMessage">Creating a new model...</div>
											<div id="loadingBlock"  className="loading-elements center-block">
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
												Create
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
