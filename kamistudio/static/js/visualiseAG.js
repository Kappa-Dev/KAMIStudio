/**
 * Utils for nugget visualisation
 * 
 */

// global vars defining default visualisation configs for different types of nodes
var AG_META_SIZES = {
  "gene":25,
  "region":15,
  "site":10,
  "residue":7,
  "state":5,
  "mod":15,
  "bnd":15
};



function visualiseAG(actionGraph, metaTyping, configs=null,
                     detailsOnClicks=true, svgId=null) {

  
  for (var i=0; i < actionGraph.links.length; i++) {
    var d = actionGraph.links[i];
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
    svgId = "actionGraphSvg";
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
      .force("link",
             d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));

  // define edges of the graph
  var link = g.selectAll(".link")
    .data(actionGraph.links)
    .enter().append("line")
      .attr("stroke-width", 2).attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)");

  if (detailsOnClicks == true) {
    link.on("click", handleEdgeClick);
  }

  // define nodes of the graph
  var node = g.selectAll(".node")
      .data(actionGraph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  // setup nodes circles
  node.append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return AG_META_SIZES[metaTyping[d.id]]; })
      .attr("fill", function(d) { return d3.rgb(META_COLORS[metaTyping[d.id]]); })
      .attr("stroke-width", 0).attr("stroke", d3.rgb("#B8B8B8"));

  if (detailsOnClicks == true) {
    node.select("circle").on("click", handleNodeClick);
  }

  node.append("title")
      .text(function(d) { return d.id; });

  // node.append("text")
  //     .style('fill', d3.rgb("#5e5e5e"))
  //     .attr("dx", 0)
  //     .attr("dy", function(d) { return META_LABEL_DY[metaTyping[d.id]]; })
  //     .text(function(d) {
  //       if (d.id.length > 15) {
  //         text = d.id.slice(0, 15) + "...";
  //       } else {
  //         text = d.id;
  //       }
  //       return text});

  simulation
      .nodes(actionGraph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(actionGraph.links).strength(function(d) { return d.strength; });

  //add zoom capabilities 
  // var zoom_handler = d3.zoom()
  //   .on("zoom", zoom_actions);

  // zoom_handler(svg); 

  function ticked() {

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) {
            radius = AG_META_SIZES[metaTyping[d.target.id]];
            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            offsetX = (diffX * radius) / pathLength;
            return (d.target.x - offsetX - offsetX * 0.05);
          })
        .attr("y2", function(d) {
            radius = AG_META_SIZES[metaTyping[d.target.id]];

            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            offsetY = (diffY * radius) / pathLength;
            return (d.target.y - offsetY - offsetY * 0.05);
          });

    node.attr("cx", function(d) {
          var r  = AG_META_SIZES[metaTyping[d.id]];
          return d.x = Math.max(r, Math.min(width - r, d.x)); })
        .attr("cy", function(d) { 
          var r  = AG_META_SIZES[metaTyping[d.id]];
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
        ' <table class="table table-hover">\n' +
        '  <tbody>\n' + addNodeIdTr(d.id) + addNodeTypeTr(metaTyping[d.id]) +
        ' </tbody>\n' +
        '</table>\n' +
        '</div>\n';

    var metaDataHTML = "";
    if (metaTyping[d.id] == "gene") {
      metaDataHTML = 
        '<div>\n' + 
        ' <table class="table table-hover">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td><b>UniProt AC:</b></td>\n' +
        '      <td id="uniprotidTD"><a href="https://www.uniprot.org/uniprot/' + singleValueToString(d, "uniprotid") +
        '">' + singleValueToString(d, "uniprotid") + '</a></td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td><b>HGNC Symbol:</b></td>\n' +
        '      <td id="hgncSymbolTD">' + singleValueToString(d, "hgnc_symbol") + '</td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td><b>Synonyms: </b></td>\n' +
        '      <td id="synonymsTD">' + singleValueToString(d, "synonyms") + '</td>\n' +
        '    </tr>\n' +
        ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) +
        '</div>\n';
    } else if (metaTyping[d.id] == "region" || metaTyping[d.id] == "site") {
        metaDataHTML = 
        '<div><table class="table table-hover">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td><b>Name:</b></td>\n' +
        '      <td id="nameTD">' + singleValueToString(d, "name") + '</td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td><b>InterPro ID:</b></td>\n' +
        '      <td id="interproIdTD"><a href="http://www.ebi.ac.uk/interpro/entry/' + singleValueToString(d, "interproid") + '">' + singleValueToString(d, "interproid") + '</a></td>\n' +
        '    </tr>\n' +
        ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) + 
        '</div>\n';
    } else if (metaTyping[d.id] == "residue") {
      metaDataHTML =
        '<div><table class="table table-hover">\n' +
          '  <tbody>\n' +
          '    <tr>\n' +
          '      <td><b>Amino Acid:</b></td>\n' +
          '      <td id="aaTD">' + singleValueToString(d, "aa") + '</td>\n' +
          '    </tr>\n' +
          '    <tr>\n' +
          '      <td><b>Test:</b></td>\n' +
          '      <td id="testTD">' + singleValueToString(d, "test") + '</td>\n' +
          '    </tr>\n' +
          ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) +
        '</div>';
    } else if (metaTyping[d.id] == "state") {
      metaDataHTML =
          '<div id="metaData"><table class="table table-hover">\n' +
          '  <tbody>\n' +
          '    <tr>\n' +
          '      <td><b>Name:</b></td>\n' +
          '      <td id="nameTD">' + singleValueToString(d, "name") + '</td>\n' +
          '    </tr>\n' +
          '    <tr>\n' +
          '      <td><b>Test:</b></td>\n' +
          '      <td id="testTD">' + singleValueToString(d, "test") + '</td>\n' +
          '    </tr>\n' +
          ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) +
        '</div>';
    } else if (metaTyping[d.id] == "mod") {
      metaDataHTML =
        '<div id="metaData"><table class="table table-hover">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td><b>Value:</b></td>\n' +
        '      <td id="valueTD">' + singleValueToString(d, "value") + '</td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td><b>Rate:</b></td>\n' +
        '      <td id="rateTD">' + singleValueToString(d, "rate") + '</td>\n' +
        '    </tr>\n' +
          '    <tr>\n' +
        '      <td><b>Description:</b></td>\n' +
        '      <td id="descTD">' + singleValueToString(d, "desc") + '</td>\n' +
        '    </tr>\n' +
        ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) +
        '</div>\n';
    } else if (metaTyping[d.id] == "bnd") {
      metaDataHTML = 
        '<div id="metaData"><table class="table table-hover">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td><b>Rate:</b></td>\n' +
        '      <td id="rateTD">' + singleValueToString(d, "rate") + '</td>\n' +
        '    </tr>\n' +
          '    <tr>\n' +
        '      <td><b>Description:</b></td>\n' +
        '      <td id="descTD">' + singleValueToString(d, "desc") + '</td>\n' +
        '    </tr>\n' +
        ' </tbody>\n' +
        '</table>\n' + generateEditNodeButton(d.id, metaTyping[d.id]) + 
        '</div>';
    }

    var agNodeId = null;
    if (d.id in agTyping) {
      agNodeId = agTyping[d.id];
    }


    var typingHTML =
      '<div>\n' +
      '  <p class="faded">Typing node was not identified</p>'
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
    var metaDataHTML = "";
    if (metaTyping[d.target.id] == "gene") {
        if (metaTyping[d.source.id] == "region" || metaTyping[d.source.id] == "site") { 
          metaDataFound = true;
          metaDataHTML = 
            '<div id="metaData"><table class="table table-hover">\n' +
            '  <tbody>\n' +
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
          metaDataHTML = 
            '<div id="metaData"><table class="table table-hover">\n' +
            '  <tbody>\n' +
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
          metaDataHTML = 
            '<div id="metaData"><table class="table table-hover">\n' +
            '  <tbody>\n' +
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
          metaDataHTML = 
            '<div id="metaData"><table class="table table-hover">\n' +
            '  <tbody>\n' +
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
          metaDataHTML = 
            '<div id="metaData"><table class="table table-hover">\n' +
            '  <tbody>\n' +
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

function getActionGraphAndVisualize(hierarchy_id) {
  // use AJAX to send request for retrieving the nugget data
  $.get(hierarchy_id + "/raw-action-graph", function(data, status) {
    var actionGraph = data["actionGraph"];
    var metaTyping = data["metaTyping"];
    visualiseAG(actionGraph, metaTyping, null, false, null);
  })
}