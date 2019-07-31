/**
 * Nugget view components
 */

function NuggetListItem(props) {
    var dot, suffix = "";
    if (props.nuggetType == "bnd") {
        dot = <span className="dot dot-bnd"></span>;
    } else {
        dot = <span className="dot dot-mod"></span>;
    }
    if (props.instantiated) {
        suffix = " instantiation-link";
    }
    var selected = "not-selected";
    if (props.active) {
        selected = "selected";
    }

    return (
        <li className={selected + suffix}>
          <a className={"nugget-selector" + suffix}
             onClick={() => props.onClick(props.nuggetId, props.nuggetDesc, props.nuggetType)}>
             {dot} {props.nuggetId} 
             <div className="nugget-desc">
                <p>{props.nuggetDesc}</p>
            </div>
          </a>
        </li>
    );
}


class NuggetList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: null
        };

        this.onItemClick = this.onItemClick.bind(this)
    }

    onItemClick(id, desc, type) {
        this.props.onItemClick(id, desc, type);
        this.setState({selected: id});
    }

    render() {
        // sort items by id
        function sortById(a, b) {
            if (a[0] == b[0]) {
                return 0;
            } else {
                return a[0] < b[0] ? -1 : 1;
            }
        };

        var itemsToSort = [...this.props.items];
        itemsToSort.sort(sortById);

        var listItems = itemsToSort.map(
                (item) => <div key={item[0]} id={"nuggetListItem" + item[0]}>
                                <NuggetListItem
                                    nuggetId={item[0]}
                                    active={item[0] == this.state.selected ? true: false}
                                    nuggetType={item[1]}
                                    nuggetDesc={item[2]}
                                    onClick={this.onItemClick}
                                    onRemove={this.onItemRemove}
                                    instantiated={this.props.instantiated} />
                            </div>);
        var customStyle = null;
        if (this.props.height) {
            customStyle = {"height": this.props.height};
        }

        return (
            <ul className={"nav list-group-striped list-unstyled components nuggets-nav"}
                style={customStyle}>
                {listItems}
            </ul>
        );
    }
}


class NuggetListView extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            selected: null
        }
    }

    onClick(id, desc, type) {
        var state = Object.assign({}, this.state);
        state.selected = id;
        this.setState(state);
        this.props.onItemClick(id, desc, type);
    }

    render() {

        return ([
            <FilteredList 
                items={this.props.items}
                onItemClick={this.props.onItemClick}
                listComponentProps={{
                    instantiated: this.props.instantiated,
                    selected: this.state.selected,
                    onItemRemove: this.props.onItemRemove,
                    height: this.props.height
                }}
                filterItems={[]}
                listComponent={NuggetList}
                itemFilter={
                    (item, value) => item.join(", ").toLowerCase().search(
                            value.toLowerCase()) !== -1
                }/>,
            <div className="row">
              <div className="col-md-12">
                <p style={{"margin-top": "10px"}}>Interaction types: <span className="dot dot-bnd"></span> BND <span className="dot dot-mod"></span> MOD</p> 
              </div>
            </div>
        ]);
    }
}


class NuggetTable extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        var size = Object.keys(this.props.geneAdjacency).length * 20;

        return ([
            <div id="tableSvg">
{/*                <svg id="nuggetTable" 
                     preserveAspectRatio="xMinYMin meet"
                     viewBox="0 0 500 500"
                     style={{"width": "100%", "height": "100%"}}></svg>*/}
            </div>,
            <div id="tableNuggetList" style={{"width": "100%", "height": "100%"}}></div>
        ])
    }
}


