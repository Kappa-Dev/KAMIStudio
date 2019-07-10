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
             {dot} {props.nuggetId} <div className="nugget-desc"><p>{props.nuggetDesc}</p></div>
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
        var listItems = this.props.items.map(
                (item) => <div key={item[0]} id={"nuggetListItem" + item[0]}>
                                <NuggetListItem
                                    nuggetId={item[0]}
                                    active={item[0] == this.state.selected ? true: false}
                                    nuggetType={item[1]}
                                    nuggetDesc={item[2]}
                                    onClick={this.onItemClick}
                                    instantiated={this.props.instantiated} />
                            </div>);
        return (
            <ul className="nav nuggets-nav list-group-striped list-unstyled components">
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
                    selected: this.state.selected
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
                <svg id="nuggetTable" width={size} height={size}></svg>
            </div>,
            <div id="tableNuggetList"></div>
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
                                     elementType="node"
                                     metaType={this.props.metaType}
                                     attrs={this.props.agElementAttrs}
                                     onFetchCandidates={this.props.onFetchCandidates}
                                     onDataUpdate={this.props.onReferenceUpdate}/>
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

    onReferenceUpdate(updatedData) {
       
    }

    render() {

        var message = null,
            fields,
            svgDisplay = "none",
            data = {},
            nuggetElementInfo = null,
            elementInfoBoxes1 = null,
            elementInfoBoxes2 = null;

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
                        onDataUpdate={this.onDataUpdate} />;
            svgDisplay = "inline-block";

            var upToDateAttrs = this.state.selectedElement.attrs;
            if (this.state.selectedElement.id in this.state.updatedNuggetMetaData) {
                for (var k in this.state.updatedNuggetMetaData[this.state.selectedElement.id]) {
                    if (!(k in upToDateAttrs)) {
                        upToDateAttrs[k] = {};
                        upToDateAttrs[k].type = "FiniteSet";
                    }
                    upToDateAttrs[k].data = this.state.updatedNuggetMetaData[this.state.selectedElement.id][k];
                }
            }

            nuggetElementInfo =
                <NuggetElementInfo readonly={this.props.readonly}
                                   instantiated={this.props.instantiated}
                                   elementId={this.state.selectedElement.id}
                                   elementAttrs={upToDateAttrs}
                                   elementType={this.state.selectedElement.type}
                                   metaType={this.state.selectedElement.metaType}
                                   agElementId={this.state.selectedElement.agElementId}
                                   agElementAttrs={this.state.selectedElement.agElementAttrs}
                                   semantics={this.state.selectedElement.semantics}
                                   onMetaDataUpdate={this.onMetaDataUpdate}
                                   onFetchCandidates={this.props.onFetchCandidates}
                                   onReferenceUpdate={this.onReferenceUpdate} />;
        }
        return(
            <div id="nuggetPreview">
                {fields}
                <svg id="nuggetSvg"
                     style={{display: svgDisplay}} 
                     preserveAspectRatio="xMinYMin meet"
                     viewBox="0 0 500 200" ></svg>
                <div id="nuggetElementInfo">
                    {nuggetElementInfo}
                </div>
            </div>
        );
    }
}


// ----------------- Utils for nugget views -----------------

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
                onItemClick={viewNugget(modelId, instantiated, readonly)}
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


function viewNugget(model_id, instantiated=false, readonly=false) {

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

                nuggetPreview.selectElement([d.source.id, d.target.id], "edge");

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

        d3.select("#nuggetSvg").selectAll("*").remove();

        var nuggetPreview = ReactDOM.render(
            <NuggetPreview
                nuggetId={nugget_id}
                nuggetDesc={nugget_desc}
                nuggetType={nugget_type}
                editable={true}
                instantiated={instantiated}
                readonly={readonly}
                onDataUpdate={updateDesc(
                    model_id, nugget_id, instantiated, readonly)}/>,
            document.getElementById('nuggetViewWidget')
        );

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
                  "nodeClick": handleNodeClick(nuggetGraph, metaTyping, agTyping, semantics, instantiated),
                  "edgeClick": handleEdgeClick(nuggetGraph, metaTyping, agTyping, semantics, instantiated),
                }

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

            nuggetPreview.selectElement(
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

    var nuggetPreview = ReactDOM.render(
        <NuggetPreview
                nuggetId={"NA"}
                nuggetDesc={desc}
                nuggetType={type}
                editable={true}
                onFetchCandidates={onFetchCandidates}
                instantiated={false}
                readonly={false}/>,
        document.getElementById('nuggetViewWidget')
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


function drawNuggetTable(modelId, geneAdjacency) {
    var svg = d3.select("#nuggetTable"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

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

    var xlabels = g.selectAll(".xlabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("text-anchor", "start")
                   .attr("x", function(d) {
                        return d.order * 20;
                    })
                     .attr("y", function(d) {
                        return -20;
                    })
                    .attr("transform", function(d) {
                        return "rotate(-90," + d.order * 20 + "," + -5 + ")";
                    })
                   .text(function(d) { return d.label });
         

    var ylabels = g.selectAll(".ylabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("x", function(d) {
                        return -5;
                    })
                     .attr("y", function(d) {
                        return d.order * 20;
                    })
                   .attr("text-anchor", "end")
                   .text(function(d) { return d.label });
    var cell = g.selectAll(".cell")
                 .data(cellData)
                 .enter()
                 .append("rect")
                 .attr("x", function(d) {
                    return d.sourceOrder * 20;
                 })
                 .attr("y", function(d) {
                    return d.targetOrder * 20;
                 })
                 .attr("width", 15)
                 .attr("height", 15)
                 .attr('fill', function(d) {
                    if (d.nuggets.length > 0) {
                        return "#337ab7";
                    } else {
                        return "#FFFFFF";
                    }
                 });
    cell.attr(
          "transform", function(d) {
              // zoom to fit the bounding box
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


function renderNuggetTable(modelId, adjacency, instantiated, readonly) {
    // TODO: make it fetch nugget table
    $("#selectNuggetTableView").addClass("active");
    $("#selectNuggetListView").removeClass("active");

    var parsedAdjacency = JSON.parse(adjacency);
    ReactDOM.render(
        <NuggetTable 
            geneAdjacency={parsedAdjacency}
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

    drawNuggetTable(modelId, parsedAdjacency);

	// // fetch nugget table
	// $.ajax({
	//     url: modelId + "/nugget-table",
	//     type: 'get',
	//     dataType: "json"
	// }).done(function (data) {
	//     var metaData = data["meta_data"];
	//     var pairs = data["pairs"];
    	
 //    	// add svg element
 //    	var svgElement = htmlToElement('<svg id="nuggetTable" width="500" height="500"></svg>');
 //  		parent.appendChild(svgElement);

 //    	drawTable(pairs, metaData);

	// }).fail(function (e) {
	//     console.log("Failed to load nugget table");
	// });

}