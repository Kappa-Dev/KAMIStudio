/**
 * Collection of utils for viewing nuggets.
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
             {dot} {props.nuggetId} <div className="nugget-desc"><p>{props.nuggetDesc}</p></div>
          </a>
        </li>
    );
}


function NuggetList(props) {

    var listItems = props.items.map(
            (item) => <div key={item[0]} id={"nuggetListItem" + item[0]}>
                            <NuggetListItem
                                nuggetId={item[0]}
                                active={item[0] == props.selected ? true: false}
                                nuggetType={item[1]}
                                nuggetDesc={item[2]}
                                onClick={(id, desc, type) => props.onItemClick(id, desc, type)}
                                instantiated={props.instantiated} />
                        </div>);
    return (
        <ul className="nav nuggets-nav list-group-striped list-unstyled components">
            {listItems}
        </ul>
    )
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



class NuggetPreview extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        var message = null,
            fields,
            svgDisplay = "none",
            elementInfoBoxes1 = null,
            elementInfoBoxes2 = null;
        if (!this.props.nuggetId) {
            message = "No nugget selected";
            fields = <EditableBox
                        id="nuggetInfo"
                        name="Nugget info"
                        data={{}}
                        editable={true}
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
            items = items.concat([
                    ["nugget_desc", "Description", this.props.nuggetDesc ? this.props.nuggetDesc : <p className="faded">not specified</p>],
                    [
                        "nugget_type",
                        "Type",
                        this.props.nuggetType == "bnd" ? [<span className="dot dot-bnd"></span>, "Binding"] : [<span className="dot dot-mod"></span>, "Modification"]],
                ]);
            var data = {
                    "nugget_id": this.props.nuggetId,
                    "nugget_desc": this.props.nuggetDesc,
                    "nugget_type": this.props.nuggetType
                };
            fields = <EditableBox
                        id="nuggetInfo"
                        name="Nugget info"
                        data={data}
                        editable={this.props.editable}
                        items={items}
                        noBorders={true}
                        protected={["nugget_id", "nugget_type"]}
                        editable={true}
                        readonly={this.props.readonly}
                        onDataUpdate={this.props.onDataUpdate} />;
            svgDisplay = "inline-block";
            elementInfoBoxes1 = [
                <div className="col-md-6" id="nuggetGraphElementInfo">
                    <ElementInfoBox id="graphElement" items={[]}/>
                </div>,
                <div className="col-md-6" id="nuggetGraphMetaModelInfo">
                    <MetaDataBox readonly={this.props.readonly} id="metaData" items={[]}/>
                </div>
            ];
            var semantics = null;
            if (!this.props.instantiated) {
                semantics = 
                    <div className="col-md-6" id="nuggetGraphSemanticsInfo">
                       <NuggetSemanticBox id="nuggetSemantics"
                                          elementType="edge"
                                          editable={false}
                                          readonly={this.props.readonly}/>
                    </div>;
            }

            elementInfoBoxes2 = [
                <div className="col-md-6" id="nuggetGraphIdentificationInfo">
                    <ReferenceElementBox id="agElement"
                                  readonly={this.props.readonly}
                                  items={[]}/>
                </div>,
                semantics
            ];

        }

        return(
            <div id="nuggetPreview">
                {fields}
                <svg id="nuggetSvg" style={{display: svgDisplay}} preserveAspectRatio="xMinYMin meet"
    viewBox="0 0 500 200" ></svg>
                <div className="row">
                    {elementInfoBoxes1}
                </div>
                <div className="row">
                    {elementInfoBoxes2}
                </div>

            </div>
        );
    }
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