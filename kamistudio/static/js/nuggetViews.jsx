/**
 * Utils for nugget viewing
 */

function turnOnLoader(instantiated) {
    /* Turn on the loader of the nuggets view */
    ReactDOM.render(
        <div id="progressBlock"
             style={{"padding-top": "0pt", "margin-top": "20pt"}}>
            <div id="progressMessage">Loading...</div>
            <div id="loadingBlock" class="loading-elements center-block"
                  style={{"margin-bottom": "20pt"}}>
                <div id={instantiated ? "loaderModel" : "loader"}></div>
            </div>
        </div>,
        document.getElementById("nuggetView")
    );
}

function hideDeleteConfirmationDialog() {
    /* Hide delete nugget confirmation dialog */
    ReactDOM.render(
        null,
        document.getElementById("deleteConfirmationDialog")
    );
}


function showDeleteConfirmationDialog(modelId, nuggetList, instantiated, readonly) {
    /* Show delete nugget confirmation dialog */
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
    /* Nugget removal handler */

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


function viewNugget(model_id, instantiated=false, readonly=false, removeNuggetHandler=null) {

    return function (nugget_id, nugget_desc, nugget_type) {

        function handleNodeClick(nuggetGraph, metaTyping, agTyping,
                                 agNodeAttrs, semantics, instantiated) {
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
                    agTyping[d.id],
                    agNodeAttrs[agTyping[d.id]],
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

        function handleEdgeClick(nuggetGraph, metaTyping, agTyping,
                                 agEdgeAttrs, semantics, instantiated) {
            return function(d, i, el) {
                /** Handler for nugget edge click */
                // deselect all the selected elements

                var svg = d3.select("#nuggetSvg"),
                    edge_attrs = null;

                for (var i = agEdgeAttrs.length - 1; i >= 0; i--) {
                    if ((agEdgeAttrs[i].source == agTyping[d.source.id]) &&
                        (agEdgeAttrs[i].target == agTyping[d.target.id])) {
                        edge_attrs = agEdgeAttrs[i].attrs;
                    }
                }

                nuggetPreview.selectElement(
                    [d.source.id, d.target.id],
                    d.attrs,
                    "edge",
                    [metaTyping[d.source.id], metaTyping[d.target.id]],
                    [agTyping[d.source.id], agTyping[d.target.id]],
                    edge_attrs,
                    null, 
                    updateMetaData(nuggetGraph, [d.source.id, d.target.id], "edge"));

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
            /** Handler for updating graph element meta-data */
            return function(newData, oldData) {
                if (nodeType === "node") {
                    return updateNodeAttrs(graph, d, newData, oldData);
                } else {
                    return updateEdgeAttrs(graph, d, newData, oldData);
                }
            };
        }

        function updateNodeAttrs(graph, d, attrs, oldAttrs) {
            /** Handler for updating node meta-data */
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
            /** Handler for updating edge meta-data */
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
                    agNodeAttrs = data["agNodeAttrs"],
                    agEdgeAttrs = data["agEdgeAttrs"],
                    semantics = data["semantics"],
                    templateRelation = data["templateRelation"];

                var clickHandlers = {
                  "nodeClick": handleNodeClick(
                    nuggetGraph, metaTyping, agTyping, 
                    agNodeAttrs, semantics, instantiated),
                  "edgeClick": handleEdgeClick(
                    nuggetGraph, metaTyping, agTyping,
                    agEdgeAttrs, semantics, instantiated),
                }

                nuggetPreview.setLoadedGraph();

                drawNugget(nuggetGraph, nuggetType, metaTyping, agTyping, templateRelation, 
                           clickHandlers, instantiated);
        });
    }
}

function previewNugget(modelId, desc, type,
   graph, metaTyping, agTyping, agNodeAttrs, agEdgeAttrs,
   templateRel, referenceGenes) {

    /** Nugget preview handler.
     *  
     *  Used when previewing newly created nugget.
     */

    function onFetchCandidates(elementId, metaType) {
        /* Handler of fetching reference candidates */
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

    function handleNodeClick(d, i, el) {
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
            d.id in agTyping ? agTyping[d.id] : null,
            d.id in agTyping ? agNodeAttrs[agTyping[d.id]] : null);

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
    }

    function handleEdgeClick(d, i, el) {
        /** Handler for nugget edge click */
        // deselect all the selected elements

        var svg = d3.select("#nuggetSvg"),
            edge_attrs = null;

        for (var i = agEdgeAttrs.length - 1; i >= 0; i--) {
            if ((agEdgeAttrs[i].source == agTyping[d.source.id]) &&
                (agEdgeAttrs[i].target == agTyping[d.target.id])) {
                edge_attrs = agEdgeAttrs[i].attrs;
            }
        }

        nuggetForm.selectElement(
            [d.source.id, d.target.id],
            d.attrs,
            "edge",
            [metaTyping[d.source.id], metaTyping[d.target.id]],
            [agTyping[d.source.id], agTyping[d.target.id]],
            edge_attrs,
            null);

        var highlight = HIGHLIGHT_COLOR;

        svg.selectAll("circle")
          .attr("stroke-width", 0);
        svg.selectAll(".arrow")
          .style("stroke", d3.rgb("#B8B8B8"))
          .attr("marker-end", "url(#nuggetSvgarrow)");
        d3.select(el)
          .select(".arrow")
          .style("stroke", d3.rgb(highlight))
          .attr("marker-end", "url(#nuggetSvgarrow-selected)");
    }

    // render nugget editing form
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

    // draw the nugget
    drawNugget(
        graph, type, metaTyping,
        agTyping, templateRel,
        {
          "nodeClick": handleNodeClick,
          "edgeClick": handleEdgeClick
        },
        false);
}


function drawNuggetTable(modelId, geneAdjacency, geneLabels, instantiated, readonly) {
    /* Draw nugget table as a heatmap using gene adjacency matrix */

    // get the gene list and sort it in the alphabetic order of gene labels
    var genes = Object.keys(geneLabels);
    function sortByGeneLabel(a, b) {
        if (geneLabels[a] == geneLabels[b]) {
            return 0;
        } else {
            return geneLabels[a] < geneLabels[b] ? -1 : 1;
        }
    }
    genes.sort(sortByGeneLabel);


    // compute a matrix with pairwise nugget counts
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

    // set up heatmap data and color-scale
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
            showscale: false,
            // hoverinfo='skip'
        }
    ];

    // set up heatmap layout
    var layout = {
          autosize: false,
          // width: 500,
          // height: 470,
          width: $("#nuggetView").width(),
          height: $("#nuggetView").width(),
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
            showspikes: true,
            spikesides: false,
            spikethickness: 2,
            spikemode: "across",
            tickvals: genes.map((g) => "g" + g),
            ticktext: genes.map((g) => geneLabels[g])
          },
          yaxis: {
            autorange: "reversed",
            showspikes: true,
            spikethickness: 2,
            spikemode: "across",
            tickvals: genes.map((g) => "g" + g),
            ticktext: genes.map((g) => geneLabels[g])
          },
          dragmode: 'pan'
        };

    Plotly.newPlot(
        'tableSvg', data, layout, 
        {
            scrollZoom: true
        });


    var table = document.getElementById('tableSvg');

    // Make a heatmap responsive
    window.onresize = function() {
      Plotly.relayout(table, {
        width: $("#nuggetView").width(),
        height: $("#nuggetView").width()
      })
    }
    
    // Add a click event on the cells of the heatmap
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


