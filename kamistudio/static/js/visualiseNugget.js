/**
 * Untils for nugget visualisation
 * 
 */

// global vars defining visualisation configs for different types of nodes
var META_SIZES = {
  "gene":40,
  "region":30,
  "site":15,
  "residue":10,
  "state":15,
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

function initializePositions(width, height, nodes, nuggetType, templateRelation) {
  // initialize positions for enzyme group
  var enzymeNode = templateRelation["enzyme"];

  var enzymeRegion = null;
  if ("enzyme_region" in templateRelation) {
    enzymeRegion = templateRelation["enzyme_region"];
  }
  var enzymeSite = null;
  if ("enzyme_site" in templateRelation) {
    enzyme_site = templateRelation["enzyme_site"];
  }

  // initialize positions for substrate group
  var substrateNode = templateRelation["substrate"];
  var modState = templateRelation["mod_state"];

  var substrateResidue = null;  
  if ("substrate_residue" in templateRelation) {
    substrateResidue = templateRelation["substrate_residue"];
  }
  if ("substrate_region" in templateRelation) {

  }
  if ("substrate_site" in templateRelation) {

  }

  // initialize mod
  var modNode = templateRelation["mod"];

  var fixedPositions = {};

  if (enzymeNode !== substrateNode) {
    fixedPositions[enzymeNode] = [width * 0.125, height * 0.5];
    fixedPositions[substrateNode] = [width - width * 0.125, height * 0.5];
    fixedPositions[modNode] = [width * 0.5, height * 0.5];
    fixedPositions[modState] = [width * 0.625, height * 0.5]
    if (substrateResidue) {
      fixedPositions[substrateResidue] = [width * 0.75, height * 0.5];
    }
  } else {
    fixedPositions[enzymeNode] = [width * 0.5, height * 0.75];
    fixedPositions[substrateNode] = [width * 0.5, height * 0.75];
    fixedPositions[modNode] = [width * 0.5, height * 0.25];
    fixedPositions[modState] = [width * 0.625, height * 0.625];
    if (substrateResidue) {
      fixedPositions[substrateResidue] = [width * 0.75, height * 0.5];
    }
  }
  return fixedPositions;
}

function visualiseNugget(nuggetJson, nuggetType, metaTyping, agTyping, templateRelation) {
  // get svg canvas
  var svg = d3.select("svg"),
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

  // define simulation
  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

  // readout nugget graph
  var graph = JSON.parse(nuggetJson);
  var metaTyping = JSON.parse(metaTyping);
  var templateRelation = JSON.parse(templateRelation);

  // get initial positions of elements according to the template relation
  fixedPositions = initializePositions(
    width, height, graph.nodes,
    nuggetType, templateRelation);

  // define edges of the graph
  var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", 4).attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)")
    .on("click", handleEdgeClick);

  // define nodes of the graph
  var node = svg.selectAll(".node")
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
    }
  });

  // setup nodes circles
  node.append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return META_SIZES[metaTyping[d.id]]; })
      .attr("fill", function(d) { return d3.rgb(META_COLORS[metaTyping[d.id]]); })
      .attr("stroke-width", 0).attr("stroke", d3.rgb("#B8B8B8"))
      .on("click", handleNodeClick);

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
      .links(graph.links).strength(0.1);

  function ticked() {

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) {
            radius = META_SIZES[metaTyping[d.target.id]];
            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            offsetX = (diffX * radius) / pathLength;
            return (d.target.x - offsetX - offsetX * 0.05);
          })
        .attr("y2", function(d) {
            radius = META_SIZES[metaTyping[d.target.id]];

            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
            offsetY = (diffY * radius) / pathLength;
            return (d.target.y - offsetY - offsetY * 0.05);
          });
    node.attr(
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

  function handleNodeClick(d) {

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
        '</table>\n' + generateEditButton(d.id, metaTyping[d.id]) +
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

    svg.selectAll("line")
      .attr("stroke-width", 4)
      .attr("stroke", d3.rgb("#B8B8B8"))
      .attr("marker-end", "url(#arrow)");

    svg.selectAll("circle")
      .attr("stroke-width", 0);

    d3.select(this)
      .attr("stroke-width", 3)
      .attr("stroke", d3.rgb("#337ab7"));

    var selectedNodeInfo = document.getElementById("selectedNodeInfo");
    while (selectedNodeInfo.firstChild) {
      selectedNodeInfo.removeChild(selectedNodeInfo.firstChild);
    }
    selectedNodeInfo.appendChild(htmlToElement(metaDataHTML));
    document.getElementById("noSelectedNodes").style.display = "none";
    document.getElementById("noMetaData").style.display = "none";
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
    svg.selectAll("circle")
      .attr("stroke-width", 0);
    svg.selectAll("line")
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

  }

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