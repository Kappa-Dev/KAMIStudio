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

function NuggetList(props) {
    var content = Object.keys(props.items).map(
        (key, i) => <div id={"nuggetListItem" + key}>
                        <NuggetListItem
                            nuggetId={key}
                            nuggetType={props.items[key][1]}
                            nuggetDesc={props.items[key][0]}
                            onClick={props.onItemClick}
                            instantiated={props.instantiated} />
                    </div>);
    return ([
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
            elementInfoBoxes = null;
        if (!this.props.nuggetId) {
            message = "No nugget selected";
            fields = <EditableBox
                        id="nuggetInfo"
                        name="Nugget info"
                        data={{}}
                        editable={this.props.editable}
                        message={message}
                        items={[]}
                        noBorders={true}
                        protected={["nuggetId"]}
                        editable={true} />;
        } else {

            var items = [
                    ["nugget_id", "Nugget ID", this.props.nuggetId],
                    ["nugget_desc", "Description", this.props.nuggetDesc ? this.props.nuggetDesc : <p className="faded">not specified</p>],
                    [
                        "nugget_type",
                        "Type",
                        this.props.nuggetType == "bnd" ? [<span className="dot dot-bnd"></span>, "Binding"] : [<span className="dot dot-mod"></span>, "Modification"]],
                ],
                data = {
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
                        onDataUpdate={this.props.onDataUpdate} />;
            svgDisplay = "inline-block";
            elementInfoBoxes = [
                <div className="col-md-6" id="nuggetGraphElementInfo">
                    <ElementInfoBox id="graphElement" items={[]}/>
                </div>,
                <div className="col-md-6" id="nuggetGraphMetaModelInfo">
                    <MetaDataBox id="metaData" items={[]}/>
                </div>
            ];
        }

        return(
            <div id="nuggetPreview">
                {fields}
                <svg id="nuggetSvg" style={{display: svgDisplay}} width="500" height="200"></svg>
                <div className="row">
                    {elementInfoBoxes}
                </div>
            </div>
        );
    }
}

function renderNuggetList(modelId, nuggetList, instantiated) {
    console.log(instantiated);
    // TODO: make it fetch nugget list
    $("#selectNuggetListView").addClass("active");
    $("#selectNuggetTableView").removeClass("active");

    ReactDOM.render(
        <NuggetList 
            items={JSON.parse(nuggetList)}
            onItemClick={viewNugget(modelId, instantiated)}
            instantiated={instantiated}/>,
        document.getElementById('nuggetView')
    );

    ReactDOM.render(
        <NuggetPreview 
            instantiated={instantiated}/>,
        document.getElementById('nuggetViewWidget')
    );
}

function renderNuggetTable(modelId, adjacency, instantiated) {
    // TODO: make it fetch nugget table
    $("#selectNuggetTableView").addClass("active");
    $("#selectNuggetListView").removeClass("active");

    var parsedAdjacency = JSON.parse(adjacency);
    ReactDOM.render(
        <NuggetTable 
            geneAdjacency={parsedAdjacency}
            onItemClick={viewNugget(modelId, instantiated)}
            instantiated={instantiated}/>,
        document.getElementById('nuggetView')
    );

    ReactDOM.render(
        <NuggetPreview 
            instantiated={instantiated}/>,
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