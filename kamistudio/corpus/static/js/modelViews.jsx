
function insertLoader(instantiated, father) {
    /* Turn on the loader of the nuggets view */
    ReactDOM.render(
        <div className="progress-block"
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

        this.onItemClick = this.onItemClick.bind(this);
        this.setSelectedModel = this.setSelectedModel.bind(this);
        this.fetchGeneData = this.fetchGeneData.bind(this);
        this.loadAllGenes = this.loadAllGenes.bind(this);
        this.onSeedGenesUpdate = this.onSeedGenesUpdate.bind(this);
        this.onMetaDataUpdate = this.onMetaDataUpdate.bind(this);
        this.onRatesUpdate = this.onRatesUpdate.bind(this);
        this.updateModel = this.updateModel.bind(this);
        this.onDefinitionsUpdate = this.onDefinitionsUpdate.bind(this);
        this.getItemById = this.getItemById.bind(this);

        var preselected = null;
        if (this.props.preselected) {
            preselected = this.getItemById(this.props.preselected);
        }

        this.state = {
            selected: preselected,
            loadedFullGeneData: false,
            geneData: null,
            definitionsData: {}
        };

        if (this.props.preselected) {
            this.fetchGeneData(this.state.selected);
            this.fetchDefinitionData(this.state.selected);
        }
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
        state.selected["last_modified"] = formatDate(new Date());
        dataQuery["last_modified"] = state.selected["last_modified"];
        this.updateModel(
            this.state.selected["id"], dataQuery);
        this.setState(state);
    }

    onRatesUpdate(updatedData) {
        var state = Object.assign({}, this.state);
        for (var k in updatedData) {
            state.selected[k] = updatedData[k];
        }
        state.selected["last_modified"] = formatDate(new Date());
        updatedData["last_modified"] = state.selected["last_modified"];
        this.updateModel(
            this.state.selected["id"], updatedData);
        this.setState(state);
    }

    onSeedGenesUpdate(newSeedGenes) {
        var state = Object.assign({}, this.state);
        state.selected["context"]["seed_protoforms"] = newSeedGenes;
        state.selected["last_modified"] = formatDate(new Date());
        this.updateModel(
            state.selected["id"], {
                "context.seed_protoforms": newSeedGenes,
                "last_modified": state.selected["last_modified"]
            });
        this.setState(state);
    }

    onDefinitionsUpdate(newDefinitions) {
        var data = {};
        for (var key in newDefinitions) {
            data[key] = newDefinitions[key]["selectedVariants"];
        }
        var state = Object.assign({}, this.state);
        state.selected["context"]["definitions"] = data;
        state.selected["last_modified"] = formatDate(new Date());
        this.updateModel(
            state.selected["id"], {
                "context.definitions": data,
                "last_modified": state.selected["last_modified"]
            });
        this.setState(state);
    }

    onItemClick(item) {
        this.setSelectedModel(item);
    }

    setSelectedModel(item) {
        var state = Object.assign({}, this.state);
        state.selected = item;
        this.setState(state);
        this.fetchGeneData(item);
        this.fetchDefinitionData(item);
    }

    fetchDefinitionData(item) {
        for (var k in item["context"]["definitions"]) {
            if (!Object.keys(this.state.definitionsData).includes(k)) {
                // Load new definitions data
                var url = "/corpus/" + this.props.corpusId + "/get-variants-data";
                postData(
                    item["context"]["definitions"],
                    url,
                    (data) => {
                        var state = Object.assign({}, this.state);
                        state.definitionsData = data;
                        this.setState(state);
                    }
                );
            }
        }
    }

    fetchGeneData(item) {
        if (!this.state.loadedFullGeneData) {
            var url = "/corpus/" + this.props.corpusId + "/get-gene-data";
            postData(
                {
                    "uniprots": item["context"]["seed_protoforms"].concat(
                        Object.keys(item["context"]["definitions"]))
                },
                url,
                (data) => {
                    var state = Object.assign({}, this.state);
                    state.geneData = data["items"];
                    this.setState(state);
                });
        }
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
        } else {
            var genes = [];
            for (var k in this.state.geneData) {
                genes.push([
                    k, this.state.geneData[k][0], this.state.geneData[k][1]
                ]);
            }

            element.setState({
                initialItems: genes,
                items: genes
            });
        }
    }

    getItemById(itemId) {
        var item;
        for (var i = this.props.items.length - 1; i >= 0; i--) {
            if (this.props.items[i]["id"] == itemId) {
                item = this.props.items[i];
                break;
            }
        }
        return item;
    }

    setSelectedItemById(itemId) {
        this.setSelectedModel(this.getItemById(itemId));
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
            var extraProtoforms = {};
            if (this.state.geneData) {
                for (var k in this.state.selected["context"]["definitions"]) {
                    var notFound = true;
                    for (var i = this.state.selected["context"]["seed_protoforms"].length - 1; i >= 0; i--) {
                        if (this.state.selected["context"]["seed_protoforms"][i][0] == k) {
                            notFound = false;
                            break;
                        }
                    }
                    if (notFound) {
                        extraProtoforms[k] = this.state.geneData[k];
                    }
                }
            }


            modelPreview = (
                <ModelView readonly={this.props.readonly}
                           corpusUrl={this.props.corpusUrl}
                           geneData={this.state.geneData}
                           definitionsData={this.state.definitionsData}
                           extraDefinitionProtoforms={extraProtoforms}
                           model={this.state.selected} 
                           onSeedGenesUpdate={this.onSeedGenesUpdate}
                           onDefinitionsUpdate={this.onDefinitionsUpdate}
                           onLoadAllGenes={this.loadAllGenes}
                           corpusId={this.props.corpusId}
                           onMetaDataUpdate={this.onMetaDataUpdate}
                           onRatesUpdate={this.onRatesUpdate}
                           actionGraph={this.props.actionGraph} 
                           webWorkerUrl={this.props.webWorkerUrl}
                           onFetchActionGraph={this.props.onFetchActionGraph} />
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
        window.location.replace(this.props.corpusUrl);
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
            for (var i = this.props.model["context"]["seed_protoforms"].length - 1; i >= 0; i--) {
                seedGenes.push(
                    [this.props.model["context"]["seed_protoforms"][i]].concat(
                        this.props.geneData[this.props.model["context"]["seed_protoforms"][i]])
                );
            }
        }

        var definitionsData = {};
        if (this.props.definitionsData) {
            for (var k in this.props.model["context"]["definitions"]) {
                if (k in this.props.definitionsData) {
                    definitionsData[k] = this.props.definitionsData[k];
                } else {
                    definitionsData = null;
                    break;
                }
            }
        }


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
                             seedGenes={seedGenes}
                             onSeedGenesUpdate={this.props.onSeedGenesUpdate}
                             onDefinitionsUpdate={this.props.onDefinitionsUpdate}
                             extraDefinitionProtoforms={this.props.extraDefinitionProtoforms}
                             onLoadAllGenes={this.props.onLoadAllGenes}
                             definitions={definitionsData} />
                <DynamicsView expanded={true}
                              id={"dynamicsView"}
                              onRatesUpdate={this.props.onRatesUpdate}
                              bndRate={this.props.model["default_bnd_rate"]}
                              brkRate={this.props.model["default_brk_rate"]}
                              modRate={this.props.model["default_mod_rate"]}/>
                <InstantiatedView expanded={true}
                                  id={"instantiatedView"}
                                  corpusId={this.props.corpusId}
                                  modelId={this.props.model["id"]}
                                  webWorkerUrl={this.props.webWorkerUrl}                                  
                                  actionGraph={this.props.actionGraph}
                                  onFetchActionGraph={this.props.onFetchActionGraph} />
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
        var filteredList;
        if (this.props.items) {
            filteredList = <FilteredList
                instantiated={true}
                items={this.props.items}
                listComponent={GeneList}
                itemFilter={
                    (item, value) => item.join(", ").toLowerCase().search(
                            value.toLowerCase()) !== -1
                }/>;
        } else {
            filteredList = (
                <div id="loadingBlock" className="loading-elements center-block">
                    <div id="loaderModel"></div>
                </div>
            );
        }

        var changeButton = (
            <button type="button"
                    id="modifySeedGenes"
                    onClick={this.onModifySeedGenes}
                    className="btn btn-sm model-update-button btn-default panel-button editable-box right-button instantiation">
                <span className="glyphicon glyphicon-pencil"></span>
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
            <h4 className="editable-box">Seed protoforms</h4>,
            changeButton,
            filteredList,
            dialog
        ]
    }
}

