/**
 * Collection of utils for viewing nuggets.
 */

// ---------------- Nugget view components ---------------------

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
        var elementInfoBoxes1 = null,
            elementInfoBoxes2 = null,
            semantics = null;
        
        elementInfoBoxes1 = [
            <div className="col-md-6" id="nuggetGraphElementInfo">
                <ElementInfoBox id="graphElement"
                                elementId={this.props.elementId}
                                elementType={this.props.elementType}
                                metaType={this.props.metaType}
                                editable={false}
                                instantiated={this.props.instantiated} />
            </div>,
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
            </div>
        ];

            
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

        elementInfoBoxes2 = [
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
            </div>,
            semantics
        ];

        return ([
            <div className="row">
                {elementInfoBoxes1}
            </div>,
            <div className="row">
                {elementInfoBoxes2}
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
                <div id="deleteConfirmationDialog"></div>
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



// ----------------- Utils for nugget views -----------------

function hideDeleteConfirmationDialog() {
    ReactDOM.render(
        null,
        document.getElementById("deleteConfirmationDialog")
    );
}


function showDeleteConfirmationDialog(modelId, nuggetList, instantiated, readonly) {
    return function(nuggetId) {
        var content = <div style={{"text-align": "center"}}>
                        <h5>
                            {"Are you sure you want to remove the nugget '" + nuggetId + "'?"}
                        </h5>

                        <div style={{"margin-top": "15pt"}}>
                            <button 
                               type="button" onClick={hideDeleteConfirmationDialog}
                               className="btn btn-primary btn-sm panel-button editable-box right-button">
                                Cancel
                            </button>
                            <button 
                               type="button" onClick={() => removeNugget(modelId, nuggetList, instantiated, readonly)(nuggetId)}
                               className="btn btn-default btn-sm panel-button editable-box right-button">
                                Delete
                            </button>
                        </div>
                      </div>;
        ReactDOM.render(
            <Dialog content={content} 
                    title="Delete a nugget"
                    customStyle={{"margin": "150pt auto"}}
                    onRemove={hideDeleteConfirmationDialog}/>,
            document.getElementById("deleteConfirmationDialog")
        );
    };
}


function removeNugget(modelId, nuggetList, instantiated, readonly) {
    return function(nuggetId) {
        // send nugget removal request
        getData(modelId + '/remove-nugget/' + nuggetId);

        // remove nugget from the list
        for( var i = 0; i < nuggetList.length; i++){ 
            if (nuggetList[i][0] === nuggetId) {
                nuggetList.splice(i, 1); 
            }
        }

        hideDeleteConfirmationDialog()

        ReactDOM.render(
            <NuggetListView 
                items={nuggetList}
                onItemClick={viewNugget(modelId, instantiated, readonly)}
                instantiated={instantiated}/>,
            document.getElementById('nuggetView')
        );

        var preview = ReactDOM.render(
            <NuggetPreview
                instantiated={instantiated}
                readonly={readonly}/>,
            document.getElementById('nuggetViewWidget')
        );
        preview.resetLoadedGraph();
    };
}


function renderNuggetList(modelId, instantiated, readonly) {
    // fetch nugget list from the server 
    $.ajax({
        url: modelId + "/nuggets",
        type: 'get',
        dataType: "json",
    }).done(function (data) {
        var nuggets = data["nuggets"],
            nuggetList = [];

        for (var k in nuggets) {
            nuggetList.push([k, nuggets[k][1], nuggets[k][0]]);
        }

        $("#selectNuggetListView").addClass("active");
        $("#selectNuggetTableView").removeClass("active");

        ReactDOM.render(
            <NuggetListView 
                items={nuggetList}
                onItemClick={viewNugget(
                    modelId, instantiated, readonly, showDeleteConfirmationDialog(
                        modelId, nuggetList, instantiated, readonly))}
                instantiated={instantiated}/>,
            document.getElementById('nuggetView')
        );

        ReactDOM.render(
            <NuggetPreview
                instantiated={instantiated}
                readonly={readonly}/>,
            document.getElementById('nuggetViewWidget')
        );
    }).fail(function (e) {
        console.log("Failed to load nuggets");
    });
}


function viewNugget(model_id, instantiated=false, readonly=false, removeNuggetHandler=null) {

    return function (nugget_id, nugget_desc, nugget_type) {

        function handleNodeClick(nuggetGraph, metaTyping, agTyping, semantics, instantiated) {
            return function(d, i, el) {
                /** Handler for nugget node click */
                var nodeSemantics = null;

                if (!instantiated) {
                    nodeSemantics = {};
                    for (var sname in semantics) {
                        for (var node in semantics[sname]) {
                          if (node == d.id) {
                            nodeSemantics[sname] = semantics[sname][node];
                          }
                        }
                    }
                }

                nuggetPreview.selectElement(
                    d.id, d.attrs, "node",
                    metaTyping[d.id],
                    agTyping[d.id][0],
                    agTyping[d.id][1],
                    nodeSemantics,
                    updateMetaData(nuggetGraph, d, "node"));

                var svg = d3.select("#nuggetSvg");

                var highlight;
                if (instantiated) {
                    highlight = INSTANCE_HIGHLIGHT_COLOR;
                } else {
                    highlight = HIGHLIGHT_COLOR;
                }

                svg.selectAll(".arrow")
                    .style("stroke", d3.rgb("#B8B8B8"))
                    .attr("marker-end", "url(#nuggetSvgarrow)");
                svg.selectAll("circle")
                    .attr("stroke-width", 0);
                // select current element
                d3.select(el)
                      .attr("stroke-width", 2)
                      .attr("stroke", d3.rgb(highlight));
            };
        }

        function handleEdgeClick(nuggetGraph, metaTyping, agTyping, semantics, instantiated) {
            return function(d, i, el) {
                /** Handler for nugget edge click */
                // deselect all the selected elements
                var svg = d3.select("#nuggetSvg");

                nuggetPreview.selectElement(
                    [d.source.id, d.target.id],
                    d.attrs,
                    "edge");

                var highlight;
                  if (instantiated) {
                    highlight = INSTANCE_HIGHLIGHT_COLOR;
                  } else {
                    highlight = HIGHLIGHT_COLOR;
                  }

                svg.selectAll("circle")
                  .attr("stroke-width", 0);
                svg.selectAll(".arrow")
                  .style("stroke", d3.rgb("#B8B8B8"))
                  .attr("marker-end", "url(#nuggetSvgarrow)");
                d3.select(el)
                  .select(".arrow")
                  .style("stroke", d3.rgb(highlight))
                  .attr("marker-end", "url(#nuggetSvgarrow-selected)");
            };
        }

        function updateMetaData(graph, d, nodeType) {
            return function(newData, oldData) {
                if (nodeType === "node") {
                    return updateNodeAttrs(graph, d, newData, oldData);
                } else {
                    return updateEdgeAttrs(graph, d, newData, oldData);
                }
            };
        }

        function updateNodeAttrs(graph, d, attrs, oldAttrs) {
            for (var i=0; i < graph.nodes.length; i++) {
              if (graph.nodes[i].id === d.id) {
                for (var k in attrs) {
                  // modify js graph object 
                  if (k in graph.nodes[i].attrs) {
                    graph.nodes[i].attrs[k].data = attrs[k];
                  } else {
                    graph.nodes[i].attrs[k] = {
                      data: attrs[k],
                      type: "FiniteSet"
                    };
                  }
                }
                // send attr update to the server
                sendUpdateNuggetNodeAttrs(model_id, nugget_id, d.id, graph.nodes[i].attrs);
              }
            }
        }

        function updateEdgeAttrs(graph, d, attrs, oldAttrs) {
            for (var i=0; i < graph.links.length; i++) {
              if ((graph.links[i].source.id === d.source.id) &&
                (graph.links[i].target.id === d.target.id)) {
                for (var k in attrs) {
                  // modify js graph object 
                  if (k in graph.links[i].attrs) {
                    graph.links[i].attrs[k].data = attrs[k];
                  } else {
                    graph.links[i].attrs[k] = {
                      data: attrs[k],
                      type: "FiniteSet"
                    };
                  }
                  
                }
                // re-render updated boxes
                handleEdgeClick(d, i);
                // send attr update to the server
                sendUpdateNuggetEdgeAttrs(
                    model_id, nugget_id, d.source.id, d.target.id,
                    graph.links[i].attrs);
              }
            }
        }

        function updateDesc(modelId, nuggetId,  instantiated, readonly) {
            /** Handler of nugget description update */
            return function(data, oldData) {
                // send attr update to the server
                var desc = ("nugget_desc" in data) ? data["nugget_desc"] : oldData["nugget_desc"];
                sendUpdateNuggetDesc(model_id, nugget_id, desc);
            };
        }

        var nuggetPreview = ReactDOM.render(
            <NuggetPreview
                selectedElement={{}}
                nuggetId={nugget_id}
                nuggetDesc={nugget_desc}
                nuggetType={nugget_type}
                editable={true}
                instantiated={instantiated}
                readonly={readonly}
                onRemove={removeNuggetHandler}
                onDataUpdate={updateDesc(
                    model_id, nugget_id, instantiated, readonly)}/>,
            document.getElementById('nuggetViewWidget')
        );

        nuggetPreview.resetLoadedGraph();

        // use AJAX to send request for retrieving the nugget data
        $.get(model_id + "/raw-nugget/" + nugget_id,
              function(data, status) {
                var nuggetGraph = data["nuggetJson"],
                    nuggetType = data["nuggetType"],
                    metaTyping = data["metaTyping"],
                    agTyping = data["agTyping"],
                    semantics = data["semantics"],
                    templateRelation = data["templateRelation"];

                var clickHandlers = {
                  "nodeClick": handleNodeClick(
                    nuggetGraph, metaTyping, agTyping, semantics, instantiated),
                  "edgeClick": handleEdgeClick(
                    nuggetGraph, metaTyping, agTyping, semantics, instantiated),
                }

                nuggetPreview.setLoadedGraph();

                d3.select("nuggetSvg").selectAll("*").remove();

                drawNugget(nuggetGraph, nuggetType, metaTyping, agTyping, templateRelation, 
                           clickHandlers, instantiated);
        });
    }
}


function previewNugget(modelId, desc, type,
   graph, metaTyping, agTyping, templateRel,
   referenceGenes) {

    function onFetchCandidates(elementId, metaType) {
        return function(el) {
            var url = "/fetch-reference-candidates/" + modelId + "/" + metaType;
            $.ajax({
                url: url,
                type: "post",
                data: JSON.stringify({
                  "originalRefElement": (elementId in agTyping) ? agTyping[elementId] : null,
                  "genes": referenceGenes[elementId]
                }),
                dataType: "json",
                contentType: 'application/json',
            }).done(
              function(data) {
                var state = {
                  "candidates": data["candidates"]
                };
                el.setState(state);
              }
            ).fail(function (e) {
                console.log("Failed to load genes");
            });
        }
    }

    function handleNodeClick(nuggetGraph, metaTyping) {
        return function(d, i, el) {
            /** Handler for nugget node click */
            // var nodeSemantics = null;

            // nodeSemantics = {};
            // for (var sname in semantics) {
            //     for (var node in semantics[sname]) {
            //       if (node == d.id) {
            //         nodeSemantics[sname] = semantics[sname][node];
            //       }
            //     }
            // }

            nuggetForm.selectElement(
                d.id, d.attrs, "node",
                metaTyping[d.id],
                d.id in agTyping ? agTyping[d.id][0] : null,
                d.id in agTyping ? agTyping[d.id][1] : null);

            var svg = d3.select("#nuggetSvg");

            var highlight = HIGHLIGHT_COLOR;

            svg.selectAll(".arrow")
                .style("stroke", d3.rgb("#B8B8B8"))
                .attr("marker-end", "url(#nuggetSvgarrow)");
            svg.selectAll("circle")
                .attr("stroke-width", 0);
            // select current element
            d3.select(el)
                  .attr("stroke-width", 2)
                  .attr("stroke", d3.rgb(highlight));
        };
    }

    function handleEdgeClick(nuggetGraph, metaTyping) {
    }

    var nuggetForm = ReactDOM.render(
        <NuggetEditingBox
                nuggetId={"NA"}
                nuggetDesc={desc}
                nuggetType={type}
                editable={true}
                onFetchCandidates={onFetchCandidates}
                instantiated={false}
                saveUrl={"add-generated-nugget"}
                readonly={false}/>,
        document.getElementById('nuggetEditingBox')
    );

    drawNugget(
        graph, type, metaTyping,
        agTyping, templateRel,
        {
          "nodeClick": handleNodeClick(graph, metaTyping),
          "edgeClick": handleEdgeClick(graph, metaTyping)
        },
        false);
}


function showSelectedNuggetsModal(nuggets, modelId, instantiated, readonly) {
    function removeNuggetListModal() {
        ReactDOM.render(
            null,
            document.getElementById("tableNuggetList")
        );
    };

    var nuggetList = <NuggetListView 
        items={nuggets}
        onItemClick={viewNugget(
                 modelId, instantiated, readonly, showDeleteConfirmationDialog(
                 modelId, nuggets, instantiated, readonly))}
        height={"60%"}
        instantiated={instantiated}/>;

    ReactDOM.render(
        <InBlockDialog id="selectedNuggets"
                       title="Selected nuggets"
                       onRemove={removeNuggetListModal}
                       content={nuggetList} />,
        document.getElementById("tableNuggetList")
    );
    // ReactDOM.render(
    //     <NuggetListView 
    //         items={nuggetList}
    //         onItemClick={viewNugget(
    //             modelId, instantiated, readonly, showDeleteConfirmationDialog(
    //                 modelId, nuggetList, instantiated, readonly))}
    //         instantiated={instantiated}/>,
    //     document.getElementById('nuggetView')
    // );

    // ReactDOM.render(
    //     <NuggetPreview
    //         instantiated={instantiated}
    //         readonly={readonly}/>,
    //     document.getElementById('nuggetViewWidget')
    // );
}


function newDrawNuggetTable(modelId, geneAdjacency, geneLabels, instantiated, readonly) {

    var genes = [];
    for (var k in geneAdjacency) {
        if (!genes.includes(k)) {
            genes.push(k.toString());
        } 
        for (var kk in geneAdjacency[k]) {
            if (!genes.includes(kk)) {
                genes.push(kk.toString());
            }
        }
    }

    function sortByGeneLabel(a, b) {
        if (geneLabels[a] == geneLabels[b]) {
            return 0;
        } else {
            return geneLabels[a] < geneLabels[b] ? -1 : 1;
        }
    }

    genes.sort(sortByGeneLabel);

    var nuggetCounts = [];
    for (var i = 0; i < genes.length; i++) {
        nuggetCounts.push(new Array(genes.length).fill(0));
    };

    var gene1, gene2;
    for (var i = 0; i < genes.length; i++) {
        gene1 = genes[i];
        for (var j = i; j < genes.length; j++) {
            gene2 = genes[j];
            if (gene1 in geneAdjacency) {
                if (gene2 in geneAdjacency[gene1]) {
                    nuggetCounts[i][j] = geneAdjacency[gene1][gene2].length;
                    nuggetCounts[j][i] = geneAdjacency[gene1][gene2].length;
                }
            } else if (gene2 in geneAdjacency) {
                if (gene1 in geneAdjacency[gene2]) {
                    nuggetCounts[i][j] = geneAdjacency[gene2][gene1].length;
                    nuggetCounts[j][i] = geneAdjacency[gene2][gene1].length;
                }
            }
        }
    }

    var maxNuggets = Math.max(...nuggetCounts.map((el) => Math.max(...el))),
        data = [
        {
            z: nuggetCounts,
            x: genes.map((g) => "g" + g),
            y: genes.map((g) => "g" + g),
            nuggets: geneAdjacency,
            hovertemplate: '<i>Nuggets found:</i> %{z}',
            type: 'heatmap',
            xgap : 3,
            ygap : 3,
            colorscale: [
                [0, 'rgb(218, 227, 236)'],
                [1.0 / maxNuggets, 'rgb(51, 122, 183)'],
                [1, 'rgb(51, 122, 183)']
            ],
            showscale: false
        }
    ];
    var layout = {
          autosize: false,
          width: 500,
          height: 470,
          margin: {
            l: 70,
            r: 30,
            b: 30,
            t: 70,
            pad: 4
          },
          plot_bgcolor: "#fff",
          xaxis: {
            side: "top",
            // mirror: "allticks",
            showspikes: true,
            // spikecolor: '#337ab7',
            spikesides: false,
            spikethickness: 2,
            // spikedash: "solid",
            spikemode: "across",
            // linecolor: "#fff",
            tickvals: genes.map((g) => "g" + g),
            ticktext: genes.map((g) => geneLabels[g])
          },
          yaxis: {
            // mirror: "allticks",
            autorange: "reversed",
            showspikes: true,
            // spikecolor: '#337ab7',
            // spikesides: false,
            spikethickness: 2,
            // spikedash: "solid"
            // showcrossline: true
            spikemode: "across",
            // linecolor: "#fff",
            tickvals: genes.map((g) => "g" + g),
            ticktext: genes.map((g) => geneLabels[g])
          },
          dragmode: 'pan'
        };

    Plotly.newPlot('tableSvg', data, layout, {scrollZoom: true});
    var table = document.getElementById('tableSvg');
    table.on('plotly_click', function(data){
        if (data.points[0].z != 0) {
            var nuggets = [],
                gene1 = data.points[0].x.substring(1),
                gene2 = data.points[0].y.substring(1);

            if (gene1 in data.points[0].data.nuggets) {
                if (gene2 in data.points[0].data.nuggets[gene1]) {
                    nuggets = data.points[0].data.nuggets[gene1][gene2];
                }
            } 

            if (gene2 in data.points[0].data.nuggets) {
                if (gene1 in data.points[0].data.nuggets[gene2]) {
                    nuggets = data.points[0].data.nuggets[gene2][gene1];
                }
            }

            showSelectedNuggetsModal(nuggets, modelId, instantiated, readonly);
        }
    });
}


function drawNuggetTable(modelId, geneAdjacency) {
    var svg = d3.select("#nuggetTable"),
        viewBox = svg.attr("viewBox").split(" "),
        width = +viewBox[2],
        height = +viewBox[3];

    var g = svg.append("g")
        .attr("class", "everything");

    var zoom = d3.zoom()
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, Infinity])
        .on("zoom", zoomed);

    svg.call(zoom);

    var i = 1;
    var indexedLabels = [];
    for (var gene in geneAdjacency) {
        indexedLabels.push([gene, i]);
        i += 1;
    }   

    indexedLabels.sort(function(left, right) {
      return left[0] < right[0] ? -1 : 1;
    });

    var orders = {};
    var labelsData = [];
    for (var i=0; i < indexedLabels.length; i++) {
        orders[indexedLabels[i][0]] = indexedLabels[i][1];
        labelsData.push({
            "label": indexedLabels[i][0],
            "order": indexedLabels[i][1],
        })
    }

    var cellSize = 20,
        squareSize = 19;
    var cellData = [];
    for (var k in geneAdjacency) {
        for (var i=0; i < geneAdjacency[k][0].length; i++) {
            cellData.push({
                "source": k,
                "target": geneAdjacency[k][0][i],
                "nuggets": geneAdjacency[k][1][i],
                "sourceOrder": orders[k],
                "targetOrder": orders[geneAdjacency[k][0][i]] 
            })
        }
    }

    var ylabels = g.selectAll(".xlabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("text-anchor", "start")
                   .attr("x", function(d) {
                        return d.order * cellSize;
                    })
                     .attr("y", function(d) {
                        return ;
                    })
                    .attr("transform", function(d) {
                        return "rotate(-90," + 
                            (d.order * cellSize  + 3 * cellSize / 4.0) +
                            "," + 0 + ")";
                    })
                   .text(function(d) { return d.label });

    var xlabels = g.selectAll(".ylabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("x", function(d) {
                        return cellSize - 2;
                    })
                     .attr("y", function(d) {
                        return d.order * cellSize + 3 * cellSize / 4;
                    })
                   .attr("text-anchor", "end")
                   .text(function(d) { return d.label });

    var cell = g.selectAll(".cell")
                 .data(cellData)
                 .enter()
                 .append("rect")
                 .attr("x", function(d) {
                    return d.sourceOrder * cellSize;
                 })
                 .attr("y", function(d) {
                    return d.targetOrder * cellSize;
                 })
                 .attr("width", squareSize)
                 .attr("height", squareSize)
                 .attr('fill', function(d) {
                    if (d.nuggets.length > 0) {
                        return "#337ab7";
                    } else {
                        return "#FFFFFF";
                    }
                 })
                .on("mouseover", function(d) {
                    // hgrid.filter((e) => e.order == d.targetOrder)
                    d3.select("#hgrid" + d.targetOrder)
                         .style("opacity", 1)
                         .raise();
                    // vgrid.filter((e) => e.order == d.sourceOrder)
                    d3.select("#vgrid" + d.sourceOrder)
                         .style("opacity", 1)
                         .raise();
                    cell.raise();
                    xlabels.raise();
                    ylabels.raise();
                })
                .on("mouseout", function(d) {
                    // hgrid.filter((e) => e.order == d.targetOrder)
                    d3.select("#hgrid" + d.targetOrder)
                         .style("opacity", 0);
                    d3.select("#vgrid" + d.sourceOrder)
                    // vgrid.filter((e) => e.order == d.sourceOrder)
                         .style("opacity", 0);
                    cell.raise();
                });

    var boundaries = g.node().getBBox(),
        bx = boundaries.x,
        by = boundaries.y,
        bheight = boundaries.height,
        bwidth = boundaries.width;

    var hgrid = g.selectAll(".horizontal-bar")
                .data(labelsData)
                .enter()
                .append("line")
                .attr("id", function(d) { return "hgrid" + d.order; })
                .attr("class", ".horizontal-bar")
                .attr("x1", bx)
                .attr("y1",  function(d) {
                    return d.order * cellSize + cellSize / 2 - (cellSize - squareSize) / 2;
                })        
                .attr("x2", bx + bwidth)             
                .attr("y2", function(d) {
                    return d.order * cellSize + cellSize / 2 - (cellSize - squareSize) / 2;
                })
                .attr("stroke-width", squareSize)
                // .attr("stroke", "#ddd");
                .attr("stroke", "#dae3ec")
                .style("opacity", 0);

    var vgrid = g.selectAll(".vertical-bar")
                .data(labelsData)
                .enter()
                .append("line")
                .attr("id", function(d) { return "vgrid" + d.order; })
                .attr("class", ".vertical-bar")
                .attr("x1", function(d) {
                    return d.order * cellSize + cellSize / 2 - (cellSize - squareSize) / 2;
                })
                .attr("y1", by)        
                .attr("x2", function(d) {
                    return d.order * cellSize + cellSize / 2 - (cellSize - squareSize) / 2;
                })             
                .attr("y2", by + bheight)
                .attr("stroke-width", squareSize)
                // .attr("stroke", "#ddd");
                .attr("stroke", "#dae3ec")
                .style("opacity", 0);

    xlabels.raise();
    ylabels.raise();
    cell.raise();

    xlabels.on("mouseover", function(d) {
                hgrid.filter((e) => e.order == d.order)
                     .style("opacity", 1);
            })
           .on("mouseout", function(d) {
                hgrid.filter((e) => e.order == d.order)
                     .style("opacity", 0);
            });

    ylabels.on("mouseover", function(d) {
                vgrid.filter((e) => e.order == d.order)
                     .style("opacity", 1);
            })
           .on("mouseout", function(d) {
                vgrid.filter((e) => e.order == d.order)
                     .style("opacity", 0);
            });


    cell.attr(
          "transform", function(d) {
              // zoom to fit the bounding box
              var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
              svg  
                .attr("viewBox", updatedView)  
                .attr("preserveAspectRatio", "xMidYMid meet")  
                .call(zoom);
                return "translate(" + d.x + "," + d.y + ")"; 
            });

    function zoomed() {
        var boundaries = g.node().getBBox(),
                  bx = boundaries.x,
                  by = boundaries.y,
                  bheight = boundaries.height,
                  bwidth = boundaries.width;
              var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
              svg  
                .attr("viewBox", updatedView)  
                .attr("preserveAspectRatio", "xMidYMid meet")  
                .call(zoom);
        // var = d3.event,

        // console.log(d3.event.scale, d3.event.transform);
        // var e = d3.event,
        //     tx = Math.min(0, Math.max(e.transform.x, width - width * e.transform.k)),
        //     ty = Math.min(0, Math.max(e.transform.y, height - height * e.transform.k));
        //     // then, update the zoom behavior's internal translation, so that
        //     // it knows how to properly manipulate it on the next movement
        //     // zoom.translate([tx, ty]);
        //     // and finally, update the <g> element's transform attribute with the
        //     // correct translation and scale (in reverse order)
        //     g.attr("transform", 
        //            {"x": tx, "y": ty, "k": e.transform.k});
        //         // [
        //         //       "translate(" + [tx, ty] + ")",
        //         //       "scale(" + e.transform.k + ")"
        //         //         ].join(" "));
        g.attr("transform", d3.event.transform); // updated for d3 v4
    }
}

function showNuggetTable(modelId, instantiated, readonly) {
    $("#selectNuggetTableView").addClass("active");
    $("#selectNuggetListView").removeClass("active");

    // getch gene data
    getData(
        modelId + "/get-gene-adjacency",
        renderNuggetTable(modelId, instantiated, readonly));
    document.getElementById("selectNuggetTableView").onclick = showNuggetTable;
}


function renderNuggetTable(modelId, instantiated, readonly) {
    return function(data) {
        var interactions = data["interactions"],
            geneLabels = data["geneLabels"];
        ReactDOM.render(
            <NuggetTable 
                geneAdjacency={interactions}
                onItemClick={viewNugget(modelId, instantiated, readonly)}
                instantiated={instantiated} />,
            document.getElementById('nuggetView')
        );

        ReactDOM.render(
            <NuggetPreview 
                instantiated={instantiated}
                readonly={readonly}/>,
            document.getElementById('nuggetViewWidget')
        );
        newDrawNuggetTable(modelId, interactions, geneLabels, instantiated, readonly);
    };
}