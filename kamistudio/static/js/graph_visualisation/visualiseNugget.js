/**
 * Utils for nugget visualisation
 * 
 */


var PRETTY_SEMANTIC_NUGGET_NAMES = {
  "sh2_pY_binding_semantic_nugget": "SH2 pY binding",
  "phosphorylation_semantic_nugget": "Phosphorylation"
};

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}


function computeFixedPositions(width, height, graph, nuggetType, templateRelation) {
  var fixedPositions = {},
      toFix = [];
  if (nuggetType == "mod") {
    var enzymeNode = templateRelation["enzyme"];
    var substrateNode = templateRelation["substrate"];
    var modState = templateRelation["mod_state"];
    var modNode = templateRelation["mod"];

    if (enzymeNode !== substrateNode) {
      var baseLineY = height * 0.5;
      var enzymeX = width * 0.175;
      var enzymeY = baseLineY;
      var substrateX = width - width * 0.175;
      var substrateY = baseLineY;
      var modX = width * 0.5;
      var modY = baseLineY;
      // var modStateX = width * 0.625;
      // var modStateY = baseLineY;

      if ("enzyme_site" in templateRelation) {
        if ("enzyme_region" in templateRelation) {
          fixedPositions[templateRelation["enzyme_region"]] = 
            [enzymeX + (modX - enzymeX) * 0.33, baseLineY];
            fixedPositions[templateRelation["enzyme_site"]] =
              [enzymeX + (modX - enzymeX) * 0.66, baseLineY];  
        } else {
          fixedPositions[templateRelation["enzyme_site"]] =
            [enzymeX + (modX - enzymeX) * 0.5, baseLineY];
        }
      } else if ("enzyme_region" in templateRelation) {
        fixedPositions[templateRelation["enzyme_region"]] = 
          [enzymeX + (modX - enzymeX) * 0.5, baseLineY];
      }


      if ("substrate_residue" in templateRelation) {
        if ("substrate_site" in templateRelation) {
          if ("substrate_region" in templateRelation) {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.2, baseLineY];
            fixedPositions[templateRelation["substrate_residue"]] = 
              [modX + (substrateX - modX) * 0.4, baseLineY * 0.5];
            fixedPositions[templateRelation["substrate_site"]] =
              [modX + (substrateX - modX) * 0.6, baseLineY * 0.5];
            fixedPositions[templateRelation["substrate_region"]] =
              [modX + (substrateX - modX) * 0.8, baseLineY];
          } else {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.25, baseLineY];
            fixedPositions[templateRelation["substrate_residue"]] = 
              [modX + (substrateX - modX) * 0.5, baseLineY * 0.5];
            fixedPositions[templateRelation["substrate_site"]] =
              [modX + (substrateX - modX) * 0.75, baseLineY * 0.5];
          }
        } else if ("substrate_region" in templateRelation) {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.25, baseLineY];
            fixedPositions[templateRelation["substrate_residue"]] = 
              [modX + (substrateX - modX) * 0.5, baseLineY * 0.5];
            fixedPositions[templateRelation["substrate_region"]] =
              [modX + (substrateX - modX) * 0.75, baseLineY];
        } else {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.33, baseLineY];
            fixedPositions[templateRelation["substrate_residue"]] = 
              [modX + (substrateX - modX) * 0.66, baseLineY * 0.5];
        }
      } else {
        if ("substrate_site" in templateRelation) {
          if ("substrate_region" in templateRelation) {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.25, baseLineY];
            fixedPositions[templateRelation["substrate_site"]] =
              [modX + (substrateX - modX) * 0.5, baseLineY * 0.5];
            fixedPositions[templateRelation["substrate_region"]] =
              [modX + (substrateX - modX) * 0.75, baseLineY];
          } else {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.33, baseLineY];
            fixedPositions[templateRelation["substrate_site"]] =
              [modX + (substrateX - modX) * 0.66, baseLineY * 0.5];
          }
        } else if ("substrate_region" in templateRelation) {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.33, baseLineY];
            fixedPositions[templateRelation["substrate_region"]] =
              [modX + (substrateX - modX) * 0.66, baseLineY];
        } else {
            fixedPositions[modState] =
              [modX + (substrateX - modX) * 0.5, baseLineY];
        }
      }
    } else {
      var baseLineY = height * 0.75;
      var enzymeX = width * 0.5;
      var enzymeY = baseLineY;
      var modX = width * 0.5;
      var modY = height * 0.25;
      var modStateX = width * 0.625;
      var modStateY = height * 0.625;

    }
    fixedPositions[enzymeNode] = [enzymeX, enzymeY];
    // toFix.push(enzymeNode);
    fixedPositions[substrateNode] = [substrateX, substrateY];
    // toFix.push(substrateNode);
    fixedPositions[modNode] = [modX, modY];
    // toFix.push(modNode);
  } else {
    var leftNode = templateRelation["left_partner"];
    var rightNode = templateRelation["right_partner"];
    var bnd = templateRelation["bnd"];

    var baseLineY = height * 0.5;
    var leftX = width * 0.175;
    var leftY = baseLineY;
    var rightX = width - width * 0.175;
    var rightY = baseLineY;
    var bndX = width * 0.5;
    var bndY = baseLineY;

    if ("left_partner_site" in templateRelation) {
      if ("left_partner_region" in templateRelation) {
        fixedPositions[templateRelation["left_partner_region"]] =
          [leftX + (bndX - leftX) * 0.33, baseLineY];
        fixedPositions[templateRelation["left_partner_site"]] = 
          [leftX + (bndX - leftX) * 0.66, baseLineY];
      } else {
        fixedPositions[templateRelation["left_partner_site"]] = 
          [leftX + (bndX - leftX) * 0.5, baseLineY];
      }
    } else if ("left_partner_region" in templateRelation) {
      fixedPositions[templateRelation["left_partner_region"]] =
          [leftX + (bndX - leftX) * 0.5, baseLineY];
    }

    if ("right_partner_site" in templateRelation) {
      if ("right_partner_region" in templateRelation) {
        fixedPositions[templateRelation["right_partner_region"]] =
          [bndX + (rightX - bndX) * 0.66, baseLineY];
        fixedPositions[templateRelation["right_partner_site"]] = 
          [bndX + (rightX - bndX) * 0.33, baseLineY];
      } else {
        fixedPositions[templateRelation["right_partner_site"]] = 
          [bndX + (rightX - bndX) * 0.5, baseLineY];
      }
    } else if ("right_partner_region" in templateRelation) {
      fixedPositions[templateRelation["right_partner_region"]] =
          [bndX + (rightX - bndX) * 0.5, baseLineY];
    }

    fixedPositions[leftNode] = [leftX, leftY];
    // toFix.push(leftNode);
    fixedPositions[rightNode] = [rightX, rightY];
    // toFix.push(rightNode);
    fixedPositions[bnd] = [bndX, bndY];
    // toFix.push(bnd);
  }

  for (var i=0; i < graph.links.length; i++) {
    if (!(graph.links[i].source in fixedPositions) && (graph.links[i].target in fixedPositions)) {
      fixedPositions[graph.links[i].source] = fixedPositions[graph.links[i].target];
    }
  }

  return [fixedPositions, toFix];
}



