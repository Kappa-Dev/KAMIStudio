/**
 * Utils for nugget visualisation
 * 
 */

// global vars defining default visualisation configs for different types of nodes
var META_SIZES = {
  "gene":35,
  "region":30,
  "site":15,
  "residue":10,
  "state":10,
  "mod":25,
  "bnd":25
};

var META_COLORS = {
  "gene":"#FFA19E",
  "region":"#ffb080",
  "site":"#ffd780",
  "residue":"#ccb3ff",
  "state":"#A3DEFF",
  "mod":"#9DAEFD",
  "bnd":"#9EFFC5"
};

var META_LABEL_DY = {
  "gene":"-3.5em",
  "region":"-3em",
  "site":"-2em",
  "residue":"-2em",
  "state":"-2em",
  "mod":"-2.5em",
  "bnd":"-2.5em"
}

function initializePositions(width, height, graph, nuggetType, templateRelation) {
  var fixedPositions = {};
  if (nuggetType == "mod") {
    var enzymeNode = templateRelation["enzyme"];
    var substrateNode = templateRelation["substrate"];
    var modState = templateRelation["mod_state"];
    var modNode = templateRelation["mod"];

    if (enzymeNode !== substrateNode) {
      var baseLineY = height * 0.5;
      var enzymeX = width * 0.125;
      var enzymeY = baseLineY;
      var substrateX = width - width * 0.125;
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
    fixedPositions[substrateNode] = [substrateX, substrateY];
    fixedPositions[modNode] = [modX, modY];

  } else {
    var leftNode = templateRelation["left_partner"];
    var rightNode = templateRelation["right_partner"];
    var bnd = templateRelation["bnd"];

    var baseLineY = height * 0.5;
    var leftX = width * 0.125;
    var leftY = baseLineY;
    var rightX = width - width * 0.125;
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
    fixedPositions[rightNode] = [rightX, rightY];
    fixedPositions[bnd] = [bndX, bndY];
  }

  for (var i=0; i < graph.links.length; i++) {
    if (!(graph.links[i].source in fixedPositions) && (graph.links[i].target in fixedPositions)) {
      fixedPositions[graph.links[i].source] = fixedPositions[graph.links[i].target];
    }
  }

  return fixedPositions;
}

function visualiseNugget(nuggetJson, nuggetType, metaTyping,
                         agTyping, templateRelation, configs=null,
                         detailsOnClicks=true, svgId=null, scale=1) {
  // readout nugget graph
  var graph = JSON.parse(nuggetJson);
  var metaTyping = JSON.parse(metaTyping);
  var agTyping = JSON.parse(agTyping);
  var templateRelation = JSON.parse(templateRelation);

  initializeLinkStrengthDistance(graph, metaTyping);

  for (var i=0; i < graph.links.length; i++) {
    var d = graph.links[i];
    d.strength = 0.09;
    if (metaTyping[d.target] == "gene") {
      if (metaTyping[d.source] == "region") {
        d.strength = 0.2;
      } else if (metaTyping[d.source] == "site") {
        d.strength = 0.15;
      } else if ((metaTyping[d.source] == "residue") || (metaTyping[d.source] == "state")) {
        d.strength = 0.12;
      } 
    } else if (metaTyping[d.target] == "region") {
      if (metaTyping[d.source] == "site") {
        d.strength = 0.15;
      } else if ((metaTyping[d.source] == "residue") || (metaTyping[d.source] == "state")) {
        d.strength = 0.12;
      } 
    } else if (metaTyping[d.target] == "site") {
      if ((metaTyping[d.source] == "residue") || (metaTyping[d.source] == "state")) {
        d.strength = 0.12;
      } 
    } else if (metaTyping[d.target] == "state") {
      if (metaTyping[d.source] == "mod") {
        d.strength = 0.10;
      }
    } else if (metaTyping[d.target] == "bnd") {
      d.strength = 0.1;
    } else if (metaTyping[d.target] == "mod") {
      d.strength = 0.1;
    }
  }

  // get svg canvas
  if (svgId == null) {
    svgId = "nuggetSvg";
  }

  var svg = d3.select("#" + svgId),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  // define arrow markers for graph links
  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 7)
    .attr("refY", 0)
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10, 0L0, 5")
    .attr('fill', '#B8B8B8');

  svg.append("defs").append("marker")
    .attr("id", "arrow-selected")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 8)
    .attr("refY", 0)
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10, 0L0, 5")
    .attr('fill', '#337ab7');

  //add encompassing group for the zoom 
  var g = svg.append("g")
      .attr("class", "everything");

  // define simulation
  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink()
                        .id(function(d) { return d.id; })
                        .strength(function(d) {return d.strength; })
                        .distance(function(d) {return d.distance; }))
      .force("charge", d3.forceManyBody().strength(-200 * scale))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide",d3.forceCollide().strength(1.8).radius(
        function(d) {return d.radius})
      );

  // get initial positions of elements according to the template relation
  fixedPositions = initializePositions(
    width, height, graph,
    nuggetType, templateRelation);

  // define edges of the graph
  var link = g.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", 4*scale).attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)");

  if (detailsOnClicks == true) {
    link.on("click", handleEdgeClick);
  }

  // define nodes of the graph
  var node = g.selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  // set initial positions 
  node.each(function(d) {
      if (d.id in fixedPositions) {
        d.x = fixedPositions[d.id][0];
        d.y = fixedPositions[d.id][1];
        // if ((metaTyping[d.id] == "bnd") ||
        //     (metaTyping[d.id] == "mod") ||
        //     (templateRelation[d.id] == "enzyme") ||
        //     (templateRelation[d.id] == "substrate") ||
        //     (templateRelation[d.id] == "left_partner") ||
        //     (templateRelation[d.id] == "right_partner")) {
        //   d.fx = d.x;
        //   d.fy = d.y;
        // } 
      }
  });

  // setup nodes circles
  node.append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return META_SIZES[metaTyping[d.id]] * scale; })
      .attr("fill", function(d) { return d3.rgb(META_COLORS[metaTyping[d.id]]); })
      .attr("stroke-width", 0).attr("stroke", d3.rgb("#B8B8B8"));

  if (detailsOnClicks == true) {
    node.select("circle").on("click", handleNodeClick);
  }

  node.append("title")
      .text(function(d) { return d.id; });

  node.append("text")
      .style('fill', d3.rgb("#5e5e5e"))
      .attr("dx", 0)
      .attr("dy", function(d) { return META_LABEL_DY[metaTyping[d.id]]; })
      .text(function(d) {
        if (d.id.length > 15) {
          text = d.id.slice(0, 15) + "...";
        } else {
          text = d.id;
        }
        return text});

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
     .links(graph.links).strength(function(d) { return d.strength; });
  
  //add zoom capabilities 
  // var zoom_handler = d3.zoom()
  //   .on("zoom", zoom_actions);

  // zoom_handler(svg); 

  function ticked() {

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) {
            radius = META_SIZES[metaTyping[d.target.id]] * scale;
            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            if (pathLength == 0) {
              offsetX = 0;
            } else {
              offsetX = (diffX * radius) / pathLength;
            }
            return (d.target.x - offsetX - offsetX * 0.05);
          })
        .attr("y2", function(d) {
            radius = META_SIZES[metaTyping[d.target.id]] * scale;

            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            if (pathLength == 0) {
              offsetY = 0;
            } else {
              offsetY = (diffY * radius) / pathLength;
            }
            return (d.target.y - offsetY - offsetY * 0.05);
          });

    node.attr("cx", function(d) {
          var r  = META_SIZES[metaTyping[d.id]] * scale;
          return d.x = Math.max(r, Math.min(width - r, d.x)); })
        .attr("cy", function(d) { 
          var r  = META_SIZES[metaTyping[d.id]] * scale;
          return d.y = Math.max(r, Math.min(height - r, d.y)); })
        .attr(
          "transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    var radius = 20;
    // var radius = d.select("circle").attr("r");
    if (d3.event.x <= width - radius && d3.event.x >= radius) {
      d.fx = d3.event.x;
    }
    if (d3.event.y <= height - radius && d3.event.y >= radius) {
      d.fy = d3.event.y;
    }
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }


  //Zoom functions 
  function zoom_actions(){
      g.attr("transform", d3.event.transform)
  }


  function handleNodeClick(d) {

    var elementInfoHTML = 
        '<div>\n' + 
        '  <table class="table table-hover info-table">\n' +
        '    <tbody>\n' + addNodeIdTr(d.id) + addNodeTypeTr(metaTyping[d.id]) +
        '    </tbody>\n' +
        '  </table>\n' +
        '</div>\n';

    var metaDataHTML =
        '<div>\n' + 
        ' <table class="table table-hover info-table">\n' +
        '  <tbody>\n';
    
    var data = {};
    for (key in d.attrs) {
      data[key] = d.attrs[key].data;
    }

    metaDataHTML +=
        generateMetaDataTrs(metaTyping[d.id], data) +
        ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) +
        '</div>\n';


    var agNodeId = null;
    if (d.id in agTyping) {
      agNodeId = agTyping[d.id];
    }


    var typingHTML =
      '<div>\n' +
      '  <p class="faded sidebar-block-message">Typing node was not identified</p>'
      '</div>\n';
    if (agNodeId !== null) {
      typingHTML = 
        '<div id="agTyping"><table class="table table-hover">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td><b>AG Node ID:</b></td>\n' +
        '      <td id="agNodeId">' + agTyping[d.id] + '</td>\n' +
        '    </tr>\n' +
        ' </tbody>\n' +
        '</table>\n' +
        '</div>';
    } else {
      console.log("No action graph typing");
    }

    // deselect all the selected elements
    g.selectAll("line")
      .attr("stroke-width", 4)
      .attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)");

    g.selectAll("circle")
      .attr("stroke-width", 0);

    d3.select(this)
      .attr("stroke-width", 3)
      .attr("stroke", d3.rgb("#337ab7"));

    // autofill the data on the sidebar
    var selectedNodeInfo = document.getElementById("selectedNodeInfo");
    while (selectedNodeInfo.firstChild) {
      selectedNodeInfo.removeChild(selectedNodeInfo.firstChild);
    }
    selectedNodeInfo.appendChild(htmlToElement(metaDataHTML));
    document.getElementById("noSelectedNodes").style.display = "none";
    document.getElementById("noMetaData").style.display = "none";

    var selectedElementInfo = document.getElementById("selectedElementInfo");
    while (selectedElementInfo.firstChild) {
      selectedElementInfo.removeChild(selectedElementInfo.firstChild);
    }
    selectedElementInfo.appendChild(htmlToElement(elementInfoHTML));
    document.getElementById("noSelectedElements").style.display = "none";
    document.getElementById("edgeElementInfo").style.display = "none";

    var selectedNodeTyping = document.getElementById("selectedNodeTyping");
    while (selectedNodeTyping.firstChild) {
      selectedNodeTyping.removeChild(selectedNodeTyping.firstChild);
    }
    selectedNodeTyping.appendChild(htmlToElement(typingHTML));
    document.getElementById("noSelectedNodesToType").style.display = "none";
    document.getElementById("edgeTyping").style.display = "none";

  }


  function handleEdgeClick(d) {
    var metaDataFound = false;
    var metaDataHTML =
      '<div id="metaData"><table class="table table-hover info-table">\n' +
      '  <tbody>\n';
    if (metaTyping[d.target.id] == "gene") {
        if (metaTyping[d.source.id] == "region" || metaTyping[d.source.id] == "site") { 
          metaDataFound = true;
          metaDataHTML += 
            '    <tr>\n' +
            '      <td><b>Start:</b></td>\n' +
            '      <td id="startTD">' + singleValueToString(d, "start") + '</td>\n' +
            '    </tr>\n' +
            '    <tr>\n' +
            '      <td><b>End:</b></td>\n' +
            '      <td id="endTD">' + singleValueToString(d, "end") + '</td>\n' +
            '    </tr>\n' +
            '    <tr>\n' +
            '      <td><b>Order: </b></td>\n' +
            '      <td id="orderTD">' + singleValueToString(d, "order") + '</td>\n' +
            '    </tr>\n' +
            ' </tbody>\n' +
            '</table>\n' + generateEditEdgeButton(d.source.id, d.target.id, metaTyping[d.source.id], metaTyping[d.target.id]) +
            '</div>\n';
        } else if (metaTyping[d.source.id] == "residue") {
          metaDataFound = true;
          metaDataHTML += 
            '    <tr>\n' +
            '      <td><b>Location:</b></td>\n' +
            '      <td id="locTD">' + singleValueToString(d, "loc") + '</td>\n' +
            '    </tr>\n' +
            ' </tbody>\n' +
            '</table>\n' + generateEditEdgeButton(d.source.id, d.target.id, metaTyping[d.source.id], metaTyping[d.target.id]) +
            '</div>\n';
        }
    } else if (metaTyping[d.target.id] == "region") {
        if (metaTyping[d.source.id] == "site") {
          metaDataFound = true;
          metaDataHTML += 
            '    <tr>\n' +
            '      <td><b>Start:</b></td>\n' +
            '      <td id="startTD">' + singleValueToString(d, "start") + '</td>\n' +
            '    </tr>\n' +
            '    <tr>\n' +
            '      <td><b>End:</b></td>\n' +
            '      <td id="endTD">' + singleValueToString(d, "end") + '</td>\n' +
            '    </tr>\n' +
            '    <tr>\n' +
            '      <td><b>Order: </b></td>\n' +
            '      <td id="orderTD">' + singleValueToString(d, "order") + '</td>\n' +
            '    </tr>\n' +
            ' </tbody>\n' +
            '</table>\n' + generateEditEdgeButton(d.source.id, d.target.id, metaTyping[d.source.id], metaTyping[d.target.id]) +
            '</div>\n';
        } else if (metaTyping[d.source.id] == "residue") {
          metaDataFound = true;
          metaDataHTML += 
            '    <tr>\n' +
            '      <td><b>Location:</b></td>\n' +
            '      <td id="locTD">' + singleValueToString(d, "loc") + '</td>\n' +
            '    </tr>\n' +
            ' </tbody>\n' +
            '</table>\n' + generateEditEdgeButton(d.source.id, d.target.id, metaTyping[d.source.id], metaTyping[d.target.id]) +
            '</div>\n';
        }
    } else if (metaTyping[d.target.id] == "site") {
        if (metaTyping[d.source.id] == "residue") {
          metaDataFound = true;
          metaDataHTML += 
            '    <tr>\n' +
            '      <td><b>Location:</b></td>\n' +
            '      <td id="locTD">' + singleValueToString(d, "loc") + '</td>\n' +
            '    </tr>\n' +
            '</table>\n' + generateEditEdgeButton(d.source.id, d.target.id, metaTyping[d.source.id], metaTyping[d.target.id]) +
            '</div>\n';
        }
    }
    g.selectAll("circle")
      .attr("stroke-width", 0);
    g.selectAll("line")
      .attr("stroke-width", 4)
      .attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)");

    d3.select(this)
    .attr("stroke-width", 4)
    .attr("stroke", d3.rgb("#337ab7"))
    .attr("marker-end", "url(#arrow-selected)");

    var selectedNodeInfo = document.getElementById("selectedNodeInfo");
    while (selectedNodeInfo.firstChild) {
      selectedNodeInfo.removeChild(selectedNodeInfo.firstChild);
    }

    if (metaDataFound == true) {
      selectedNodeInfo.appendChild(htmlToElement(metaDataHTML));
      document.getElementById("noSelectedNodes").style.display = "none";
      document.getElementById("noMetaData").style.display = "none";
    } else {
      document.getElementById("noMetaData").style.display = "inline-block";
    }

    document.getElementById("noSelectedElements").style.display = "none";
    var selectedElementInfo = document.getElementById("selectedElementInfo");
    while (selectedElementInfo.firstChild) {
      selectedElementInfo.removeChild(selectedElementInfo.firstChild);
    }
    document.getElementById("edgeElementInfo").style.display = "inline-block";

    document.getElementById("noSelectedNodesToType").style.display = "none";
    var selectedNodeTyping = document.getElementById("selectedNodeTyping");
    while (selectedNodeTyping.firstChild) {
      selectedNodeTyping.removeChild(selectedNodeTyping.firstChild);
    }
    document.getElementById("edgeTyping").style.display = "inline-block";

  }

}


