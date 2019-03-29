function drawNuggetTable(modelId, geneAdjacency) {
	var svg = d3.select("#nuggetTable"),
      	width = +svg.attr("width"),
      	height = +svg.attr("height");

	var g = svg.append("g")
      	.attr("class", "everything");

    var zoom = d3.zoom()
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, Infinity])
	    .on("zoom", zoomed);

	svg.call(zoom);
    var i = 1;
    var indexedLabels = [];
    for (var gene in geneAdjacency) {
        indexedLabels.push([gene, i]);
        i += 1;
    }   

    indexedLabels.sort(function(left, right) {
      return left[0] < right[0] ? -1 : 1;
    });

    var orders = {};
    var labelsData = [];
    for (var i=0; i < indexedLabels.length; i++) {
        orders[indexedLabels[i][0]] = indexedLabels[i][1];
        labelsData.push({
            "label": indexedLabels[i][0],
            "order": indexedLabels[i][1],
        })
    }

    var cellData = [];
    for (var k in geneAdjacency) {
        for (var i=0; i < geneAdjacency[k][0].length; i++) {
            cellData.push({
                "source": k,
                "target": geneAdjacency[k][0][i],
                "nuggets": geneAdjacency[k][1][i],
                "sourceOrder": orders[k],
                "targetOrder": orders[geneAdjacency[k][0][i]] 
            })
        }
    }

    var xlabels = g.selectAll(".xlabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("text-anchor", "start")
                   .attr("x", function(d) {
                        return d.order * 20;
                    })
                     .attr("y", function(d) {
                        return -20;
                    })
                    .attr("transform", function(d) {
                        return "rotate(-90," + d.order * 20 + "," + -5 + ")";
                    })
                   .text(function(d) { return d.label });
         

    var ylabels = g.selectAll(".ylabels")
                   .data(labelsData)
                   .enter()
                   .append("text")
                   .attr("x", function(d) {
                        return -5;
                    })
                     .attr("y", function(d) {
                        return d.order * 20;
                    })
                   .attr("text-anchor", "end")
                   .text(function(d) { return d.label });
    var cell = g.selectAll(".cell")
    			 .data(cellData)
    			 .enter()
    			 .append("rect")
                 .attr("x", function(d) {
                 	return d.sourceOrder * 20;
                 })
                 .attr("y", function(d) {
                 	return d.targetOrder * 20;
                 })
                 .attr("width", 15)
                 .attr("height", 15)
                 .attr('fill', function(d) {
                 	if (d.nuggets.length > 0) {
                 		return "#337ab7";
                 	} else {
                 		return "#FFFFFF";
                 	}
                 });
    cell.attr(
          "transform", function(d) {
	          // zoom to fit the bounding box
	          var boundaries = g.node().getBBox(),
	              bx = boundaries.x,
	              by = boundaries.y,
	              bheight = boundaries.height,
	              bwidth = boundaries.width;
	          var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
	          svg  
	            .attr("viewBox", updatedView)  
	            .attr("preserveAspectRatio", "xMidYMid meet")  
	            .call(zoom);
	            return "translate(" + d.x + "," + d.y + ")"; 

	        });

    function zoomed() {
        var boundaries = g.node().getBBox(),
                  bx = boundaries.x,
                  by = boundaries.y,
                  bheight = boundaries.height,
                  bwidth = boundaries.width;
              var updatedView = "" + bx + " " + by + " " + bwidth + " " + bheight;
              svg  
                .attr("viewBox", updatedView)  
                .attr("preserveAspectRatio", "xMidYMid meet")  
                .call(zoom);
        // var = d3.event,

        // console.log(d3.event.scale, d3.event.transform);
        // var e = d3.event,
        //     tx = Math.min(0, Math.max(e.transform.x, width - width * e.transform.k)),
        //     ty = Math.min(0, Math.max(e.transform.y, height - height * e.transform.k));
        //     // then, update the zoom behavior's internal translation, so that
        //     // it knows how to properly manipulate it on the next movement
        //     // zoom.translate([tx, ty]);
        //     // and finally, update the <g> element's transform attribute with the
        //     // correct translation and scale (in reverse order)
        //     g.attr("transform", 
        //            {"x": tx, "y": ty, "k": e.transform.k});
        //         // [
        //         //       "translate(" + [tx, ty] + ")",
        //         //       "scale(" + e.transform.k + ")"
        //         //         ].join(" "));
	    g.attr("transform", d3.event.transform); // updated for d3 v4
	}
}