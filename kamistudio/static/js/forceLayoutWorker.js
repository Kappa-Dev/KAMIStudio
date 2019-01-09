importScripts("https://d3js.org/d3.v4.min.js");


onmessage = function(event) {
  var nodes = event.data.nodes,
      links = event.data.links,
      width = event.data.width,
      height = event.data.height;

  var simulation = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(-40))
      .force("link",
             d3.forceLink()
                  .id(function(d) { return d.id; })
                  .strength(function(d) {return d.strength; })
                  .distance(function(d) {return d.distance; }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide",d3.forceCollide().strength(1.8).radius(
          function(d) {return d.radius})
        );

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.stop();

  // Posting message with progress of simulations
  for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
    postMessage({type: "tick", progress: i / n});
    simulation.tick();
  }

  // Posting message with computed positions (inside the nodes)
  postMessage({type: "end", nodes: nodes, links: links});
};