class CorpusView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeTab: this.props.modelId ? "models" : "knowledge",
            activeInnerTab: "ag",
            actionGraph: null,
            nuggetList: null,
            definitions: null
        }

        this.switchToKnowledgeTab = this.switchToKnowledgeTab.bind(this);
        this.switchToModelsTab = this.switchToModelsTab.bind(this);
        this.switchToHistoryTab = this.switchToHistoryTab.bind(this);
        this.switchToAGTab = this.switchToAGTab.bind(this);
        this.switchToNuggetsTab = this.switchToNuggetsTab.bind(this);
        this.switchToDefinitionsTab = this.switchToDefinitionsTab.bind(this);
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
       var state = Object.assign({}, state);
       state.activeTab = "knowledge";
       this.setState(state); 
    }

    switchToModelsTab() {
       var state = Object.assign({}, state);
       state.activeTab = "models";
       this.setState(state); 
    }

    switchToHistoryTab() {
       var state = Object.assign({}, state);
       state.activeTab = "history";
       this.setState(state); 
    }

    switchToAGTab() {
       var state = Object.assign({}, state);
       state.activeInnerTab = "ag";
       this.setState(state); 
    }

    switchToNuggetsTab() {
       var state = Object.assign({}, state);
       state.activeInnerTab = "nuggets";
       this.setState(state); 
    }

    switchToDefinitionsTab() {
       var state = Object.assign({}, state);
       state.activeInnerTab = "definitions";
       this.setState(state); 
    }

    render() {
        if ((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) {
            if (!this.state.actionGraph) {
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
        var knowledgeTabs = (
            <div class="tab-content">
                <div class={"tab-pane" + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "ag")) ? " active" : "")} id="action_graph" role="tabpanel">
                    <div id="agView">
                        {agView}
                    </div>
                </div>

                <div class={"tab-pane" +  + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "nuggets")) ? " active" : "")}
                     id="nuggets" role="tabpanel">

                </div>
    
                <div class={"tab-pane" +  + (((this.state.activeTab == "knowledge") && (this.state.activeInnerTab == "definitions")) ? " active" : "")}
                     id="definitions" role="tabpanel">
                </div>
            </div>
        );

        var knowledgeTabContent = [knowledgeNavs, knowledgeTabs];
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