function sendNuggetDescUpdate(modelId, nuggetId, desc) {
  $.ajax({
      url:  modelId + "/nugget/" + nuggetId + "/update-nugget-desc",
      type: 'post',
      data: JSON.stringify({
        "nugget_id": nuggetId,
        "desc": desc
      }),
      dataType: 'json',
      contentType: 'application/json',
  }).done(function () {
    // if (successCallback) successCallback();
  }).fail(function (xhr, status, error) {
    console.log("Failed to update nugget description");
    console.log(error);
    // if (failCallback) failCallback();
  });
}


function renderNuggetBox(modelId, nuggetId, data, oldData, instantiated, readonly) {
  var desc = ("nugget_desc" in data) ? data["nugget_desc"] : oldData["nugget_desc"];
  
  ReactDOM.render(
      <NuggetPreview
          nuggetId={oldData["nugget_id"]}
          nuggetDesc={desc}
          nuggetType={oldData["nugget_type"]}
          readonly={readonly}
          onDataUpdate={updateNuggetDesc(modelId, nuggetId, instantiated, readonly)}/>,
      document.getElementById('nuggetViewWidget')
  );
  ReactDOM.render(
      <NuggetListItem
          nuggetId={oldData["nugget_id"]}
          nuggetDesc={desc}
          nuggetType={oldData["nugget_type"]}
          instantiated={instantiated}
          onDataUpdate={() => viewNugget(model_id, instantiated)(oldData["nugget_id"], desc, oldData["nugget_type"])}/>,
      document.getElementById("nuggetListItem" + nuggetId)
  );
};


