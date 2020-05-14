
function insertLoader(instantiated, father) {
    /* Turn on the loader of the nuggets view */
    ReactDOM.render(
        <div id="progressBlock"
             style={{"paddingTop": "0pt", "marginTop": "20pt"}}>
            <div id="progressMessage">Loading...</div>
            <div id="loadingBlock" className="loading-elements center-block"
                  style={{"marginBottom": "20pt"}}>
                <div id={instantiated ? "loaderModel" : "loader"}></div>
            </div>
        </div>,
        document.getElementById(father)
    );
}


function showModelList(corpusId, modelId=null, readonly=false) {
    /* Handler of model list */

    insertLoader(true, "modelsView");
    getData(
        "/corpus/" + corpusId + "/models",
        renderModelList(corpusId, modelId, readonly));

}

function renderModelList(corpusId, modelId, readonly) {
    return function (data) {
        var component = ReactDOM.render(
            <ModelList items={data.items} corpusId={corpusId} readonly={readonly} />,
            document.getElementById("modelsView")
        );
        if (modelId) {
            component.setSelectedItemById(modelId);
        }
    }
}

class ModelList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: null,
            loadedFullGeneData: false,
            geneData: null
        };

        this.onItemClick = this.onItemClick.bind(this);
        this.setSelectedModel = this.setSelectedModel.bind(this);
        this.fetchGeneData = this.fetchGeneData.bind(this);
        this.loadAllGenes = this.loadAllGenes.bind(this);
        this.onSeedGenesUpdate = this.onSeedGenesUpdate.bind(this);
        this.onMetaDataUpdate = this.onMetaDataUpdate.bind(this);
        this.onRatesUpdate = this.onRatesUpdate.bind(this);
        this.updateModel = this.updateModel.bind(this);
    }

    updateModel(modelId, updateDict) {
        postData(
            {"updated": updateDict},
            "/corpus/" + this.props.corpusId + "/update-model/" + modelId);
    }

    onMetaDataUpdate(updatedData) {
        var state = Object.assign({}, this.state),
            dataQuery = {};
        for (var k in updatedData) {
            dataQuery["meta_data." + k] = updatedData[k];
            state.selected["meta_data"][k] = updatedData[k];

        }
        this.updateModel(
            this.state.selected["id"], dataQuery);
        this.setState(state);
    }

    onRatesUpdate(updatedData) {
        console.log(updatedData);
        var state = Object.assign({}, this.state);
        for (var k in updatedData) {
            state.selected[k] = updatedData[k];
        }
        this.updateModel(
            this.state.selected["id"], updatedData);
        this.setState(state);
    }

    onSeedGenesUpdate(newSeedGenes) {
        var state = Object.assign({}, this.state);
        state.selected["seed_genes"] = newSeedGenes;
        this.updateModel(
            state.selected["id"], {"seed_genes": newSeedGenes});
        this.setState(state);
    }

    loadAllGenes(element) {
        // Load all protoforms in the corpus
        if (!this.state.loadedFullGeneData) {
            var genes = {},
                url = "/corpus/" + this.props.corpusId + "/genes";
            getData(
                url,
                (data) => {
                    element.setState({
                        initialItems: data["genes"],
                        items: data["genes"]
                    });
                    // update my state
                    var geneData = {};
                    for (var i = data["genes"].length - 1; i >= 0; i--) {
                        geneData[data["genes"][i][0]] = [
                            data["genes"][i][1],
                            data["genes"][i][2]
                        ];
                    }
                    var state = Object.assign({}, this.state);
                    state.geneData = geneData;
                    state.loadedFullGeneData = true;
                    this.setState(state);
                });
        }
    }

    onItemClick(item) {
        this.setSelectedModel(item);
    }

    setSelectedModel(item) {
        var state = Object.assign({}, this.state);
        state.selected = item;
        this.setState(state);
        this.fetchGeneData(item);
    }

    fetchGeneData(item) {
        if (!this.state.loadedFullGeneData) {
            var url = "/corpus/" + this.props.corpusId + "/get-gene-data";
            postData(
                {"uniprots": item["seed_genes"]},
                url,
                (data) => {
                    var state = Object.assign({}, this.state);
                    state.geneData = data["items"];
                    this.setState(state);
                });
        }
    }

    setSelectedItemById(itemId) {
        for (var i = this.props.items.length - 1; i >= 0; i--) {
            if (this.props.items[i]["id"] == itemId) {
                this.setSelectedModel(this.props.items[i]);
                break;
            }
        }
    }

    render() {
        var content, modelPreview = null;

        var selectedId = null;
        if (this.state.selected) {
            selectedId = this.state.selected["id"];
        } 

        // Generate a table with models
        if (this.props.items.length > 0) {
            var itemComponents = this.props.items.map(
                (item) => <tr onClick={() => this.onItemClick(item)} className={item["id"] == selectedId ? "selected" : ""}>
                            <th scope="row">
                                <a>{item["meta_data"]["name"]}</a>
                            </th>
                            <td><div className="small-faded">{item["meta_data"]["desc"]}</div></td>
                            <td>{item["last_modified"]}</td>
                          </tr>);
            content = (
                <div className="table-responsive">
                    <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Last modified</th>
                      </tr>
                    </thead>
                      <tbody>
                        {itemComponents}
                      </tbody>
                  </table>
                </div>
            );
        } else {
            content = <div className="faded" style={{"marginBottom": "10pt"}}>No models</div>;
        }

        // If there is a model selected generate a preview
        if (this.state.selected) {
            // modelPreview = <ModelView id={this.state.selected["id"]}
            //                           name={this.state.selected["meta_data"]["name"]}
            //                           desc={this.state.selected["meta_data"]["desc"]}/>;
            modelPreview = (
                <ModelView readonly={this.props.readonly}
                           geneData={this.state.geneData}
                           model={this.state.selected} 
                           onSeedGenesUpdate={this.onSeedGenesUpdate}
                           onLoadAllGenes={this.loadAllGenes}
                           corpusId={this.props.corpusId}
                           onMetaDataUpdate={this.onMetaDataUpdate}
                           onRatesUpdate={this.onRatesUpdate}/>
            );
        }

        return [ 
            <div className="home-collection instantiated">
                {content}
            </div>,
            modelPreview
        ];
    }
}

