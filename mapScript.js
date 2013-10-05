var mapWidth = 780,
    mapHeight = 500,
	centered;

var projection = d3.geo.albersUsa()
	.scale(950)
	.translate([mapWidth / 2, mapHeight / 2]);
	
var rateById = d3.map();

var quantize = d3.scale.quantize()
    .domain([0, 0.15])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

var quantizeState = d3.scale.quantize()
	.domain([0, 80])
	.range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

var path = d3.geo.path()
	.projection(projection);

var g;

queue()
	.defer(d3.json, "us.json")
	.defer(d3.tsv, "us-state-names.tsv", function(d) { rateById.set(d.id, +d.id); } )
	.await(readyState);

function readyState(error, us) {	
  var svg = d3.select("#interactiveMap").append("svg")
  	.attr("width", mapWidth)
	.attr("height", mapHeight);

  svg.append("rect")
	.attr("class", "background")
	.attr("width", mapWidth)
	.attr("height", mapHeight)
	.on("click", clicked);

  g = svg.append("g")
	
  g.append("g")
      .attr("class", "states")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("class", function(d) { return quantizeState(rateById.get(d.id)); })
      .attr("d", path)
  	  .on("click", clicked);
  
  rateById.forEach( function(d, i) { console.log(d + " " + i); })
}

function readyCounty(error, lol, us) {
	// checks if an svg has already been appended. if so, remove before appending new one
	var map = d3.select("#interactiveMap").select("svg");
	if (map != null) map.remove();
	
  var svg = d3.select("#interactiveMap").append("svg")
	.attr("width", mapWidth)
	.attr("height", mapHeight);

  svg.append("rect")
	.attr("class", "background")
	.attr("width", mapWidth)
	.attr("height", mapHeight)
	.on("click", clicked);

  g = svg.append("g")
	
  g.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("class", function(d) { return quantize(rateById.get(d.id)); })
      .attr("d", path)
  	  .on("click", clicked);

  g.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
}

function clicked(d) {
	var x, y, k;
	
	if (d && centered !== d) {
	    var centroid = path.centroid(d);
	    x = centroid[0];
	    y = centroid[1];
	    k = 4;
	    centered = d;
	  } else {
	    x = mapWidth / 2;
	    y = mapHeight / 2;
	    k = 1;
	    centered = null;
	  }

	  g.selectAll("path")
	      .classed("active", centered && function(d) { return d === centered; });

	  g.transition()
	      .duration(750)
	      .attr("transform", "translate(" + mapWidth / 2 + "," + mapHeight / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	      .style("stroke-width", 1.5 / k + "px");
	  
	  var bubble = new Opentip(g.selectAll("path"));
	  bubble.show();
}