function addNodeIdTr(nodeId) {
  var trHtml =
    '    <tr>\n' +
    '      <td><b>Node ID:</b></td>\n' +
    '      <td>' + nodeId + '</td>\n' +
    '    </tr>\n';
  return trHtml;
}


function addNodeTypeTr(nodeType) {
  var trHtml =
    '    <tr>\n' +
    '      <td><b>Node Type:</b></td>\n' +
    '      <td><span class="dot dot-' + nodeType + '"></span>' + nodeType + '</td>\n' +
    '    </tr>\n';
  return trHtml;
}

// function equalToEventTarget() {
//     return this == d3.event.target;
// }

// d3.select("body").on("click",function(){
//     if (arrows.filter(equalToEventTarget).empty() && circles.filter(equalToEventTarget).empty()) {
//       svg.selectAll("circle")
//         .attr("stroke-width", 0);
//       svg.selectAll("line")
//         .attr("stroke-width", 4)
//         .attr("stroke", d3.rgb("#B8B8B8"))
//         .attr("marker-end", "url(#arrow)");
//       }
// });


function addSvgAndVisualizeNugget(element, model_id, nugget_id) {
  svgElement = htmlToElement('<tr><td colspan="3"><svg id="nuggetSvg' + nugget_id + '" width="500" height="200"></svg></td></tr>');
  
  var immediateParent = element.parentNode;
  var previousSibling = immediateParent.previousElementSibling.appendChild(svgElement);

  // use AJAX to send request for retrieving the nugget data
  $.get(model_id + "/raw-nugget/" + nugget_id, function(data, status) {
    var svgId = "nuggetSvg" + nugget_id;
    visualiseNugget(JSON.stringify(data["nuggetJson"]),
                    data["nuggetType"],
                    JSON.stringify(data["metaTyping"]),
                    JSON.stringify(data["agTyping"]),
                    JSON.stringify(data["templateRelation"]),
                    null,
                    detailsOnClicks=false,
                    svgId=svgId,
                    scale=0.5);
  })
  // Remove 'Show graph' button 
  element.style.display = 'none';
  document.getElementById("hideNuggetButton" + nugget_id).style.display = "inline-block";
}

function removeNuggetSvg(element, nugget_id) {
  var svg = document.getElementById("nuggetSvg" + nugget_id);
  svg.parentNode.removeChild(svg);
  element.style.display = "none";
  document.getElementById("showNuggetButton" + nugget_id).style.display = "inline-block";
}