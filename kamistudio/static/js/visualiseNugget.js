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

  // define simulation
  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

  // readout nugget graph
  var graph = JSON.parse(nuggetJson);
  var metaTyping = JSON.parse(metaTyping);
  var templateRelation = JSON.parse(templateRelation);

  console.log(nuggetJson);

  // get initial positions of elements according to the template relation
  fixedPositions = initializePositions(
    width, height, graph.nodes,
    nuggetType, templateRelation);

  // define edges of the graph
  var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
    .attr("class", "link")
    .attr("stroke-width", 3).attr("stroke", d3.rgb("#B8B8B8"));

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
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  node.append("title")
      .text(function(d) { return d.id; });

  node.append("text")
      .style('fill', d3.rgb("#5e5e5e"))
      .attr("dx", 0)
      .attr("dy", function(d) { return META_LABEL_DY[metaTyping[d.id]]; })
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links).strength(0.1);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
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

  // tooltip stuff
  var tooltip = svg.append("g")
    .attr("class", "tooltip")   
    .style("opacity", 0);

  tooltip.append("rect")
      .attr("class", "desc")
      .attr("fill", "white")
      .attr("stroke-width", 1).attr("stroke", d3.rgb("#B8B8B8"))
      .attr("width", "6em")
      .attr("height", "6em")
      .attr("rx", 15)
      .attr("ry", 15);

  function handleMouseOver(d) {

    tooltip.transition()    
      .duration(200)  
      .style("opacity", .9);

    var tooltipParent = tooltip.node().parentElement;
    var matrix = 
      this.getTransformToElement(tooltipParent)
          .translate(+this.getAttribute("cx"),
               +this.getAttribute("cy"));

    tooltip.attr("transform", "translate(" + (matrix.e)
                      + "," + (matrix.f-20) + ")");
    tooltip.append("text")
      .attr("text-anchor", "start")
      .style('fill', d3.rgb("#5e5e5e"))
      .text(d.id);
    tooltip.select('rect')
      .attr("width", function(d) {return this.parentNode.getBBox().width;})
  }


  function handleMouseOut(d) {
    tooltip.transition()   
        .duration(500)    
        .style("opacity", 0);
    tooltip.select("text").remove();
  }
}