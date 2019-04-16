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

    return (
        <li className="not-selected">
          <a className={"nugget-selector" + suffix}
             onClick={() => props.onClick(props.nuggetId, props.nuggetDesc, props.nuggetType)}>
             {dot} {props.nuggetId} <div className="nugget-desc"><p>{props.nuggetDesc}</p></div>
          </a>
        </li>
    );
}

class NuggetList extends React.Component{
    constructor(props) {
        super(props);

        this.filterList = this.filterList.bind(this);

        this.state = {
            initialItems: props.items,
            items : props.items
        }
    }


    filterList(event) {

        var state = Object.assign({}, this.state),
            updatedDict = Object.assign({}, this.state.initialItems);

        var entries = Object.entries(updatedDict).filter(
                function(item) {
                    return item.join(", ").toLowerCase().search(
                        event.target.value.toLowerCase()) !== -1;
                }
            );
        updatedDict = Object.fromEntries(entries);

        state["items"] = updatedDict;
        this.setState(state);
    }

    render() {

        var content = Object.keys(this.state.items).map(
            (key) => <div id={"nuggetListItem" + key}>
                            <NuggetListItem
                                nuggetId={key}
                                nuggetType={this.props.items[key][1]}
                                nuggetDesc={this.props.items[key][0]}
                                onClick={this.props.onItemClick}
                                instantiated={this.props.instantiated} />
                        </div>);

        return ([
            <div className="row">  
                <div className="col-md-12">
                    <input className="form-control search nugget-search" type="text" placeholder="Search" onChange={this.filterList}/>
                </div>
            </div>,
            <div id="nuggetsListView">
                <ul className="nav nuggets-nav list-group-striped list-unstyled components">
                    {content}
                </ul>
            </div>,
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
            elementInfoBoxes2 = [
                <div className="col-md-6" id="nuggetGraphIdentificationInfo">
                    <AGElementBox id="agElement"
                                  readonly={this.props.readonly}
                                  items={[]}/>
                </div>,
                <div className="col-md-6" id="nuggetGraphSemanticsInfo">
                   <NuggetSemanticBox id="nuggetSemantics"
                                      elementType="edge"
                                      editable={false}
                                      readonly={this.props.readonly}/>
                </div>
            ];

        }

        return(
            <div id="nuggetPreview">
                {fields}
                <svg id="nuggetSvg" style={{display: svgDisplay}} width="500" height="200"></svg>
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
        var nuggetList = data["nuggets"];
        $("#selectNuggetListView").addClass("active");
        $("#selectNuggetTableView").removeClass("active");

        ReactDOM.render(
            <NuggetList 
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