class ModelView extends React.Component {

    constructor(props) {
        super(props);

        this.showConfirmDeletion = this.showConfirmDeletion.bind(this);
        this.onConfirmDelete = this.onConfirmDelete.bind(this);
        this.onCancelDelete = this.onCancelDelete.bind(this);
    }

    onConfirmDelete() {
        getData(
            "/corpus/" + this.props.corpusId + "/delete-model/" + this.props.model["id"],
            () => showModelList(this.props.corpusId, null, this.props.readonly));
        
    }    

    onCancelDelete() {
      ReactDOM.render(
        null,
        document.getElementById("modelDeletionConfirmDialog")
      );
    }

    showConfirmDeletion() {
        ReactDOM.render(
            <ConfirmDialog
                id="deleteModel"
                text="Are you sure you want to delete this model? This is irreversible, all the data will be lost."
                confirmText="Delete"
                instantiated={true}
                loadingMessage="Cleaning up the database..."
                onConfirm={this.onConfirmDelete}
                onCancel={this.onCancelDelete}
                customStyle={{"width": "50%"}} />,
            document.getElementById("modelDeletionConfirmDialog")
        );
    }

    render() {
        var seedGenes = [];
        if (this.props.geneData) {
            for (var i = this.props.model["seed_genes"].length - 1; i >= 0; i--) {
                seedGenes.push(
                    [this.props.model["seed_genes"][i]].concat(
                        this.props.geneData[this.props.model["seed_genes"][i]])
                );
            }
        }
        this.props.geneData
        return (
            <div id="modelViewWidget" className="model-info-box">
                <div id="modelDeletionConfirmDialog"></div>
                <div className="row" id="modelOptions">
                    <button disabled={this.props.readonly}
                            onClick={this.showConfirmDeletion} 
                            className="btn btn-default btn-md panel-button-right instantiation">
                        <span className="glyphicon glyphicon-trash"></span> Delete model
                    </button>
                    <button className="btn btn-default btn-md panel-button-right instantiation">
                        <span className="glyphicon glyphicon-cog"></span> Generate Kappa
                    </button>
                </div>
                <div className="row">
                    <div className="col-md-8 model-meta-data">
                        <ModelMetaDataBox readonly={this.props.readonly}
                                          name={this.props.model["meta_data"]["name"]}
                                          desc={this.props.model["meta_data"]["desc"]}
                                          creation_time={this.props.model["creation_time"]}
                                          last_modified={this.props.model["last_modified"]}
                                          onDataUpdate={this.props.onMetaDataUpdate}/>
                    </div>
                </div>
                <ContextView expanded={true}
                             id={"contextView"}
                             corpusId={this.props.corpusId}
                             readonly={this.props.readonly}
                             onSeedGenesUpdate={this.props.onSeedGenesUpdate}
                             onLoadAllGenes={this.props.onLoadAllGenes}
                             definitions={this.props.model["definitions"]}
                             seedGenes={seedGenes}/>
                <DynamicsView expanded={true}
                              id={"dynamicsView"}
                              onRatesUpdate={this.props.onRatesUpdate}
                              bndRate={this.props.model["default_bnd_rate"]}
                              brkRate={this.props.model["default_brk_rate"]}
                              modRate={this.props.model["default_mod_rate"]}/>
                <InstantiatedView expanded={true} id={"instantiatedView"}/>
            </div>
        )
    }
}


