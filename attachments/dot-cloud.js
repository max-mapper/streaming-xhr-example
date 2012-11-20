// var column = 'duration'
var column = 'ASSESSED_VALUE'

var w = window.screen.availWidth,
    h = window.screen.availHeight,
    nodes = [],
    node,
    vis,
    force;
    
function add(doc) {

  nodes.push({
    type: "circle",
    size: doc[column] / 10000
  });
  
  force.start()
  
  vis.selectAll("path")
      .data(nodes)
    .enter().append("svg:path")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("d", d3.svg.symbol()
      .size(function(d) { return d.size; })
      .type(function(d) { return d.type; }))
      .style("fill", "steelblue")
      .style("stroke", "white")
      .style("stroke-width", "1.5px")
      .call(force.drag);
}


document.addEventListener('DOMContentLoaded', function() {

  vis = d3.select("body").append("svg:svg")
      .attr("width", w)
      .attr("height", h)

  force = d3.layout.force()
      .nodes(nodes)
      .links([])
      .size([w, h]);

  force.on("tick", function(e) {
    vis.selectAll("path")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  })
  
  var docStream = fetch(window.location.href + '/db/_all_docs?include_docs=true')
  
  docStream.on('data', function(doc) {
    if (!doc[column]) return
    doc[column] = +doc[column]
    add(doc)
  })
  
  docStream.on('end', function() { })
})