class ModifiableVariantsListView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            editingMode: false,
            edited: false,
            activeDialog: false,
            variantChoices: {}
        };

        this.onModifyDefinitions = this.onModifyDefinitions.bind(this);
        this.onCancelModifications = this.onCancelModifications.bind(this);
        this.onRemoveDialog = this.onRemoveDialog.bind(this);
        this.onShowDialog = this.onShowDialog.bind(this);
        this.onSubmitSelection = this.onSubmitSelection.bind(this);
        this.onVariantItemClick = this.onVariantItemClick.bind(this);
        this.onRemoveDefinition = this.onRemoveDefinition.bind(this);
    }

    onModifyDefinitions() {
        // enter editing mode
        var state = Object.assign({}, this.state);
        state.editingMode = true;

        for (var k in this.props.definitions) {
            if (!(k in state.variantChoices)) {
                state.variantChoices[k] = {
                    "variants": this.props.definitions[k],
                    "selectedVariants": Object.keys(this.props.definitions[k])
                }
            }
        }

        this.setState(state);
    }

    onCancelModifications() {
        var state = Object.assign({}, this.state);
        state.editingMode = false;
        state.variantChoices = [];
        this.setState(state);
    }

    onShowDialog() {
        var state = Object.assign({}, this.state);
        state.activeDialog = true;
        this.setState(state);
    }

    onRemoveDialog() {
        var state = Object.assign({}, this.state);
        state.activeDialog = false;
        this.setState(state);
    }


    onSubmitSelection() {
        // call parent's handler

        if (this.props.onUpdateDefinitions) {
            this.props.onUpdateDefinitions(this.state.variantChoices);
        }

        // exit editing mode
        var state = Object.assign({}, this.state);
        state.editingMode = false;
        state.edited = true;
        // state.variantChoices = [];
        this.setState(state);
    }

    onVariantItemClick(uniprotid, hgnc, synonyms) {
        var state = Object.assign({}, this.state);

        state.activeDialog = false;

        // add to selected variants if already in definitions
        if (!(uniprotid in state.variantChoices)) {
            state.variantChoices[uniprotid] = {
                "variants": {},
                "selectedVariants": []
            };
        }

        this.setState(state);

        // Fetch all variants of the specified protoform
        var url = "/corpus/" + this.props.corpusId + "/variants/uniprot/" + uniprotid;
        $.ajax({
            url: url,
            type: 'get',
            dataType: "json"
        }).done(
            (data) => {
                var state = Object.assign({}, this.state);
                state["variantChoices"][uniprotid]["variants"] = data["products"];
                this.setState(state);
            }
        ).fail(function (e) {
            console.log("Failed to load variants");
        });
    }

    onVariantCheck(uniprotid, variant) {
        var state = Object.assign({}, this.state);
        if (!state.variantChoices[uniprotid]["selectedVariants"].includes(variant)) {
            state.variantChoices[uniprotid]["selectedVariants"].push(variant);
        } else {
            removeItem(state.variantChoices[uniprotid]["selectedVariants"], variant);
        }
        this.setState(state);
    }

    onRemoveDefinition(uniprotid) {
        var state = Object.assign({}, this.state);
        delete state.variantChoices[uniprotid];
        this.setState(state);
    }

    render() {
        var definitions = {},
            preselectedItems = {};
        if (this.state.editingMode) {
            for (var k in this.state.variantChoices) {
                definitions[k] = this.state.variantChoices[k]["variants"];
            }
        } else if (this.state.edited) {
            for (var k in this.state.variantChoices) {
                definitions[k] = {};
                for (var i = this.state.variantChoices[k]["selectedVariants"].length - 1; i >= 0; i--) {
                    var variant = this.state.variantChoices[k]["selectedVariants"][i];
                    definitions[k][variant] =
                        this.state.variantChoices[k]["variants"][variant];
                }
            }
        } else {
            definitions = this.props.definitions;
            preselectedItems = this.props.definitions;
        }

        var definitionList, buttons, dialog;
        if (definitions) {
            if (Object.keys(definitions).length > 0) {
                var definitonItems = Object.keys(definitions).map(
                    (key) => (
                        <VariantSelectionItem 
                           preselectedItems={preselectedItems[key]}
                           defaultDisabled={true}
                           editable={this.state.editingMode}
                           instantiated={true}
                           corpusId={this.props.corpusId}
                           selectionId={key}
                           selectionHGNC={(key in this.props.protoformsData) ? this.props.protoformsData[key][0] : null}
                           selectionSynonyms={(key in this.props.protoformsData) ? this.props.protoformsData[key][1] : null}
                           selectionText={null}
                           subitems={definitions[key]} 
                           onSubitemChange={(up, allSelected, variant) => this.onVariantCheck(key, variant)}
                           onRemove={() => this.onRemoveDefinition(key)}
                           noSubitemsMessage={" Wild Type (no variants found, default selection)"}/>
                    )
                );
                definitionList = (
                    <ul className="nav nuggets-nav list-group-striped list-unstyled definitions">
                        {definitonItems}
                    </ul>
                );

            } else {
                definitionList = (
                    <div className="small-faded">
                        No variants selected (wild-type variants are selected for all protoforms)
                    </div>
                );
            }
        } else {
            definitionList = (
                <div id="loadingBlock" className="loading-elements center-block">
                    <div id="loaderModel"></div>
                </div>
            );
        }

        if (this.state.activeDialog) {
            var dialogContent = null;
            dialog = (
                <VariantSelectionDialog
                    id="modifyDefinitionsDialog"
                    instantiated={true}
                    title="Select protoform to specify variants"
                    onRemove={this.onRemoveDialog}
                    onFetchItems={this.props.onLoadAllGenes}
                    onItemClick={this.onVariantItemClick}
                    filterItems={Object.keys(this.state.variantChoices)}/>
            );
        }


        if (this.state.editingMode) {
            buttons = [
                <button type="button"
                        id="modifyDefinitions"
                        onClick={this.onSubmitSelection}
                        className="btn btn-sm model-update-button btn-primary panel-button editable-box right-button instantiation">
                    Save
                </button>,
                <button type="button"
                        id="modifyDefinitions"
                        onClick={this.onCancelModifications}
                        className="btn btn-sm model-update-button btn-default panel-button editable-box right-button instantiation">
                    Cancel
                </button>,
                <button type="button"
                        id="modifyDefinitions"
                        onClick={this.onShowDialog}
                        className="btn btn-sm model-update-button btn-default panel-button editable-box right-button instantiation">
                    <span className="glyphicon glyphicon-plus"></span> Specify variant
                </button>
            ];
        } else {
            buttons = (
                <button type="button"
                        id="modifyDefinitions"
                        onClick={this.onModifyDefinitions}
                        className="btn btn-sm model-update-button btn-default panel-button editable-box right-button instantiation">
                    <span className="glyphicon glyphicon-pencil"></span>
                </button>);
        }
        return (
            <div className="row">
                <div className={"col-sm-12"}>
                    <h4 className="editable-box">Definitions</h4>
                    {buttons}
                    {dialog}
                    {definitionList}
                </div>
            </div>
        );
    }
}



