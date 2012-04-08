var buffers = require('buffer')
console.log(buffers)
var Buffer = buffers.Buffer
var SlowBuffer = buffers.SlowBuffer
var stream = require('stream')
var util = require('util')
var JSONStream = require('JSONStream')

document.addEventListener('DOMContentLoaded', function() {

  // fetch('http://max.ic.ht/couch-irc-logs', '#octet-stream')
  fetch('http://localhost:8001/couch-irc-logs', '#output')
  
})

function fetch(url, outputSelector) {
  var count = document.querySelectorAll(outputSelector)[0]
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  var stream = new XHRStream(xhr)
  
  var json = JSONStream.parse(['rows', /./, 'doc'])
  stream.pipe(json)
  
  json.on('data', function(data) {
    var span = document.createElement('span')
    span.innerHTML = data + '<br>'
    count.appendChild(span)
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
