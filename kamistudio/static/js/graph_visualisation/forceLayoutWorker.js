importScripts("https://d3js.org/d3.v4.min.js");


onmessage = function(event) {
  var nodes = event.data.nodes,
      links = event.data.links,
      width = event.data.width,
      height = event.data.height,
      chargeStrength = event.data.chargeStrength,
      collideStrength = event.data.collideStrength,
      defaultDistance = event.data.defaultDistance,
      defaultStrength = event.data.defaultStrength,
      defaultRadius = event.data.defaultRadius,
      yStrength = event.data.yStrength;

  var simulation = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(
          chargeStrength / 10))
      .force("link",
           d3.forceLink()
              .id(function(d) { return d.id; })
              .distance(function(d) {
                  if (d.distance) {
                    return d.distance; 
                  } else {
                    return defaultDistance;
                  }})
              .strength(function(d) { 
                    if (d.strength) {
                      // console.log("S", d.strength);
                      return d.strength; 
                    } else {
                      return defaultStrength;
                    }}))
                // function(d) {return d.distance; }))
      .force('y', d3.forceY().y(0.5 * height).strength(yStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().strength(collideStrength).radius(
          function(d) {
                if (d.radius) {
                  return d.radius;
                } else {
                  return defaultRadius;
                }
              }));

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