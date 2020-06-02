/**
 * Instantiation utils
 */



function getGenes(modelId) {
	return function(el, filterItems, callback=null) {
		var url = "/corpus/" + modelId + "/genes";
		$.ajax({
		    url: url,
		    type: 'get',
		    dataType: "json"
		}).done(
			function(data) {
				el.setState({
					initialItems: data["genes"].filter(
						(item) => !filterItems.includes(item[0])),
					items:   data["genes"].filter(
						(item) => !filterItems.includes(item[0]))
				});
				if (callback) {
					callback(data["genes"]);
				}
			}
		).fail(function (e) {
		    console.log("Failed to load genes");
		});
	}
}


function getVariants(modelId) {
	return function(el, index, uniprotId) {
		var url = "/corpus/" + modelId + "/variants/uniprot/" + uniprotId;
		$.ajax({
		    url: url,
		    type: 'get',
		    dataType: "json"
		}).done(
			function(data) {
				var state = Object.assign({}, el.state);
				state["variantChoices"][index]["variants"] = data["products"];
				el.setState(state);
			}
		).fail(function (e) {
		    console.log("Failed to load variants");
		});
	}
}