class ContextView extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        // Collect HGNC and synonyms from seed genes data
        var protoformsData = Object.assign({}, this.props.extraDefinitionProtoforms);
        for (var i = this.props.seedGenes.length - 1; i >= 0; i--) {
            protoformsData[this.props.seedGenes[i][0]] = [
                this.props.seedGenes[i][1], this.props.seedGenes[i][2]
            ];
        }

        var content = (
            <div className="row">
                <div className="col-md-6">
                    <ModifiableGeneListView
                                onSelectionUpdate={this.props.onSeedGenesUpdate}
                                onLoadAllGenes={this.props.onLoadAllGenes}
                                corpusId={this.props.corpusId}
                                items={this.props.seedGenes}/>
                </div>
                <div className="col-md-6">
                    <ModifiableVariantsListView
                                onUpdateDefinitions={this.props.onDefinitionsUpdate}
                                onLoadAllGenes={this.props.onLoadAllGenes}
                                corpusId={this.props.corpusId}
                                definitions={this.props.definitions}
                                extraDefinitionProtoforms={this.props.extraDefinitionProtoforms}
                                protoformsData={protoformsData}/>
                </div>
            </div>
        );

        return (<Collapsable title={"Context"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>);
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
    constructor(props) {
        super(props);

        this.state = {
            activatedTabs: false,
            instantiatedAg: null,
            agInstantiationRule: null,
            agInstantiationInstance: null,
            nuggetsActive: false,
            agActive: false
        }

        this.instantiateAG = this.instantiateAG.bind(this);
        this.fetchInstantiationRule = this.fetchInstantiationRule.bind(this);
        this.onShowNuggets = this.onShowNuggets.bind(this);
    }

    onShowNuggets() {

    }

    fetchInstantiationRule() {
        if (!this.state.instantiatedAg) {
            getData(
                "/corpus/" + this.props.corpusId + "/model/" + this.props.modelId + "/instantiate-ag",
                (data) => {
                    var state = Object.assign({}, this.state);
                    var rule = data["rule"],
                        instance = data["instance"];
                    state.instantiatedAg = JSON.parse(JSON.stringify(
                        this.props.actionGraph));
                    var ag = JSON.parse(JSON.stringify(
                        this.props.actionGraph["actionGraph"]));
                    var rhsInstance = applyRuleTo(
                        ag, rule, instance, true,
                        {
                            "onRemoveNode": (nodeId) => {
                                delete state.instantiatedAg["metaTyping"][nodeId];
                                delete state.instantiatedAg["semantics"][nodeId];
                            },
                            "onCloneNode": (original, clones) => {
                                var originalType = state.instantiatedAg["metaTyping"][original]; 
                                delete state.instantiatedAg["metaTyping"][original];

                                for (var i = clones.length - 1; i >= 0; i--) {
                                    state.instantiatedAg["metaTyping"][clones[i]] = originalType;
                                    state.instantiatedAg["semantics"][clones[i]] = originalSemantics;
                                }

                                if (original in state.instantiatedAg["semantics"]) {
                                    var originalSemantics = state.instantiatedAg["semantics"][original];
                                    delete state.instantiatedAg["semantics"][original];
                                    
                                    for (var i = clones.length - 1; i >= 0; i--) {
                                        state.instantiatedAg["semantics"][clones[i]] = originalSemantics;
                                    }
                                }
                            }
                        });
                    mapLinksToIds(ag);
                    state.instantiatedAg["actionGraph"] = ag;
                    this.setState(state);
                })
        }
    }

    instantiateAG() {
        var state = Object.assign({}, this.state);
        state.activatedTabs = true;
        state.agActive = true;
        this.setState(state);

        if (!this.props.actionGraph) {
            this.props.onFetchActionGraph(() => this.fetchInstantiationRule());
        } else {
            this.fetchInstantiationRule();
        }
    }

    render() {
        var tabs;
        if (this.state.activatedTabs) {
            var agContent;
            if (this.state.instantiatedAg) {
                agContent = (
                    <ActionGraphWidget corpusId={this.props.corpusId}
                                       instantiated={true}
                                       webWorkerUrl={this.props.webWorkerUrl} 
                                       actionGraph={this.state.instantiatedAg}
                                       readonly={true}
                                       saveGeneratedNodePos={false}
                                       svgId={"modelActionGraphSvg"}
                                       onShowNuggets={this.onShowNuggets} />
                );
            } else {
                agContent = (
                    <div className="progress-block">
                        <div id="progressMessage">Loading...</div>
                        <div id="loadingBlock" className="loading-elements center-block"
                              style={{"marginBottom": "20pt"}}>
                            <div id="loaderModel"></div>
                        </div>
                    </div>
                );
            }
            tabs = (
                <div class="tab-content">
                    <div class={"tab-pane" + this.state.agActive ? " active" : ""} id="model_action_graph" role="tabpanel">
                        <div id="agView" class="instantiated">
                            {agContent}
                        </div>
                    </div>
                    <div class={"tab-pane" + this.state.nuggetsActive ? " active" : ""} id="model_action_graph" role="tabpanel">
                        <div id="modelNuggetsView">
                          
                        </div>
                    </div>
                </div>
            );
        }
        
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
                   onClick={this.instantiateAG}
                   role="tab">
                    <span className="glyphicon glyphicon-play"></span> Instantiate action graph
                </a>
              </li>
              <li>
                <a id="switchToModelNuggetsTab"
                   class="nav-link inner instantiation-link"
                   onClick={this.loadNuggets}
                   role="tab">Instantiated nuggets</a>
              </li>
            </ul>,
            tabs
        ];

        return ([
            <Collapsable title={"Instantiated view"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>
        ]);
    }
}