class ModelMetaDataBox extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return ([
            <div id="modelMetaDataView">
                <KBMetaDataBox
                    id="modelMetaData"
                    name={"Meta-data"}
                    editable={true}
                    expandable={true}
                    readonly={this.props.readonly}
                    kbName={this.props.name}
                    desc={this.props.desc}
                    creation_time={this.props.creation_time}
                    last_modified={this.props.last_modified}
                    protected={["creation_time", "last_modified"]}
                    instantiated={true}
                    onDataUpdate={this.props.onDataUpdate}/>
            </div>
        ]);
                
    }
}


class Collapsable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expanded: props.expanded
        }
        this.handleCollapse = this.handleCollapse.bind(this);
    }

    handleCollapse() {
        let newState = { ...this.state };
        newState.expanded = !newState.expanded;
        this.setState(newState);
    }

    render() {
        var arrow, title, content = null;
        if (this.state.expanded) {
            arrow = "down";
            content = this.props.content;
        } else {
            arrow = "right";
        }
        title =
            <a className="instantiation-link info-box-title" onClick={this.handleCollapse}>
                <h4 className={"editable-box"}>
                    <span className={"glyphicon glyphicon-menu-" + arrow} ></span> {this.props.title}
                </h4>
            </a>;

        return ([
            <div className="row">
                <div className={"col-sm-12"}>
                    {title}
                </div>
            </div>,
            <div id={this.props.id}>
                {content}
            </div>,
        ]);
    }
}


class ModifiableGeneListView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeDialog: false,
            selectedGenes: null
        };

        this.onModifySeedGenes = this.onModifySeedGenes.bind(this);
        this.onRemoveDialog = this.onRemoveDialog.bind(this);
        this.onSelectionUpdate = this.onSelectionUpdate.bind(this);
        this.onSubmitSelection = this.onSubmitSelection.bind(this);
    }

    onModifySeedGenes() {
        var state = Object.assign({}, this.state);
        state.activeDialog = true;
        this.setState(state);
    }

    onRemoveDialog() {
        var state = Object.assign({}, this.state);
        state.activeDialog = false;
        this.setState(state);
    }

    onSelectionUpdate(newSelectedGenes) {
        var state = Object.assign({}, this.state);
        state.selectedGenes = newSelectedGenes;
        this.setState(state);
    }

    onSubmitSelection() {
        if (this.state.selectedGenes) {
            this.props.onSelectionUpdate(this.state.selectedGenes);
        }
        this.onRemoveDialog();
    }

    render() {
        var filteredList = <FilteredList
            instantiated={true}
            items={this.props.items}
            listComponent={GeneList}
            itemFilter={
                (item, value) => item.join(", ").toLowerCase().search(
                        value.toLowerCase()) !== -1
            }/>;
        var changeButton = (
            <button type="button"
                    onClick={this.onModifySeedGenes}
                    className="btn model-update-button btn-default panel-button editable-box right-button instantiation">
                <span className="glyphicon glyphicon-pencil"></span> Modify
            </button>
        );
        var dialog;
        if (this.state.activeDialog) {
            var dialogContent = (
                <GeneSelectionWidget 
                    instantiated={true}
                    id={"geneSelectionWidget"}
                    preselectedItems={this.props.items}
                    modelId={this.props.modelId}
                    onUpdateSelected={this.onSelectionUpdate}
                    onFetchItems={this.props.onLoadAllGenes}/>);
            var footerContent = (<button type="button"
                        onClick={this.onSubmitSelection}
                        className="btn model-update-button btn-primary panel-button editable-box right-button instantiation">
                        Save
                </button>);
            dialog = (
                <div id="modifySeedGenesDialog">
                    <Dialog
                        id="modifySeedGenes"
                        title="Select seed protoforms"
                        onRemove={this.onRemoveDialog}
                        content={dialogContent}
                        footerContent={footerContent}
                        customStyle={{"width": "50%"}} />
                </div>
            );
        }
        return [
            filteredList,
            dialog,
            changeButton
        ]
    }
}

