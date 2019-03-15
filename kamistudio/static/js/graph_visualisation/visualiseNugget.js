/**
 * Utils for nugget visualisation
 * 
 */

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

// global vars defining default visualisation configs for different types of nodes
var NUGGET_META_SIZES = {
  "gene":35,
  "region":30,
  "site":15,
  "residue":10,
  "state":10,
  "mod":25,
  "bnd":25
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

function handleNuggetNodeClick(highlight, svgId) {
  return function(d, i) {
    // deselect all the selected elements
      svg = d3.select("#" + svgId);

      svg.selectAll(".arrow")
        .style("stroke", d3.rgb("#B8B8B8"))
        .attr("marker-end", "url(#" + svgId + "arrow)");
      svg.selectAll("circle")
        .attr("stroke-width", 0);
      // select current element
    d3.select(this)
        .attr("stroke-width", 2)
        .attr("stroke", d3.rgb(highlight));

      // call react func
  };
}

function handleNuggetEdgeClick(highlight, svgId) {
  return function(d, i) {
    // deselect all the selected elements
    svg = d3.select("#" + svgId);

      svg.selectAll("circle")
        .attr("stroke-width", 0);
      svg.selectAll(".arrow")
        .style("stroke", d3.rgb("#B8B8B8"))
        .attr("marker-end", "url(#" + svgId + "arrow)");
      d3.select(this)
        // .attr("stroke-width", 2)
        .select(".arrow")
        .style("stroke", d3.rgb(highlight))
        .attr("marker-end", "url(#" + svgId + "arrow-selected)");
  };
}

function addSvgAndVisualizeNugget(element, model_id, nugget_id, instantiated=false) {
  var width=500,
  	  height=200,
  	  svgElement = htmlToElement(
  	'<tr><td colspan="3"><svg id="nuggetSvg' + nugget_id + '" width="500" height="200"></svg></td></tr>');
  
  var immediateParent = element.parentNode;
  var previousSibling = immediateParent.previousElementSibling.appendChild(svgElement);

  // use AJAX to send request for retrieving the nugget data
  $.get(model_id + "/raw-nugget/" + nugget_id, function(data, status) {
    var svgId = "nuggetSvg" + nugget_id,
    	nuggetGraph = data["nuggetJson"],
    	nuggetType = data["nuggetType"],
    	metaTyping = data["metaTyping"],
    	agTyping = data["agTyping"],
    	templateRelation = data["templateRelation"],
    	nodeSizes = computeNodeSizes(nuggetGraph, metaTyping, NUGGET_META_SIZES, scale=0.5);

    var nodeColors;
    if (instantiated) {
	    nodeColors = computeNodeColors(
	    	nuggetGraph, metaTyping, INSTANCE_META_COLORS);
	} else {
		nodeColors = computeNodeColors(
	    	nuggetGraph, metaTyping, META_COLORS);
	}
		
	positions = computeFixedPositions(width, height, nuggetGraph, nuggetType, templateRelation);
	initNodePosition(
		nuggetGraph,
		positions[0],
		fix=positions[1]);
	initLinkStrengthDistance(nuggetGraph, metaTyping, scale=0.5);
	initCircleRadius(nuggetGraph, metaTyping, NUGGET_META_SIZES, scale=0.5);

	simulationConf = {
		"charge_strength": -400,
		"collide_strength": 2.5,
		"y_strength": 0.2
	}


    var highlight;
	if (instantiated) {
		highlight = INSTANCE_HIGHLIGHT_COLOR;
	} else {
		highlight = HIGHLIGHT_COLOR;
	}

    visualiseGraph(nuggetGraph, svgId,
    				nodeColors, nodeSizes,
    				edgeStroke=null,
    				highlightedEdgeStroke=highlight,
    				simulationConf=simulationConf,
    				progressConf={},
    				workerUrl=null,
    				nodePosUpdateUrl=null,
    				onNodeClick=handleNuggetNodeClick(highlight, svgId),
    				onEdgeClick=handleNuggetEdgeClick(highlight, svgId),
    				onNodeDragstarted=function(d) { return []; },
    				threshold=100,
    				zoom=false)
  });
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