class NuggetElementInfo extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            updatedMetaData: null,
            updatedReferenceElements: null,
            updatedSemantics: null
        }
    }

    render() {
        var elementInfo,
            metaData,
            referenceMetaData,
            semantics = null;
        
        if (this.props.elementType === "edge") {
            elementInfo = 
                <div className="col-md-6" id="nuggetGraphElementInfo">
                    <ElementInfoBox id="graphElement"
                                    sourceId={this.props.elementId[0]}
                                    targetId={this.props.elementId[1]}
                                    elementType={this.props.elementType}
                                    sourceMetaType={this.props.metaType[0]}
                                    targetMetaType={this.props.metaType[1]}
                                    editable={false}
                                    instantiated={this.props.instantiated} />
                </div>;
        } else {
            elementInfo = 
                <div className="col-md-6" id="nuggetGraphElementInfo">
                    <ElementInfoBox id="graphElement"
                                    elementId={this.props.elementId}
                                    elementType={this.props.elementType}
                                    metaType={this.props.metaType}
                                    editable={false}
                                    instantiated={this.props.instantiated} />
                </div>;
        }

        if (this.props.elementType === "edge") {
            metaData =
                <div className="col-md-6" id="nuggetGraphMetaModelInfo">
                    <MetaDataBox readonly={this.props.readonly}
                                 id="metaData"
                                 sourceId={this.props.elementId[0]}
                                 targetId={this.props.elementId[1]}
                                 elementType={this.props.elementType}
                                 sourceMetaType={this.props.metaType[0]}
                                 targetMetaType={this.props.metaType[1]}
                                 attrs={this.props.elementAttrs}
                                 editable={true}
                                 instantiated={this.props.instantiated}
                                 onDataUpdate={this.props.onMetaDataUpdate}/>
                </div>;
        } else {
            metaData =
                <div className="col-md-6" id="nuggetGraphMetaModelInfo">
                    <MetaDataBox readonly={this.props.readonly}
                                 id="metaData"
                                 elementId={this.props.elementId}
                                 elementType={this.props.elementType}
                                 metaType={this.props.metaType}
                                 attrs={this.props.elementAttrs}
                                 editable={true}
                                 instantiated={this.props.instantiated}
                                 onDataUpdate={this.props.onMetaDataUpdate}/>
                </div>;
        }

            
        if (this.props.semantics !== null) {
            semantics = 
                <div className="col-md-6" id="nuggetGraphSemanticsInfo">
                   <NuggetSemanticBox id="nuggetSemantics"
                                      elementId={this.props.elementId}
                                      elementType={this.props.elementType}
                                      metaType={this.props.metaType}
                                      semantics={this.props.semantics}
                                      editable={false}
                                      readonly={this.props.readonly}/>
                </div>;
        }

        if (this.props.elementType === "edge") {
            referenceMetaData = 
                <div className="col-md-6" id="nuggetGraphIdentificationInfo">
                    <ReferenceElementBox id="agElement"
                                         readonly={this.props.readonly}
                                         agSourceId={this.props.agElementId[0]}
                                         agTargetId={this.props.agElementId[1]}
                                         elementType="edge"
                                         sourceMetaType={this.props.metaType[0]}
                                         targetMetaType={this.props.metaType[1]}
                                         attrs={this.props.agElementAttrs}
                                         onFetchCandidates={this.props.onFetchCandidates}
                                         onCandidateSelect={this.props.onReferenceUpdate}/>
                </div>;
        } else {
            referenceMetaData = 
                <div className="col-md-6" id="nuggetGraphIdentificationInfo">
                    <ReferenceElementBox id="agElement"
                                         readonly={this.props.readonly}
                                         agElementId={this.props.agElementId}
                                         elementId={this.props.elementId}
                                         elementType="node"
                                         metaType={this.props.metaType}
                                         attrs={this.props.agElementAttrs}
                                         onFetchCandidates={this.props.onFetchCandidates}
                                         onCandidateSelect={this.props.onReferenceUpdate}/>
                </div>;
        }

        return ([
            <div className="row">
                {[elementInfo, metaData]}
            </div>,
            <div className="row">
                {[referenceMetaData, semantics]}
            </div>
        ]);
    }

}


class NuggetPreview extends React.Component {
    /** Component for the preview of nugget. 
     *  
     * Registers in its states all the changes made by
     * the user during the preview, these changes can be used
     * later to send them to the server.
     */


