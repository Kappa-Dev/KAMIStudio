function removeAGTransition() {
    $(".sidebar-wrapper").addClass('notransition');
    $(".sidebar-content-wrapper").addClass('notransition');
    if ($(".sidebar-wrapper")[0]) {
        $(".sidebar-wrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
    } 
    if ($(".sidebar-content-wrapper")[0]) {
        $(".sidebar-content-wrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
    }
}

function addAGTransition() {
        if ($(".sidebar-wrapper")[0]) {
                $(".sidebar-wrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
        }
        $(".sidebar-wrapper").removeClass('notransition'); // Re-enable transitions

        if ($(".sidebar-content-wrapper")[0]) {
                $(".sidebar-content-wrapper")[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
        }
        $(".sidebar-content-wrapper").removeClass('notransition'); // Re-enable transitions
}

class ActionGraphWidget extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            agLabels: false
        }

        this.componentDidMount = this.componentDidMount.bind(this);

        this.toggleSideBar = this.toggleSideBar.bind(this);
        this.expandSideBar = this.expandSideBar.bind(this);
        this.onShowLabels = this.onShowLabels.bind(this);
    }

    onShowLabels() {
        var state = Object.assign({}, this.state);
        if (!state.agLabels) {
                state.agLabels = true;
                displayLabels(this.props.svgId);
        } else {
                state.agLabels = false;
                hideLabels(this.props.svgId);
        }
        this.setState(state);
    }

    expandSideBar() {
        var sidebar = $('#' + this.props.svgId + "SidebarWrapper");

        if (!sidebar.hasClass('selected')) {
            sidebar.addClass('selected');
            sidebar.removeClass('collapsed');
            $('#' + this.props.svgId + 'ContentWrapper').addClass('collapsed');
        }
    }

    toggleSideBar() {
         $('#' + this.props.svgId + "SidebarWrapper").toggleClass('collapsed');
         $('#' + this.props.svgId + 'ContentWrapper').toggleClass('collapsed');
    }

    componentDidMount() {
        visualizeAG(
            this.props.actionGraph, this.props.corpusId,
            this.props.webWorkerUrl, this.props.instantiated, this.props.readonly,
            this.props.saveGeneratedNodePos, {
                "nodeClick": () => this.expandSideBar()
            },
            this.props.onShowVariants,
            this.props.onShowNuggets);
    }

    render() {
        var boxes = [
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

        return [
            <div id={this.props.svgId + "SidebarWrapper"} className="sidebar-wrapper collapsed">
                <div id={this.props.svgId + "AgSidebar"} className="ag-sidebar">
                    <div id={this.props.svgId + "GraphInfoBoxes"}
                         className={"graph-info-boxes" + (this.props.instantiated ? " instantiated": "")}>
                            {boxes}
                    </div>
                </div>
            </div>,
            <div id={this.props.svgId + "ContentWrapper"} className="sidebar-content-wrapper">
                <div id={this.props.svgId + "Content"} className="ag-content">
                    <div className="action-graph-view">
                        <button className="btn btn-link btn-lg"
                                onClick={this.toggleSideBar}
                                id="collapseButton"><span className="glyphicon glyphicon-menu-hamburger"></span></button>
                        <button id="showLabelsButton"
                                onClick={this.onShowLabels}
                                type="button"
                                className="btn btn-default btn-md panel-button"
                                style={{"float": "right"}}>{this.state.agLabels ? "Hide labels" : "Show labels"}</button>
                        <button id="saveLayoutButton" type="button" className="btn btn-default btn-md panel-button nugget-list-view" style={{"float": "right"}} disabled><span className="glyphicon glyphicon-floppy-disk"></span> Save layout</button>
                    </div>

                    <svg id={this.props.svgId} preserveAspectRatio="xMinYMin meet" viewBox="0 0 700 500" 
                        style={{
                            "width": "100%",
                            "height": "400pt",
                            "display": (this.props.actionGraph) ? "inline-block" : "none"
                        }}></svg>
                    <div className="row">
                        <div className="col-sm-6" style={{"marginBottom": "20px"}}>
                            <p id="ctrlClickMessage" style={{"marginLeft": "10px", "display": "none"}}>CTRL+click to select multiple elements</p>
                        </div>
                    </div>
                </div>
            </div>
        ];
    }
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
            nuggetsViewMode: null,
            preselectedDefinition: null
        }

        this.switchToKnowledgeTab = this.switchToKnowledgeTab.bind(this);
        this.switchToModelsTab = this.switchToModelsTab.bind(this);
        this.switchToHistoryTab = this.switchToHistoryTab.bind(this);
        this.switchToAGTab = this.switchToAGTab.bind(this);
        this.switchToNuggetsTab = this.switchToNuggetsTab.bind(this);
        this.switchToDefinitionsTab = this.switchToDefinitionsTab.bind(this);

        this.loadModels = this.loadModels.bind(this);
        this.onFetchActionGraph = this.onFetchActionGraph.bind(this);

        this.showNuggetList = this.showNuggetList.bind(this);
        this.showNuggetTable = this.showNuggetTable.bind(this);    

        this.onShowNuggets = this.onShowNuggets.bind(this);
        this.onShowVariants = this.onShowVariants.bind(this);   
        this.onRemoveVariant = this.onRemoveVariant.bind(this);      
    }

    onRemoveVariant(definitionId, productName) {
        // send a removal request
        // getData(
        //     this.props.corpusId + "/remove-variant/" + definitionId +
        //     "/" + productName);

        var state = Object.assign({}, this.state),
            indexToRemove;

        for (var i = state.definitions[definitionId]["variants"].length - 1; i >= 0; i--) {
            if (state.definitions[definitionId]["variants"][i][0] == productName) {
                indexToRemove = i;
                break;
            }
        }
        // update preview
        state.definitions[definitionId]["variants"].splice(indexToRemove, 1);
        this.setState(state);
    }

    onShowNuggets(nodeId) {

    }

    onShowVariants(nodeId, uniprotid) {
        this.switchToDefinitionsTab(uniprotid);
    }

    onFetchActionGraph(callback=null) {
        getActionGraph(
            this.props.corpusId,
            this.props.webWorkerUrl,
            false,
            this.props.readonly,
            (data) => {
                var state = Object.assign({}, this.state);
                state.actionGraph = data;
                this.setState(state);

                if (callback) {
                    callback();
                }
            }
        );
    }

    switchToKnowledgeTab() {
        if (this.state.activeInnerTab == "ag") {
            addAGTransition();
        }
        var state = Object.assign({}, state);
        state.activeTab = "knowledge";
        this.setState(state); 
    }

    loadModels() {
        if (!this.state.models) {
            getData(
            "/corpus/" + this.props.corpusId + "/models",
            (data) => {
                var state = Object.assign({}, state);
                state.models = data.items;
                this.setState(state);
            });
        } 
    }

    switchToModelsTab() {
        this.loadModels();
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

    switchToDefinitionsTab(selectedUniprot=null) {
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
        if (selectedUniprot) {
            state.preselectedDefinition = selectedUniprot;
        }
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
                this.onFetchActionGraph();
            }
        }

        if (this.props.modelId) {
            this.loadModels();
        }

        var globalTabNavs = (
            <ul className="nav nav-tabs" role="tablist">
                <li className={"nav-item" + ((this.state.activeTab == "knowledge") ? " active" : "")}>
                    <a id="switchToKnowledgeTab"
                         className={"nav-link global" + ((this.state.activeTab == "knowledge") ? " active" : "")}
                         onClick={this.switchToKnowledgeTab} role="tab"><h4>Knowledge</h4></a>
                </li>
                <li className={"nav-item" + ((this.state.activeTab == "models") ? " active" : "")}>
                    <a id="switchToModelsTab"
                         className={"nav-link global" + ((this.state.activeTab == "models") ? " active" : "")}
                         onClick={this.switchToModelsTab} role="tab"><h4>Models</h4></a>
                </li>
                <li className={"nav-item" + ((this.state.activeTab == "history") ? " active" : "")}>
                    <a id="switchToHistory"
                         className={"nav-link global" + ((this.state.activeTab == "history") ? " active" : "")}
                         onClick={this.switchToHistoryTab} role="tab"><h4>Revision history</h4></a>
                </li>
            </ul>
        );
        var knowledgeNavs = (
            <ul className="nav nav-pills">
                <li className={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) ? "active" : ""}>
                    <a id="switchToAGTab"
                         className="nav-link inner active"
                         onClick={this.switchToAGTab} role="tab">
                            {"Action graph (" + (this.props.emptyCorpus ? "empty" : (this.props.agNodesCount + " nodes)"))}</a>
                </li>
                <li className={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "nuggets")) ? "active" : ""}>
                    <a id="switchToNuggetsTab"
                         className="nav-link inner"
                         onClick={this.switchToNuggetsTab}
                         role="tab">
                            {"Nuggets (" + (this.props.emptyCorpus ? "0" : (this.props.nuggetsCount + " nuggets)"))}
                    </a>
                </li>
                <li className={((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "definitions")) ? "active" : ""}>
                    <a id="switchToDefinitionsTab"
                         className="nav-link inner"
                         role="tab"
                         onClick={() => this.switchToDefinitionsTab()}>
                            {"Protein definitions (" + (this.props.emptyCorpus ? "0" : (this.props.definitionsCount + ")"))}
                    </a>
                </li>
            </ul>
        );
            
        var agView;
        if (this.props.emptyCorpus) {
            agView = "Action graph is empty";
        } else {
            if (this.state.actionGraph) {
                agView = <ActionGraphWidget corpusId={this.props.corpusId}
                                            instantiated={false}
                                            webWorkerUrl={this.props.webWorkerUrl} 
                                            actionGraph={this.state.actionGraph}
                                            readonly={this.props.readonly}
                                            svgId={"actionGraphSvg"}
                                            onShowNuggets={this.onShowNuggets}
                                            onShowVariants={this.onShowVariants} />
            } else {
                agView = (
                    <div className="progress-block">
                        <div id="progressMessage" className="small-faded">Retrieving action graph from the database... It may take a moment.</div>
                        <div id="loadingBlock" className="loading-elements center-block">
                            <div id="loader"></div>
                        </div>
                    </div>
                );
            }
        }

        var nuggetsView;
        if (this.props.emptyCorpus) {
            nuggetsView = "Corpus does not contain any nuggets";
        } else {
            var nuggetsContent, preview = null;
            if (this.state.nuggets) {
                if (this.state.nuggetsViewMode == "list") {
                    var nuggetList = [];

                    for (var k in this.state.nuggets) {
                        nuggetList.push(
                            [k, this.state.nuggets[k][1], this.state.nuggets[k][0]]);
                    }
                    nuggetsContent = (
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
                    nuggetsContent = (
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
          } else {
            nuggetsContent = (
                <div id="nuggetsProgressBlock">
                    <div id="progressMessage" className="small-faded">Loading nuggets...</div>
                        <div id="loadingBlock" className="loading-elements center-block" style={{"marginTop": "20pt"}}>
                                <div id="loader"></div>
                        </div> 
                </div>
            );
          }
            nuggetsView = (
                <div className="row">
                    <div className="col-sm-6">
                        <div className="row">
                            <div className="col-sm-6">
                                <h3>Nuggets</h3>
                            </div>
                            <div className="col-sm-6">
                                <div className="nuggets-view">
                                    <a type="button"
                                         id="selectNuggetListView"
                                         className={"btn btn-default btn-md panel-button nugget-list-view" + ((this.state.nuggetsViewMode == "list") ? " active": "")} 
                                         onClick={this.showNuggetList}
                                         style={{"marginLeft": "10px"}}>
                                         <span className="glyphicon glyphicon-list"></span>
                                    </a>
                                    <a type="button"
                                         id="selectNuggetTableView"
                                         className={"btn btn-default btn-md panel-button nugget-table-view" + ((this.state.nuggetsViewMode == "table") ? " active": "")}
                                         onClick={this.showNuggetTable}>
                                         <span className="glyphicon glyphicon-equalizer"></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div id="nuggetView">
                            {nuggetsContent}
                        </div>
                        <div id="nuggetDialogView" style={{"height": "100%"}}></div>
                    </div>
                    
                    <div className="col-sm-6">
                        <div id="nuggetViewWidget">{preview}</div>
                    </div>
                </div>
            );
        }

        var definitionsView;
        if (this.props.definitionsCount == 0) {
            definitionsView = "Corpus does not contain any variant definitions";
        } else {
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
                definitionsView = (
                    <DefinitionView corpusId={this.props.corpusId}
                                    readonly={this.props.readonly}
                                    preselectedDefinition={this.state.preselectedDefinition}
                                    onRemoveVariant={this.onRemoveVariant}
                                    definitions={data} />
                );
            } else {
                definitionsView = (
                    <div className="progress-block">
                        <div id="progressMessage" className="small-faded">Loading definitions...</div>
                            <div id="loadingBlock" className="loading-elements center-block" style={{"marginTop": "20pt"}}>
                                <div id="loader"></div>
                            </div> 
                    </div>
                );
            }
        }

        var knowledgeTabs = (
                <div className="tab-content">
                    <div className={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) ? " active" : "")} id="action_graph" role="tabpanel">
                        <div id="agView">
                                {agView}
                        </div>
                    </div>

                    <div className={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "nuggets")) ? " active" : "")}
                             id="nuggets" role="tabpanel">
                         {nuggetsView}
                    </div>

                    <div className={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "definitions")) ? " active" : "")}
                             id="definitions" role="tabpanel">
                         {definitionsView}
                    </div>
                </div>
        );

        var knowledgeTabContent = [knowledgeNavs, knowledgeTabs];
        var modelCreationButtons;
        if (!this.props.readonly) {
            modelCreationButtons = [
                <a href={this.props.importModelUrl} className="btn btn-primary btn-md panel-button-right instantiation">Import model</a>,
                <a href={this.props.newModelUrl} className="btn btn-primary btn-md panel-button-right instantiation">New model</a>
            ];
        }
        var modelTabHeader = (
            <div className="row">
              <div className="col-md-4">
                <h2 className="collection-brand" style={{"margin-top": "0pt"}}>Models</h2>
              </div>
              <div className="col-md-8">
                <div className="collection-buttons">
                    {modelCreationButtons}
                </div>
              </div>
            </div> 
        );
        var modelsTabContent = (
            <div className="progress-block"
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
                                          corpusUrl={this.props.corpusUrl}
                                          readonly={this.props.readonly}
                                          webWorkerUrl={this.props.webWorkerUrl}
                                          preselected={this.props.modelId}
                                          onFetchActionGraph={this.onFetchActionGraph} />
        }
        var globalTabsContent = (
            <div className="row">
                <div className="col-md-2"></div>
                <div className="col-md-8">
                    <div className="tab-content" id="globalTabs">
                        <div className={"tab-pane global" + ((this.state.activeTab == "knowledge") ? " active" : "")}
                                 id="knowledgeTab"
                                 role="tabpanel">
                                 {knowledgeTabContent}
                        </div>

                        <div className={"tab-pane global" + ((this.state.activeTab == "models") ? " active" : "")}
                                 id="modelsTab" role="tabpanel">
                                 {modelTabHeader}
                                 {modelsTabContent}
                        </div>

                        <div className={"tab-pane global" + ((this.state.activeTab == "history") ? " active" : "")}
                                 id="historyTab" role="tabpanel">
                        </div>
                    </div>
                </div>
                <div className="col-md-2"></div>
            </div>
        );
        return (
            <div className="container-fluid tabs">
                {globalTabNavs}
                {globalTabsContent}
            </div>
        );
    }
}