function getMetaModelAndVisualize() {
  	// use AJAX to send request for retrieving the nugget data
  	$.ajax({
	    url: "/raw-meta-model",
	    type: 'get',
	    dataType: "json",
		xhr: function () {
	        var xhr = $.ajaxSettings.xhr();
	        xhr.onprogress = function(e) {
	            if (e.lengthComputable) {
	                updateAGLoadingProgress(e.loaded / e.total);
	            }
	        };
	        return xhr;
	    }
	}).done(function (data) {
	    var graph = data["graph"],
	    	nodePos = data["node_positioning"],
	    	metaTyping = {};

	    console.log(graph);

	    for (var i = graph.nodes.length - 1; i >= 0; i--) {
	    	metaTyping[graph.nodes[i].id] = graph.nodes[i].id;
	    }

	    console.log(metaTyping);

	    var nodeSizes = computeNodeSizes(
	    	graph, metaTyping, AG_META_SIZES);


	    var nodeColors = computeNodeColors(
	    	graph, metaTyping, META_COLORS);

	    

		initNodePosition(graph, nodePos, Object.keys(nodePos));

		initLinkStrengthDistance(graph, metaTyping);
		initCircleRadius(graph, metaTyping, AG_META_SIZES);

		var simulationConf = {
			"charge_strength": -400,
			"collide_strength": 1.8,
		};

		var progressConf = {};

	
		var highlight = HIGHLIGHT_COLOR;
		

		var clickHandlers = {
			// "nodeClick": handleNodeClick, 
			// "multiNodeClick": handleMultipleNodeClick,
			// "edgeClick": handleEdgeClick,
			// "unselectClick": handleUnselectNodeClick
		};

		visualiseGraph(graph,
					   "metaModelSvg", 
						nodeColors, 
						nodeSizes,
						null,
						highlight,
						simulationConf,
						progressConf,
						null, 
						null,
                     	clickHandlers,
                     	handleDragStarted,
                    	300,
                    	true);

		function handleDragStarted(d_id) {
			if ((metaTyping[d_id] != "state") &&
				(metaTyping[d_id] != "bnd") && 
				(metaTyping[d_id] != "mod")) {
				return getAllComponents(
					graph, metaTyping, d_id).concat([d_id]);
			} else {
				return [d_id];
			}
		};

	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}
