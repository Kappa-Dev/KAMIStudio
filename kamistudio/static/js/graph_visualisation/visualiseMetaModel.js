var META_SIZES = {
  "gene": 35 * 0.5,
  "region":30 * 0.5,
  "site":15 * 0.5,
  "residue":10 * 0.5,
  "state":10 * 0.5,
  "mod":25 * 0.5,
  "bnd":25 * 0.5
};


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
	    var displayedNodes = [
	    	"gene",
	    	"region",
	    	"site",
	    	"residue",
	    	"state",
	    	"mod",
	    	"bnd"
	    ];

	    graph.nodes = graph.nodes.filter(
	    	(d) => displayedNodes.includes(d.id));
	    graph.links = graph.links.filter(
	    	(d) => displayedNodes.includes(d.source) && displayedNodes.includes(d.target));
	    
	    for (var i = graph.nodes.length - 1; i >= 0; i--) {
	    	graph.nodes[i].label = graph.nodes[i].id;
	    }

	    for (var i = graph.nodes.length - 1; i >= 0; i--) {
	    	metaTyping[graph.nodes[i].id] = graph.nodes[i].id;
	    }

	    console.log(metaTyping);

	    var nodeSizes = computeNodeSizes(
	    	graph, metaTyping, META_SIZES);


	    var nodeColors = computeNodeColors(
	    	graph, metaTyping, META_COLORS);



		initNodePosition(graph, nodePos, Object.keys(nodePos));

		// initLinkStrengthDistance(graph, metaTyping);
		initCircleRadius(graph, metaTyping, META_SIZES);

		var simulationConf = {
			"charge_strength": -300,
			"collide_strength": 1,
			"strength": 0.1,
			"distance": 120,

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
                    	false,
                    	null,
                    	true);

		function handleDragStarted(d_id) {
			return [d_id];
		};

	}).fail(function (e) {
	    console.log("Failed to load action graph");
	});

}