class ModifiableVariantsListView extends React.Component {
    render() {

    }
}

class ContextView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            definitionsData: null
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount() {
        var url = "/corpus/" + this.props.corpusId + "/get-variants-data";
        postData(
            this.props.definitions,
            url,
            (data) => {
                var state = Object.assign({}, this.state);
                state.definitionsData = data;
                this.setState(state);
            }
        );
    }

    render() {

        var seedGenes = [
            <div className="row">
                <div className={"col-sm-12"}>
                    <h4 className="editable-box">Seed protoforms</h4>
                    <ModifiableGeneListView
                        onSelectionUpdate={this.props.onSeedGenesUpdate}
                        onLoadAllGenes={this.props.onLoadAllGenes}
                        corpusId={this.props.corpusId}
                        items={this.props.seedGenes}/>
                </div>
            </div>
        ];

        var definitonItems;
        if (this.state.definitionsData) {
            console.log(this.state.definitionsData);
            definitonItems = Object.entries(this.state.definitionsData).map(
                ([key, value]) => (
                    <VariantSelectionItem 
                       corpusId={this.props.corpusId}
                       selectionId={key}
                       selectionHGNC={null}
                       selectionSynonyms={null}
                       selectionText={null}
                       subitems={value} 
                       onSubitemChange={null}
                       onRemove={null}
                       noSubitemsMessage={" Wild Type (no variants found, default selection)"}/>
                )
            );
        } else {
            definitonItems = (
                <div id="loadingBlock" className="loading-elements center-block">
                    <div id="loaderModel"></div>
                </div>
            );
        }
        var definitions = [
            <div className="row">
                <div className={"col-sm-12"}>
                    <h4 className="editable-box">Definitions</h4>
                    {definitonItems}
                </div>
            </div>
        ];

        return ([
            <Collapsable title={"Context"}
                         id={this.props.id}
                         content={[seedGenes, definitions]}
                         expanded={this.props.expanded}/>
        ]);
    }
}

class DynamicsView extends React.Component {
    render() {
        var items = [
            [
                "default_bnd_rate",
                "Binding rate",
                this.props.bndRate ? this.props.bndRate : <div className="small-faded">not specified</div>
            ],
            [
                "default_brk_rate",
                "Unbinding rate",
                this.props.brkRate ? this.props.brkRate : <div className="small-faded">not specified</div>
            ],
            [
                "default_mod_rate",
                "Modification rate",
                this.props.modRate ? this.props.modRate : <div className="small-faded">not specified</div>
            ],
        ];
        var data = {
            "default_bnd_rate": this.props.bndRate,
            "default_brk_rate": this.props.brkRate,
            "default_mod_rate": this.props.modRate,
        }

        content = (
            <div className="col-md-8 model-dynamics">
                <EditableBox id={this.props.id}
                             name="Default rates"
                             items={items}
                             editable={true}
                             readonly={this.props.readonly}
                             onDataUpdate={this.props.onRatesUpdate}
                             data={data}
                             noBorders={true}
                             expanded={true}
                             expandable={false}
                             protected={[]}
                             instantiated={true}/>
            </div>
        );

        return ([
            <Collapsable title={"Dynamics"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>
        ]);
    }
}

class InstantiatedView extends React.Component {
    render() {
        
        var content = [
            <div class="small-faded" style={{"marginBottom": "10pt"}}>
                Use the following buttons to preview knowledge graphs instantiated
                given the model's context. Note that, for large knowledge corpora, 
                loading the instantiated action graph may take a moment.
            </div>,
            <ul class="nav nav-pills">
              <li>
                <a id="switchToModelAGTab"
                   class="nav-link inner instantiation-link"
                   onClick="instantiateAG(this);"
                   role="tab">
                    <span className="glyphicon glyphicon-play"></span> Instantiate action graph
                </a>
              </li>
              <li>
                <a id="switchToModelNuggetsTab"
                   class="nav-link inner instantiation-link"
                   onClick="loadModelNuggetsTab(this);"
                   role="tab">Instantiated nuggets</a>
              </li>
            </ul>
        ];

        return ([
            <Collapsable title={"Instantiated view"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>
        ]);
    }
}