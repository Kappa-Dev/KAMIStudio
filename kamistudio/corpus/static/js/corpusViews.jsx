function removeAGTransition() {
		$("#agSidebarWrapper").addClass('notransition');
		$("#agContentWrapper").addClass('notransition');
		if ($("#agSidebarWrapper")[0]) {
				$("#agSidebarWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
		} 
		if ($("#agContentWrapper")[0]) {
			 $("#agContentWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
		}
}

function addAGTransition() {
		if ($("#agSidebarWrapper")[0]) {
				$("#agSidebarWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
		}
		$("#agSidebarWrapper").removeClass('notransition'); // Re-enable transitions

		if ($("#agContentWrapper")[0]) {
				$("#agContentWrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
		}
		$("#agContentWrapper").removeClass('notransition'); // Re-enable transitions
}

class CorpusView extends React.Component {

		constructor(props) {
				super(props);

				this.state = {
						activeTab: this.props.modelId ? "models" : "knowledge",
						activeInnerTab: "ag",
						actionGraph: null,
						definitions: null,
						nuggets: null,
						nuggetsViewMode: null
				}

				this.switchToKnowledgeTab = this.switchToKnowledgeTab.bind(this);
				this.switchToModelsTab = this.switchToModelsTab.bind(this);
				this.switchToHistoryTab = this.switchToHistoryTab.bind(this);
				this.switchToAGTab = this.switchToAGTab.bind(this);
				this.switchToNuggetsTab = this.switchToNuggetsTab.bind(this);
				this.switchToDefinitionsTab = this.switchToDefinitionsTab.bind(this);

				this.showNuggetList = this.showNuggetList.bind(this);
				this.showNuggetTable = this.showNuggetTable.bind(this);
				
		}

		expandSideBar() {
				var sidebar = $('#agSidebarWrapper');

				if (!sidebar.hasClass('selected')) {
						sidebar.addClass('selected');
						sidebar.removeClass('collapsed');
						$('#agContentWrapper').addClass('collapsed');
				}
		}

		toggleSideBar() {
			 $('#agSidebarWrapper').toggleClass('collapsed');
			 $('#agContentWrapper').toggleClass('collapsed');
		}

		switchToKnowledgeTab() {
			 if (this.state.activeInnerTab == "ag") {
					addAGTransition();
			 }
			 var state = Object.assign({}, state);
			 state.activeTab = "knowledge";
			 this.setState(state); 
		}

		switchToModelsTab() {
				if (!this.state.models) {
					getData(
		        "/corpus/" + this.props.corpusId + "/models",
		        (data) => {
		        	var state = Object.assign({}, state);
							state.models = data.items;
							this.setState(state);
		        });
				}
				removeAGTransition();
				var state = Object.assign({}, state);
				state.activeTab = "models";
				this.setState(state); 
		}

		switchToHistoryTab() {
				removeAGTransition();
				var state = Object.assign({}, state);
				state.activeTab = "history";
				this.setState(state); 
		}

		switchToAGTab() {
				addAGTransition();
				var state = Object.assign({}, state);
				state.activeInnerTab = "ag";
				this.setState(state); 
		}

		switchToNuggetsTab() {
				if (!this.state.nuggets) {
						// fetch nugget list
						getData(
								this.props.corpusId + "/nuggets",
								(data) => {
										var state = Object.assign({}, this.state);
										state.nuggets = data["nuggets"];
										this.setState(state);
								}
						);
				}
				removeAGTransition();
				var state = Object.assign({}, state);
				state.activeInnerTab = "nuggets";
				state.nuggetsViewMode = "list";
				this.setState(state); 
		}

		switchToDefinitionsTab() {
				if (!this.state.definitions) {
						getData(
								this.props.corpusId + "/definitions",
								(data) => {
										var state = Object.assign({}, this.state);
										state.definitions = data;
										this.setState(state);
								});
				}
				removeAGTransition();
				var state = Object.assign({}, state);
				state.activeInnerTab = "definitions";
				this.setState(state); 
		}

		showNuggetList() {
				var state = Object.assign({}, state);
				state.nuggetsViewMode = "list";
				this.setState(state); 
		}

		showNuggetTable() {
				if (!this.state.geneAdjacency) {
						// getch gene adjacency data
						getData(
							this.props.corpusId + "/get-gene-adjacency",
							(data) => {
									var state = Object.assign({}, this.state);
									state.geneAdjacency = data["interactions"];
									state.geneLabels = data["geneLabels"];
									this.setState(state);
							});
				}
				
				var state = Object.assign({}, state);
				state.nuggetsViewMode = "table";
				this.setState(state); 
		}

		render() {
				if (this.state.activeTab == "knowledge") {
					if ((this.state.activeInnerTab == "ag") && (!this.state.actionGraph)) {
						getActionGraph(
								this.props.corpusId,
								this.props.webWorkerUrl,
								false,
								this.props.readonly,
								(data) => {
										var state = Object.assign({}, this.state);
										state.actionGraph = data;
										this.setState(state);

										visualizeAG(
												data, this.props.corpusId,
												this.props.webWorkerUrl, false, this.props.readonly);
								}
						);
					}
				}

				var globalTabNavs = (
						<ul class="nav nav-tabs" role="tablist">
							<li class={"nav-item" + ((this.state.activeTab == "knowledge") ? " active" : "")}>
								<a id="switchToKnowledgeTab"
									 class={"nav-link global" + ((this.state.activeTab == "knowledge") ? " active" : "")}
									 onClick={this.switchToKnowledgeTab} role="tab"><h4>Knowledge</h4></a>
							</li>
							<li class={"nav-item" + ((this.state.activeTab == "models") ? " active" : "")}>
								<a id="switchToModelsTab"
									 class={"nav-link global" + ((this.state.activeTab == "models") ? " active" : "")}
									 onClick={this.switchToModelsTab} role="tab"><h4>Models</h4></a>
							</li>
							<li class={"nav-item" + ((this.state.activeTab == "history") ? " active" : "")}>
								<a id="switchToHistory"
									 class={"nav-link global" + ((this.state.activeTab == "history") ? " active" : "")}
									 onClick={this.switchToHistoryTab} role="tab"><h4>Revision history</h4></a>
							</li>
						</ul>
				);
				var knowledgeNavs = (
						<ul class="nav nav-pills">
							<li class={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) ? "active" : ""}>
								<a id="switchToAGTab"
									 class="nav-link inner active"
									 onClick={this.switchToAGTab} role="tab">
										{"Action graph (" + (this.props.emptyCorpus ? "empty" : (this.props.agNodesCount + " nodes)"))}</a>
							</li>
							<li class={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "nuggets")) ? "active" : ""}>
								<a id="switchToNuggetsTab"
									 class="nav-link inner"
									 onClick={this.switchToNuggetsTab}
									 role="tab">
										{"Nuggets (" + (this.props.emptyCorpus ? "0" : (this.props.nuggetsCount + " nuggets)"))}
								</a>
							</li>
							<li class={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "definitions")) ? "active" : ""}>
								<a id="switchToDefinitionsTab"
									 class="nav-link inner"
									 role="tab"
									 onClick={this.switchToDefinitionsTab}>
										{"Protein definitions (" + (this.props.emptyCorpus ? "0" : (this.props.definitionsCount + ")"))}
								</a>
							</li>
						</ul>
				);
				var boxes;
				if (this.state.actionGraph) {
						boxes = [
								<ElementInfoBox id="graphElement" 
													 items={[]}
													 fixedtooltip={true}/>,
								 <MetaDataBox id="metaData"
															items={[]}
															fixedtooltip={true}/>,
								 <SemanticsBox id="semantics"
														 items={[]}
														 fixedtooltip={true}/>,
						];
				}
				var agView;
				if (this.props.emptyCorpus) {
						agView = "Action graph is empty";
				} else {
						agView = [
								<div id="agSidebarWrapper" class="collapsed">
									<div id="agSidebar">
										<div id="graphInfoBoxes">
												{boxes}
										</div>
									</div>
								</div>,
								<div id="agContentWrapper">
									<div id="agContent">
										<div class="action-graph-view">
											<button class="btn btn-link btn-lg"
															onClick={this.toggleSideBar}
															id="collapseButton"><span class="glyphicon glyphicon-menu-hamburger"></span></button>
											<button id="showLabelsButton" onClick="showAGLabels();"
															type="button"
															class="btn btn-default btn-md panel-button"
															style={{"float": "right"}}>Show labels</button>
											<button id="saveLayoutButton" type="button" class="btn btn-default btn-md panel-button nugget-list-view" style={{"float": "right"}} disabled><span class="glyphicon glyphicon-floppy-disk"></span> Save layout</button>
										</div>

										<div id="progressBlock">
											<div id="progressMessage" class="small-faded">Retrieving action graph from the database... It may take a moment.</div>
											<div id="loadingBlock" class="loading-elements center-block">
												<div id="loader"></div>
											</div>
										</div>

										<svg id="actionGraphSvg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 700 500"
												 style={{
														"width": "100%",
														"height": "400pt",
														"display": (this.state.actionGraph) ? "inline-block" : "none"
												}}></svg>
										<div class="row">
											<div class="col-sm-6" style={{"marginBottom": "20px"}}>
												<p id="ctrlClickMessage" style={{"marginLeft": "10px", "display": "none"}}>CTRL+click to select multiple elements</p>
											</div>
										</div>
									</div>
								</div>
						];
				}

				var nuggetsView;
				if (this.props.emptyCorpus) {
						nuggetsView = "Corpus does not contain any nuggets";
				} else {
						var content = (
								<div id="progressBlock">
									<div id="progressMessage" class="small-faded">Loading nuggets...</div>
										<div id="loadingBlock" class="loading-elements center-block" style={{"marginTop": "20pt"}}>
												<div id="loader"></div>
										</div> 
								</div>
						);
						var preview = null;
						if ((this.state.nuggetsViewMode == "list") && (this.state.nuggets)) {
								var nuggetList = [];

								for (var k in this.state.nuggets) {
										nuggetList.push(
											[k, this.state.nuggets[k][1], this.state.nuggets[k][0]]);
								}
								content = (
										<NuggetListView 
												items={nuggetList}
												onItemClick={viewNugget(
														this.props.corpusId, false, this.props.readonly,
														showDeleteConfirmationDialog(
																this.props.corpusId, nuggetList, false, this.props.readonly))}
												instantiated={false}
												readonly={this.props.readonly.readonly}/>
								);
								preview = (
									<NuggetPreview instantiated={false}
																 readonly={this.props.readonly}/>
								);
						} else if ((this.state.nuggetsViewMode == "table") && (this.state.geneAdjacency)) {
								content = (
										<NuggetTable
												onMounting={() => drawNuggetTable(
															this.props.corpusId, this.state.geneAdjacency,
															this.state.geneLabels, false, this.props.readonly)} 
												geneAdjacency={this.state.geneAdjacency}
												onItemClick={
														viewNugget(this.props.corpusId, false, this.props.readonly)}
												instantiated={false} />
								);
								preview = (
									<NuggetPreview instantiated={false}
																 readonly={this.props.readonly}/>
								);
						}
						nuggetsView = (
							<div class="row">
									<div class="col-sm-6">
											<div class="row">
												<div class="col-sm-6">
													<h3>Nuggets</h3>
												</div>
												<div class="col-sm-6">
													<div class="nuggets-view">
														<a type="button"
															 id="selectNuggetListView"
															 class={"btn btn-default btn-md panel-button nugget-list-view" + ((this.state.nuggetsViewMode == "list") ? " active": "")} 
															 onClick={this.showNuggetList}
															 style={{"marginLeft": "10px"}}>
															 <span class="glyphicon glyphicon-list"></span>
														</a>
														<a type="button"
															 id="selectNuggetTableView"
															 class={"btn btn-default btn-md panel-button nugget-table-view" + ((this.state.nuggetsViewMode == "table") ? " active": "")}
															 onClick={this.showNuggetTable}>
															 <span class="glyphicon glyphicon-equalizer"></span>
														</a>
													</div>
												</div>
											</div>
											<div id="nuggetView">
												{content}
											</div>
											<div id="nuggetDialogView" style={{"height": "100%"}}></div>
									</div>
									
									<div class="col-sm-6">
										<div id="nuggetViewWidget">{preview}</div>
									</div>
							</div>
						);
				}

				var definitionsView;
				if (this.props.definitionsCount == 0) {
						definitionsView = "Corpus does not contain any variant definitions";
				} else {
						var content = (
								<div id="progressBlock">
									<div id="progressMessage" class="small-faded">Loading definitions...</div>
										<div id="loadingBlock" class="loading-elements center-block" style={{"marginTop": "20pt"}}>
												<div id="loader"></div>
										</div> 
								</div>
						);

						if (this.state.definitions) {
							  var data = Object.assign({}, this.state.definitions);
							  var labels;
					    	for (var k in data) {
					    		labels = [data[k].attrs["uniprotid"].data[0]];
					    		if ("hgnc_symbol" in data[k].attrs) {
										labels.push(data[k].attrs["hgnc_symbol"].data[0]);
									} 
									if ("synonyms" in data[k].attrs) {
										labels = labels.concat(data[k].attrs["synonyms"].data);
									}
									data[k].label = labels.join(", ");
					    	}
								content = (
										<DefinitionList 
					            items={this.state.definitions}
					            onItemClick={viewDefinition(
					            	this.props.corpusId, this.props.readonly,
					            	data)}/>
								);
								preview = <DefinitionPreview editable={false}/>;
						}
						var preview = null;
						definitionsView = [
								<div class="col-sm-6">
									<h3>Definitions</h3>
									<div id="definitionView">{content}</div>
								</div>,
								<div class="col-sm-6">
									<div id="definitionViewWidget">
										{preview}
									</div>
								</div>
						];
				}

				var knowledgeTabs = (
						<div class="tab-content">
								<div class={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) ? " active" : "")} id="action_graph" role="tabpanel">
										<div id="agView">
												{agView}
										</div>
								</div>

								<div class={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "nuggets")) ? " active" : "")}
										 id="nuggets" role="tabpanel">
										 {nuggetsView}
								</div>
		
								<div class={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "definitions")) ? " active" : "")}
										 id="definitions" role="tabpanel">
										 {definitionsView}
								</div>
						</div>
				);

				var knowledgeTabContent = [knowledgeNavs, knowledgeTabs];

				var modelsTabContent = (
					<div id="progressBlock"
             style={{"paddingTop": "0pt", "marginTop": "20pt"}}>
	            <div id="progressMessage">Loading...</div>
	            <div id="loadingBlock" className="loading-elements center-block"
	                  style={{"marginBottom": "20pt"}}>
	                <div id={"loaderModel"}></div>
	            </div>
	        </div>
				);
				if (this.state.models) {
					modelsTabContent = <ModelList items={this.state.models}
																				actionGraph={this.state.actionGraph}
																				corpusId={this.props.corpusId}
																				readonly={this.props.readonly}
																				preselected={this.props.modelId} />
				}
				var globalTabsContent = (
						<div class="row">
								<div class="col-md-2"></div>
								<div class="col-md-8">
										<div class="tab-content" id="globalTabs">
												<div class={"tab-pane global" + ((this.state.activeTab == "knowledge") ? " active" : "")}
														 id="knowledgeTab"
														 role="tabpanel">
														 {knowledgeTabContent}
												</div>

												<div class={"tab-pane global" + ((this.state.activeTab == "models") ? " active" : "")}
														 id="modelsTab" role="tabpanel">
														 {modelsTabContent}
												</div>

												<div class={"tab-pane global" + ((this.state.activeTab == "history") ? " active" : "")}
														 id="historyTab" role="tabpanel">
												</div>
										</div>
								</div>
								<div class="col-md-2"></div>
						</div>
				);
				return (
						<div class="container-fluid tabs">
								{globalTabNavs}
								{globalTabsContent}
						</div>
				);
		}
}