function updateNuggetDesc(model_id, nugget_id, instantiated, readonly) {
  return function(data, oldData) {
      // re-render info-boxes
      renderNuggetBox(model_id, nugget_id, data, oldData, instantiated, readonly); 
      // send attr update to the server
      var desc = ("nugget_desc" in data) ? data["nugget_desc"] : oldData["nugget_desc"];
      sendNuggetDescUpdate(
        model_id, nugget_id, desc);
  };
}


function sendUpdateNuggetNodeAttrs(modelId, nuggetId, nodeId, attrs, successCallback) {
  $.ajax({
      url:  modelId + "/nugget/" + nuggetId +"/update-node-attrs",
      type: 'post',
      data: JSON.stringify({
        "id": nodeId,
        "attrs": attrs
      }),
      dataType: 'json',
      contentType: 'application/json',
  }).done(function () {
    // if (successCallback) successCallback();
  }).fail(function (xhr, status, error) {
    console.log("Failed to update nugget node attributes");
    console.log(error);
    // if (failCallback) failCallback();
  });
}


function sendUpdateNuggetEdgeAttrs(modelId, nuggetId, sourceId, targetId, attrs) {
  $.ajax({
      url:  modelId + "/nugget/" + nuggetId + "/update-edge-attrs",
      type: 'post',
      data: JSON.stringify({
        "source": sourceId,
        "target": targetId,
        "attrs": attrs
      }),
      dataType: 'json',
      contentType: 'application/json',
  }).done(function () {
    // if (successCallback) successCallback();
  }).fail(function (xhr, status, error) {
    console.log("Failed to update new node positions");
    console.log(error);
    // if (failCallback) failCallback();
  });
}

function updateNuggetNodeAttrs(model_id, nugget_id, instantiated, graph, metaTyping, readonly, d, i) {
  return function(attrs, oldAttrs) {
    for (var i=0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].id === d.id) {
        for (var k in attrs) {
          // modify js graph object 
          if (k in graph.nodes[i].attrs) {
            graph.nodes[i].attrs[k].data = [attrs[k]];
          } else {
            graph.nodes[i].attrs[k] = {
              data: [attrs[k]],
              type: "FiniteSet"
            };
          }
        }
        // re-render info-boxes
        handleNuggetNodeClick(
          model_id, nugget_id, instantiated, graph, metaTyping, readonly)(d, i); 
        // send attr update to the server
        sendUpdateNuggetNodeAttrs(
          model_id, nugget_id, d.id, graph.nodes[i].attrs);
      }
    }
    
  };
}

function updateNuggetEdgeAttrs(model_id, nugget_id, instantiated, graph, metaTyping, readonly, d, i) {
  return function(attrs, oldAttrs) {
    for (var i=0; i < graph.links.length; i++) {
      if ((graph.links[i].source.id === d.source.id) &&
        (graph.links[i].target.id === d.target.id)) {
        for (var k in attrs) {
          // modify js graph object 
          if (k in graph.links[i].attrs) {
            graph.links[i].attrs[k].data = [attrs[k]];
          } else {
            graph.links[i].attrs[k] = {
              data: [attrs[k]],
              type: "FiniteSet"
            };
          }
          
        }
        // re-render updated boxes
        handleNuggetEdgeClick(model_id, nugget_id, instantiated, graph, metaTyping, readonly)(d, i);
        sendUpdateNuggetEdgeAttrs(model_id, nugget_id, d.source.id, d.target.id, graph.links[i].attrs);
      }
    }

    // send attr update to the server
    
  };
}

