var streamStatistics = require('stream-statistics')

var stats = new streamStatistics()
var column = 'ASSESSED_VALUE'
var w = window.screen.availWidth
var h = window.screen.availHeight
    
document.addEventListener('DOMContentLoaded', function() {

  vis = d3.select("body").append("svg:svg")
      .attr("width", w)
      .attr("height", h)

  var docStream = fetch('http://max.iriscouch.com/oakland_assessor/_design/streaming-xhr/_rewrite/db/_all_docs?include_docs=true')
  docStream.on('data', function(doc) {
    if (!doc[column]) return
    doc[column] = +doc[column]
    stats.write(doc[column])
    console.log(JSON.stringify(stats))
  })
  
  docStream.on('end', function() { })
})

