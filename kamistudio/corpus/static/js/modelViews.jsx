
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
            <ModelList items={data.items} readonly={readonly} />,
            document.getElementById("modelsView")
        );
        if (modelId) {
            component.setSelectedItem(modelId);
        }
    }
}

class ModelList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: null
        };

        this.onItemClick = this.onItemClick.bind(this);
    }

    onItemClick(item) {
        this.setState({ selected: item });
    }

    setSelectedItemById(itemId) {
        for (var i = Things.length - 1; i >= 0; i--) {
            if (this.props.items[i]["id"] == itemId) {
                this.setState({ selected: this.props.items[i] });
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
            content = <div className="faded">No models</div>;
        }

        // If there is a model selected generate a preview
        if (this.state.selected) {
            // modelPreview = <ModelView id={this.state.selected["id"]}
            //                           name={this.state.selected["meta_data"]["name"]}
            //                           desc={this.state.selected["meta_data"]["desc"]}/>;
            modelPreview = (
                <ModelView readonly={this.props.readonly}
                           model={this.state.selected} />
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
    render() {
        return (
            <div id="modelMetaData" class="model-info-box">
                <ModelMetaDataBox readonly={this.props.readonly}
                                  name={this.props.model["meta_data"]["name"]}
                                  desc={this.props.model["meta_data"]["desc"]}
                                  creation_time={this.props.model["creation_time"]}
                                  last_modified={this.props.model["last_modified"]}/>
                <ContextView expanded={true} id={"contextView"}/>
                <DynamicsView expanded={true} id={"dynamicsView"}/>
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
            <div id="modelMetaData">
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
        var arrow, title, content;
        if (this.state.expanded) {
            arrow = "down";
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
                {this.props.content}
            </div>,
        ]);
    }
}

class ContextView extends React.Component {

    render() {
        
        var content = null;

        return ([
            <Collapsable title={"Context"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>
        ]);
    }
}

class DynamicsView extends React.Component {
    render() {
        
        var content = null;

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
        
        var content = null;

        return ([
            <Collapsable title={"Instantiated view"}
                         id={this.props.id}
                         content={content}
                         expanded={this.props.expanded}/>
        ]);
    }
}