function handleNuggetNodeClick(modelId, nuggetId, instantiated,
                               graph, agTyping, semantics, metaTyping, readonly) {
  return function(d, i, el) {
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

      ReactDOM.render(
          [<ElementInfoBox id="graphElement" 
                     elementId={d.id}
                     elementType="node"
                     metaType={metaTyping[d.id]}
                     editable={false}
                     instantiated={instantiated}/>],
          document.getElementById('nuggetGraphElementInfo'));
      ReactDOM.render(
         [<MetaDataBox id="metaData"
                        elementId={d.id}
                        elementType="node"
                        metaType={metaTyping[d.id]}
                        attrs={d.attrs}
                        editable={true}
                        readonly={readonly}
                        instantiated={instantiated}/>],
          document.getElementById('nuggetGraphMetaModelInfo')
      );
      ReactDOM.render(
         [<ReferenceElementBox
                     id="agElement"
                     agElementId={agTyping[d.id][0]}
                     elementType="node"
                     metaType={metaTyping[d.id]}
                     attrs={agTyping[d.id][1]}
                     editable={false}
                     readonly={readonly}
                     instantiated={instantiated}/>],
          document.getElementById('nuggetGraphIdentificationInfo')
      );

      if (!instantiated) {

        var nodeSemantics = {};

        for (var sname in semantics) {
            for (var node in semantics[sname]) {
              if (node == d.id) {
                nodeSemantics[sname] = semantics[sname][node];
              }
            }
        }

        ReactDOM.render(
           [<NuggetSemanticBox id="nuggetSemantics"
                       elementId={d.id}
                       elementType="node"
                       metaType={metaTyping[d.id]}
                       semantics={nodeSemantics}
                       editable={false}
                       readonly={readonly}/>],
            document.getElementById('nuggetGraphSemanticsInfo')
        );
      } else {
        ReactDOM.render(null, document.getElementById('nuggetGraphSemanticsInfo'));
      }

  };
}

function handleNuggetEdgeClick(modelId, nuggetId, instantiated,
                               graph, metaTyping, readonly) {
  return function(d, i, el) {
    // deselect all the selected elements
    var svg = d3.select("#nuggetSvg");

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
      // .attr("stroke-width", 2)
      .select(".arrow")
      .style("stroke", d3.rgb(highlight))
      .attr("marker-end", "url(#nuggetSvgarrow-selected)");

    // call react func
    ReactDOM.render(
          [<ElementInfoBox id="graphElement"
                   elementType="edge"
                   sourceId={d.source.id}
                   targetId={d.target.id}
                   sourceMetaType={metaTyping[d.source.id]}
                   targetMetaType={metaTyping[d.target.id]}
                   editable={false}
                   instantiated={instantiated}/>],
          document.getElementById('nuggetGraphElementInfo'));
    ReactDOM.render(
         [<MetaDataBox id="metaData"
                sourceId={d.source.id}
                targetId={d.target.id}
                elementType="edge"
                sourceMetaType={metaTyping[d.source.id]}
                targetMetaType={metaTyping[d.target.id]}
                attrs={d.attrs}
                editable={true}
                readonly={readonly}
                instantiated={instantiated}
                onDataUpdate={updateNuggetEdgeAttrs(
                  modelId, nuggetId, instantiated, graph, metaTyping, d, i)}/>],
          document.getElementById('nuggetGraphMetaModelInfo'));
    ReactDOM.render(
         [<ReferenceElementBox id="agElement"
                     elementType="edge"
                     editable={false}
                     readonly={readonly}
                     instantiated={instantiated}
                     />],
          document.getElementById('nuggetGraphIdentificationInfo')
      );

    ReactDOM.render(
           [<NuggetSemanticBox id="nuggetSemantics"
                       elementType="edge"
                       editable={false}
                       readonly={readonly}/>],
            document.getElementById('nuggetGraphSemanticsInfo')
        );
  };
}


