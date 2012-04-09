var stream = require('stream')
var util = require('util')
var JSONStream = require('JSONStream')

// var column = 'duration'
var column = 'ASSESSED_VALUE'

var filter = crossfilter()
var dimension = filter.dimension(function(d) { return d[column] })

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
  
  fetch('http://localhost:8001/proxy', '#output')
})

function fetch(url, outputSelector) {
  var counter = 0
  var count = document.querySelectorAll(outputSelector)[0]
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  var stream = new XHRStream(xhr)
  
  var json = JSONStream.parse(['rows', /./, 'doc'])
  stream.pipe(json)
  
  json.on('data', function(doc) {
    if (!doc[column]) return
    doc[column] = +doc[column]
    filter.add([doc])
    add(doc)
  })
  
  json.on('end', function() { })
}

function XHRStream(xhr) {
  stream.Stream.call(this)
  var me = this
  me.xhr = xhr
  me.offset = 0
 
  xhr.onreadystatechange = function () { me.handle() }
  
  xhr.send(null)
}

util.inherits(XHRStream, stream.Stream)

XHRStream.prototype.handle = function () {
  if (this.xhr.readyState === 3) this.write()
  if (this.xhr.readyState === 4) this.emit('end')
}

XHRStream.prototype.write = function () {
  if (this.xhr.responseText.length > this.offset) {
    this.emit('data', this.xhr.responseText.slice(this.offset))
    this.offset = this.xhr.responseText.length
  }
}
