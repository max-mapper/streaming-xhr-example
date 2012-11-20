var fetch = require('./streaming-xhr.js')

fetch(window.location.href + '/db/_all_docs?include_docs=true')
  .on('data', function(chunk){ console.log(chunk) })