function drawNugget(nuggetGraph, nuggetType, metaTyping, agTyping, templateRelation,
                    clickHandlers, instantiated) {
      var svgId = "nuggetSvg",
          width = 500,
          height = 200,
          nodeSizes = computeNodeSizes(nuggetGraph, metaTyping, NUGGET_META_SIZES, 0.5);

      var nodeColors;
      if (instantiated) {
          nodeColors = computeNodeColors(
            nuggetGraph, metaTyping, INSTANCE_META_COLORS);
      } else {
        nodeColors = computeNodeColors(
            nuggetGraph, metaTyping, META_COLORS);
      }
        
      var positions = computeFixedPositions(
        width, height, nuggetGraph, nuggetType, templateRelation);
      initNodePosition(
        nuggetGraph,
        positions[0],
        positions[1]);
      // initLinkStrengthDistance(nuggetGraph, metaTyping, 1.5);
      initCircleRadius(nuggetGraph, metaTyping, NUGGET_META_SIZES, 0.5);
      initNodeLabels(nuggetGraph, metaTyping);

      var simulationConf = {
        "charge_strength": -300,
        "collide_strength": 1,
        "y_strength": 0.4
      }


      var highlight;
      if (instantiated) {
        highlight = INSTANCE_HIGHLIGHT_COLOR;
      } else {
        highlight = HIGHLIGHT_COLOR;
      }

      visualiseGraph(nuggetGraph,
                     svgId,
                     nodeColors,
                     nodeSizes,
                     null,
                     highlight,
                     simulationConf,
                     {},
                     null,
                     null,
                     clickHandlers,
                     handleDragStarted,
                     100,
                     false,
                     null,
                     true)

     function handleDragStarted(d_id) {
      if ((metaTyping[d_id] != "state") &&
        (metaTyping[d_id] != "bnd") && 
        (metaTyping[d_id] != "mod")) {
        return getAllComponents(
          nuggetGraph, metaTyping, d_id).concat([d_id]);
      } else {
        return [d_id];
      }
    };
}