    constructor(props) {
        super(props);

        this.selectElement = this.selectElement.bind(this);
        this.deselectElement = this.deselectElement.bind(this);
        this.onDataUpdate = this.onDataUpdate.bind(this);
        this.onMetaDataUpdate = this.onMetaDataUpdate.bind(this);
        this.onReferenceUpdate = this.onReferenceUpdate.bind(this);
        this.setLoadedGraph = this.setLoadedGraph.bind(this);
        this.resetLoadedGraph = this.resetLoadedGraph.bind(this);

        this.state = {
            selectedElement: {
                id: null,
                attrs: null,
                type: null,
                metaType: null,
                agElementId: null,
                agElementAttrs: null,
                semantics: null
            },
            updatedNuggetInfo: {},
            updatedNuggetMetaData: {},
            updatedReferenceElements: {},
            loadedGraph: false
        }
    }

    setLoadedGraph() {
        var state = Object.assign({}, this.state);
        state.loadedGraph = true;
        this.setState(state);
    }

    resetLoadedGraph() {
        var state = Object.assign({}, this.state);
        state.loadedGraph = false;
        this.setState(state);
    }

    selectElement(elementId, elementAttrs, elementType, metaType,
                  agTyping, agElementAttrs, semantics,
                  onMetaDataUpdate) {
        var state = Object.assign({}, this.state);
        state.selectedElement = {
            id: elementId,
            attrs: elementAttrs,
            type: elementType,
            metaType: metaType,
            agElementId: agTyping,
            agElementAttrs: agElementAttrs,
            semantics: semantics,
            onMetaDataUpdate: onMetaDataUpdate
        };
        this.setState(state);
    }

    deselectElement() {
        var state = Object.assign({}, this.state);
        state.selectedElement = null;
        this.setState(state);
    }

    onDataUpdate(newData, oldData) {
        var state = Object.assign({}, this.state);
        state.updatedNuggetInfo = newData;
        this.setState(state);
        if (this.props.onDataUpdate) {
            this.props.onDataUpdate(newData, oldData);
        }
    }

    onMetaDataUpdate(newData, oldData) {
        var state = Object.assign({}, this.state);
        state.updatedNuggetMetaData[
            this.state.selectedElement.id] = newData;
        this.setState(state);
        if (this.state.selectedElement.onMetaDataUpdate) {
            this.state.selectedElement.onMetaDataUpdate(newData, oldData);
        }
        if (this.props.onMetaDataUpdate) {
            this.props.onMetaDataUpdate(newData, oldData);
        }
    }

    onReferenceUpdate(elementId, agElementId) {
        var state = Object.assign({}, this.state);
        state.updatedReferenceElements[elementId] = agElementId;
        this.setState(state);
        if (this.props.onReferenceUpdate) {
            this.props.onReferenceUpdate(elementId, agElementId);
        }
    }

