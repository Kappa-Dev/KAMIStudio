/**
 * Utils for nugget visualisation
 * 
 */


var PRETTY_SEMANTIC_NUGGET_NAMES = {
  "sh2_pY_binding_semantic_nugget": "SH2 pY binding",
  "phosphorylation_semantic_nugget": "Phosphorylation"
};


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


function drawNugget(nuggetGraph, nuggetType, metaTyping, agTyping, templateRelation,
                    clickHandlers, instantiated) {

      console.log("Drawing nugget: ");
      console.log("Nugget graph: ", nuggetGraph);
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


function removeNuggetSvg(element, nugget_id) {
  var svg = document.getElementById("nuggetSvg" + nugget_id);
  svg.parentNode.removeChild(svg);
  element.style.display = "none";
  document.getElementById("showNuggetButton" + nugget_id).style.display = "inline-block";
}

