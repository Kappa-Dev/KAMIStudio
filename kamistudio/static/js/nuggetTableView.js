function drawTable(pairs, metaData=null) {
	var svg = d3.select("#nuggetTable"),
      	width = +svg.attr("width"),
      	height = +svg.attr("height");

	var g = svg.append("g")
      	.attr("class", "everything");

    var zoom = d3.zoom()
	    .on("zoom", zoomed);

	svg.call(zoom);



    var labels_orders = {};
    var i = 0;

    for (var gene in metaData) {
    	i += 1;
    	labels_orders[gene] = [metaData[gene][1], i];
    }

    var cell = g.selectAll(".cell")
    			 .data(pairs)
    			 .enter()
    			 .append("rect")
                 .attr("x", function(d) {
                 	return labels_orders[d.source][1] * 30;
                 })
                 .attr("y", function(d) {
                 	return labels_orders[d.target][1] * 30;
                 })
                 .attr("width", 20)
                 .attr("height", 20)
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
	    g.attr("transform", d3.event.transform); // updated for d3 v4
	}
}

function creatNuggetTable(hierarchyId) {
	// remove child elements of the 'nuggetsView' div
	var parent = document.getElementById("nuggetsView");
	while (parent.firstChild) {
	    parent.removeChild(parent.firstChild);
	}

	// fetch nugget table
	$.ajax({
	    url: hierarchyId + "/nugget-table",
	    type: 'get',
	    dataType: "json"
	}).done(function (data) {
	    var metaData = data["meta_data"];
	    var pairs = data["pairs"];
    	
    	// add svg element
    	var svgElement = htmlToElement('<svg id="nuggetTable" width="500" height="500"></svg>');
  		parent.appendChild(svgElement);

    	drawTable(pairs, metaData);

	}).fail(function (e) {
	    console.log("Failed to load nugget table");
	});

}