    render() {

        var message = null,
            fields,
            svgDisplay = "none",
            data = {},
            nuggetElementInfo = null,
            elementInfoBoxes1 = null,
            elementInfoBoxes2 = null,
            removeButton = null;

        if (this.props.onRemove) {
            removeButton = 
                <button 
                   type="button" onClick={() => this.props.onRemove(this.props.nuggetId)}
                   className="btn btn-default btn-sm panel-button editable-box right-button">
                    <span className="glyphicon glyphicon-trash"></span>
                </button>;
        }

        if (!this.props.nuggetId) {
            message = "No nugget selected";
            fields = <EditableBox
                        id="nuggetInfo"
                        name="Nugget info"
                        data={{}}
                        editable={!this.props.readonly}
                        expanded={true}
                        readonly={this.props.readonly}
                        message={message}
                        items={[]}
                        noBorders={true}
                        protected={["nuggetId"]}
                        editable={true} />;
        } else {
            var items = [];
            if (this.props.nuggetId !== "NA") {
                items = [["nugget_id", "Nugget ID", this.props.nuggetId]];
            }

            var description = <p className="faded">not specified</p>;
            if (this.state.updatedNuggetInfo["nugget_desc"]) {
                description = this.state.updatedNuggetInfo["nugget_desc"];
            } else {
                if (this.props.nuggetDesc) {
                    description = this.props.nuggetDesc;
                }
            }

            items = items.concat([
                ["nugget_desc", "Description", description],
                [
                    "nugget_type",
                    "Type",
                    this.props.nuggetType == "bnd" ? [<span className="dot dot-bnd"></span>, "Binding"] : [<span className="dot dot-mod"></span>, "Modification"]],
            ]);

            data = {
                "nugget_id": this.props.nuggetId,
                "nugget_desc": this.state.updatedNuggetInfo["nugget_desc"] ? this.state.updatedNuggetInfo["nugget_desc"] : this.props.nuggetDesc,
                "nugget_type": this.props.nuggetType
            };

            fields = <EditableBox
                        id="nuggetInfo"
                        name="Nugget info"
                        data={data}
                        expanded={true}
                        editable={!this.props.readonly}
                        items={items}
                        noBorders={true}
                        protected={["nugget_id", "nugget_type"]}
                        readonly={this.props.readonly}
                        onDataUpdate={this.onDataUpdate}
                        allTopButtons={removeButton} />;

            svgDisplay = "inline-block";

            var upToDateAttrs;
            if (!this.props.selectedElement.attrs) {
                upToDateAttrs = this.state.selectedElement.attrs;
                if (this.state.selectedElement.id in this.state.updatedNuggetMetaData) {
                    for (var k in this.state.updatedNuggetMetaData[this.state.selectedElement.id]) {
                        if (!(k in upToDateAttrs)) {
                            upToDateAttrs[k] = {};
                            upToDateAttrs[k].type = "FiniteSet";
                        }
                        upToDateAttrs[k].data = this.state.updatedNuggetMetaData[this.state.selectedElement.id][k];
                    }
                }
            } else {
                upToDateAttrs = this.props.selectedElement.attrs;
            }

            var elementId = this.props.selectedElement.id ? this.props.selectedElement.id : this.state.selectedElement.id,
                elementType = this.props.selectedElement.type ? this.props.selectedElement.type : this.state.selectedElement.type,
                metaType = this.props.selectedElement.metaType ? this.props.selectedElement.metaType : this.state.selectedElement.metaType,
                agElementId = this.props.selectedElement.agElementId ? this.props.selectedElement.agElementId : this.state.selectedElement.agElementId,
                agElementAttrs = this.props.selectedElement.agElementAttrs ? this.props.selectedElement.agElementAttrs : this.state.selectedElement.agElementAttrs,
                semantics = this.props.selectedElement.semantics ? this.props.selectedElement.semantics : this.state.selectedElement.semantics;

            nuggetElementInfo =
                <NuggetElementInfo readonly={this.props.readonly}
                                   instantiated={this.props.instantiated}
                                   elementId={elementId}
                                   elementAttrs={upToDateAttrs}
                                   elementType={elementType}
                                   metaType={metaType}
                                   agElementId={agElementId}
                                   agElementAttrs={agElementAttrs}
                                   semantics={semantics}
                                   onDataUpdate={this.onDataUpdate}
                                   onMetaDataUpdate={this.onMetaDataUpdate}
                                   onFetchCandidates={this.props.onFetchCandidates}
                                   onReferenceUpdate={this.onReferenceUpdate} />;
        }

        var loader = null,
            svg = null;

        if ((this.state.loadedGraph) || (this.props.loadedGraph)) {
            svg = <svg id="nuggetSvg"
                       style={{"display": "inline-block"}} 
                       preserveAspectRatio="xMinYMin meet"
                       viewBox="0 0 500 200" >
                  </svg>;
        } else if (this.props.nuggetId) {
            loader = 
                <div id="progressBlock"
                     style={{"padding-top": "0pt", "margin-top": "20pt"}}>
                    <div id="progressMessage">Loading the nugget graph...</div>
                    <div id="loadingBlock" class="loading-elements center-block"
                          style={{"margin-bottom": "20pt"}}>
                        <div id={this.props.instantiated ? "loaderModel" : "loader"}></div>
                    </div>
                </div>;
        }

        return(
            <div id="nuggetPreview">
                {fields}
                <div id="nuggetSvgBlock">
                    {loader}
                    {svg}
                </div>
                <div id="nuggetElementInfo">
                    {nuggetElementInfo}
                </div>
                <div id="nuggetDeleteConfirmationDialog"></div>
            </div>
        );
    }
}


class NuggetEditingBox extends React.Component {


