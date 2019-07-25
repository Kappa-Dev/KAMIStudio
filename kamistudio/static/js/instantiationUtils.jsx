/**
 * Instantiation utils
 */


function GeneList(props) {
	var listItems = props.items.map(
		(item) =>
				<li className="not-selected">
					<a onClick={() => props.onItemClick(item[0], item[1])}>
	  					{item[0]}
	  					<div style={{"float": "right", "margin-left": "5pt"}}>{item[1]}</div>
	  					<div style={{"float": "right"}}>{item[2] ? item[2].join(", ") : ""}</div>
  					</a>
				</li>
    );
	return <ul className="nav nuggets-nav list-group-striped list-unstyled components">
	     		{listItems}
	       </ul>;
}



function getGenes(modelId) {
	return function(el, filterItems) {
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
				state["choices"][index]["variants"] = data["products"];
				el.setState(state);
			}
		).fail(function (e) {
		    console.log("Failed to load variants");
		});
	}
}