function renderNuggetList(modelId, instantiated, readonly) {
    /* Render nugget list view components */

    return function (data) {
        var nuggets = data["nuggets"],
            nuggetList = [];

        for (var k in nuggets) {
            nuggetList.push([k, nuggets[k][1], nuggets[k][0]]);
        }

        // Render nugget list components
        ReactDOM.render(
            <NuggetListView 
                items={nuggetList}
                onItemClick={viewNugget(
                    modelId, instantiated, readonly, showDeleteConfirmationDialog(
                        modelId, nuggetList, instantiated, readonly))}
                instantiated={instantiated}/>,
            document.getElementById('nuggetView')
        );

        // Render nugget preview components
        ReactDOM.render(
            <NuggetPreview
                instantiated={instantiated}
                readonly={readonly}/>,
            document.getElementById('nuggetViewWidget')
        );
    };
}


function renderNuggetTable(modelId, instantiated, readonly) {
    /* Render nugget table view components */

    return function(data) {
        var interactions = data["interactions"],
            geneLabels = data["geneLabels"];

        // Render nugget table components
        ReactDOM.render(
            <NuggetTable 
                geneAdjacency={interactions}
                onItemClick={viewNugget(modelId, instantiated, readonly)}
                instantiated={instantiated} />,
            document.getElementById('nuggetView')
        );


        // Render nugget preview components
        ReactDOM.render(
            <NuggetPreview 
                instantiated={instantiated}
                readonly={readonly}/>,
            document.getElementById('nuggetViewWidget')
        );

        // Draw nugget table using heatmaps from 'plotly.js'
        drawNuggetTable(modelId, interactions, geneLabels, instantiated, readonly);
    };
}


function showNuggetList(modelId, instantiated, readonly) {
    /* Handler of show nugget list button click */

    $("#selectNuggetListView").addClass("active");
    $("#selectNuggetTableView").removeClass("active");

    turnOnLoader(instantiated);

    // fetch nugget list
    getData(
        modelId + "/nuggets",
        renderNuggetList(modelId, instantiated, readonly));
}


function showNuggetTable(modelId, instantiated, readonly) {
    /* Handler of show nugget table button click */

    $("#selectNuggetTableView").addClass("active");
    $("#selectNuggetListView").removeClass("active");

    turnOnLoader(instantiated);

    // getch gene adjacency data
    getData(
        modelId + "/get-gene-adjacency",
        renderNuggetTable(modelId, instantiated, readonly));
}


function showSelectedNuggetsModal(nuggets, modelId, instantiated, readonly) {
    /* Handler of show modal with selected nuggets */

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
}