function previewNugget(modelId, desc, type,
                       graph, metaTyping, agTyping, templateRel,
                       referenceGenes) {
  function updateNuggetPreviewDesc() {

  }

  function updateNuggetPreviewNodeAttrs(graph, metaTyping, d, i) {

  }

  function updateNuggetPreviewEdgeAttrs(graph, metaTyping, d, i) {

  }

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


  function handleNuggetPreviewNodeClick(graph, metaTyping) {
    return function(d, i, el) {
      // deselect all the selected elements
        var svg = d3.select("#nuggetSvg");

        svg.selectAll(".arrow")
          .style("stroke", d3.rgb("#B8B8B8"))
          .attr("marker-end", "url(#nuggetSvgarrow)");
        svg.selectAll("circle")
          .attr("stroke-width", 0);
        // select current element
        d3.select(el)
            .attr("stroke-width", 2)
            .attr("stroke", d3.rgb(HIGHLIGHT_COLOR));

        // call react func
        ReactDOM.render(
            [<ElementInfoBox id="graphElement" 
                       elementId={d.id}
                       elementType="node"
                       metaType={metaTyping[d.id]}
                       editable={false}
                       instantiated={false}/>],
            document.getElementById('nuggetGraphElementInfo'));

        ReactDOM.render(
           [<MetaDataBox id="metaData"
                       elementId={d.id}
                       elementType="node"
                       metaType={metaTyping[d.id]}
                       attrs={d.attrs}
                       editable={true}
                       instantiated={false}
                       onDataUpdate={updateNuggetPreviewNodeAttrs(
                          graph, metaTyping, d, i)}/>],
            document.getElementById('nuggetGraphMetaModelInfo'));

        ReactDOM.render(
           [<ReferenceElementBox id="agElement"
                       elementType="node"
                       elementId ={d.id}
                       metaType={metaTyping[d.id]}
                       agElementId={(d.id in agTyping) ? agTyping[d.id][0] : null}
                       attrs={(d.id in agTyping) ? agTyping[d.id][1] : null}
                       editable={true}
                       instantiated={false}
                       onFetchCandidates={onFetchCandidates}
                       referenceGenes={referenceGenes[d.id]}
                       />],
            document.getElementById('nuggetGraphIdentificationInfo')
        );

        ReactDOM.render(
             [<NuggetSemanticBox id="nuggetSemantics"
                         elementType="node"
                         editable={false} />],
              document.getElementById('nuggetGraphSemanticsInfo')
          );
  
    };
  }

  function handleNuggetPreviewEdgeClick(graph, metaTyping) {
    return function(d, i, el) {
      // deselect all the selected elements
      var svg = d3.select("#nuggetSvg");
      svg.selectAll("circle")
        .attr("stroke-width", 0);
      svg.selectAll(".arrow")
        .style("stroke", d3.rgb("#B8B8B8"))
        .attr("marker-end", "url(#nuggetSvgarrow)");
      d3.select(el)
        // .attr("stroke-width", 2)
        .select(".arrow")
        .style("stroke", d3.rgb(HIGHLIGHT_COLOR))
        .attr("marker-end", "url(#nuggetSvgarrow-selected)");

      // call react func
      ReactDOM.render(
            [<ElementInfoBox id="graphElement"
                     elementType="edge"
                     sourceId={d.source.id}
                     targetId={d.target.id}
                     sourceMetaType={metaTyping[d.source.id]}
                     targetMetaType={metaTyping[d.target.id]}
                     editable={false}
                     instantiated={false}/>],
            document.getElementById('nuggetGraphElementInfo'));
      ReactDOM.render(
           [<MetaDataBox id="metaData"
                  sourceId={d.source.id}
                  targetId={d.target.id}
                  elementType="edge"
                  sourceMetaType={metaTyping[d.source.id]}
                  targetMetaType={metaTyping[d.target.id]}
                  attrs={d.attrs}
                  editable={true}
                  instantiated={false}
                  onDataUpdate={updateNuggetPreviewEdgeAttrs(
                          graph, metaTyping, d, i)}/>],
            document.getElementById('nuggetGraphMetaModelInfo'));
    };

  }

  ReactDOM.render(
        <NuggetPreview
            nuggetId={"NA"}
            nuggetDesc={desc}
            nuggetType={type}
            onDataUpdate={updateNuggetPreviewDesc}/>,
        document.getElementById('nuggetViewWidget')
  );
  drawNugget(
    graph, type, metaTyping,
    agTyping, templateRel,
    {
      "nodeClick": handleNuggetPreviewNodeClick(graph, metaTyping),
      "edgeClick": handleNuggetPreviewEdgeClick(graph, metaTyping)
    },
    false);
}

function viewNugget(model_id, instantiated=false, readonly=false) {

  return function (nugget_id, nugget_desc, nugget_type) {
    d3.select("#nuggetSvg").selectAll("*").remove();

    ReactDOM.render(
        <NuggetPreview
            nuggetId={nugget_id}
            nuggetDesc={nugget_desc}
            nuggetType={nugget_type}
            editable={true}
            instantiated={instantiated}
            readonly={readonly}
            onDataUpdate={updateNuggetDesc(model_id, nugget_id, instantiated, readonly)}/>,
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
              "nodeClick": handleNuggetNodeClick(
                  model_id, nugget_id, instantiated,
                  nuggetGraph, agTyping, semantics, metaTyping, readonly),
              "edgeClick": handleNuggetEdgeClick(
                  model_id, nugget_id, instantiated,
                  nuggetGraph, metaTyping, readonly),
            }

            drawNugget(nuggetGraph, nuggetType, metaTyping, agTyping, templateRelation, 
                       clickHandlers, instantiated);
          });
  }
}

function removeNuggetSvg(element, nugget_id) {
  var svg = document.getElementById("nuggetSvg" + nugget_id);
  svg.parentNode.removeChild(svg);
  element.style.display = "none";
  document.getElementById("showNuggetButton" + nugget_id).style.display = "inline-block";
}