    constructor(props) {
        super(props);

        this.selectElement = this.selectElement.bind(this);
        this.deselectElement = this.deselectElement.bind(this);
        this.onDataUpdate = this.onDataUpdate.bind(this);
        this.onMetaDataUpdate = this.onMetaDataUpdate.bind(this);
        this.onReferenceUpdate = this.onReferenceUpdate.bind(this);
        this.onSaveClick = this.onSaveClick.bind(this);

        // var previewElement = ;
        this.state = {
            selectedElement: {
                id: null,
                attrs: null,
                type: null,
                metaType: null,
                agElementId: null,
                agElementAttrs: null,
                semantics: null
            },
            updatedNuggetInfo: {},
            updatedNuggetMetaData: {},
            updatedReferenceElements: {}
        }
    }

    selectElement(elementId, elementAttrs, elementType, metaType,
                  agTyping, agElementAttrs, semantics,
                  onMetaDataUpdate) {
        var state = Object.assign({}, this.state);
        state.selectedElement = {
            id: elementId,
            attrs: elementAttrs,
            type: elementType,
            metaType: metaType,
            agElementId: agTyping,
            agElementAttrs: agElementAttrs,
            semantics: semantics,
            onMetaDataUpdate: onMetaDataUpdate
        };
        this.setState(state);
    }

    deselectElement() {
        var state = Object.assign({}, this.state);
        state.selectedElement = null;
        this.setState(state);
    }

    onDataUpdate(newData, oldData) {
        var state = Object.assign({}, this.state);
        state.updatedNuggetInfo = newData;
        this.setState(state);
        if (this.props.onDataUpdate) {
            this.props.onDataUpdate(newData, oldData);
        }
    }

    onMetaDataUpdate(newData, oldData) {
        var state = Object.assign({}, this.state);
        state.updatedNuggetMetaData[
            this.state.selectedElement.id] = newData;
        this.setState(state);
        if (this.state.selectedElement.onMetaDataUpdate) {
            this.state.selectedElement.onMetaDataUpdate(newData, oldData);
        }
    }

    onReferenceUpdate(elementId, agElementId) {
        var state = Object.assign({}, this.state);
        state.updatedReferenceElements[elementId] = agElementId;
        this.setState(state);
    }

    onSaveClick() {
        $('#progressBlock').attr('style', 'display: inline-block; padding-top: 10px;');

        // send ajax request to save the updated data
        postDataWithRedirect(this.state, this.props.saveUrl);
    }

    render() {

        var element = Object.assign({}, this.state.selectedElement),
            upToDateAttrs = this.state.selectedElement.attrs;
        element.attrs = upToDateAttrs;
        if (this.state.selectedElement.id in this.state.updatedNuggetMetaData) {
            for (var k in this.state.updatedNuggetMetaData[this.state.selectedElement.id]) {
                if (!(k in upToDateAttrs)) {
                    upToDateAttrs[k] = {};
                    upToDateAttrs[k].type = "FiniteSet";
                }
                upToDateAttrs[k].data = this.state.updatedNuggetMetaData[this.state.selectedElement.id][k];
            }
        }

        return ([
            <div id="nuggetViewWidget">
                <NuggetPreview
                    selectedElement={element}
                    loadedGraph={true}
                    nuggetId={this.props.nuggetId}
                    nuggetDesc={this.props.nuggetDesc}
                    nuggetType={this.props.nuggetType}
                    editable={true}
                    instantiated={this.props.instantiated}
                    readonly={this.props.readonly}
                    onDataUpdate={this.onDataUpdate}
                    onMetaDataUpdate={this.onMetaDataUpdate}
                    onFetchCandidates={this.props.onFetchCandidates}
                    onReferenceUpdate={this.onReferenceUpdate}/>
            </div>,
            <div className="row">
                <a type="button" style={{"margin-top": "20pt"}}
                   onClick={this.onSaveClick}
                   id="addNuggetToTheModel" className="btn btn-primary btn-lg">
                    <span className="glyphicon glyphicon-ok edit-sign"></span> Add to the corpus
                </a>
            </div>,  
            <div className="row">
                <div id="progressBlock" style={{"padding-top": "10px", "display": "none"}}>
                  <div id="progressMessage">Adding nugget to the corpus...</div>
                  <div id="loadingBlock" class="loading-elements center-block">
                    <div id="loader"></div>
                  </div>
                </div>
            </div>
        ]);
    }
}


