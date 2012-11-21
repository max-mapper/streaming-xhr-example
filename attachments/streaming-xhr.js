var stream = require('stream')
var util = require('util')
var JSONStream = require('JSONStream')

function fetch(url) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  var stream = new XHRStream(xhr)

  var json = JSONStream.parse(['rows', /./, 'doc'])
  stream.pipe(json)
  
  return json
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
    var chunk = this.xhr.responseText.slice(this.offset)
    var buf = new Array(chunk.length)
    for (var i = 0; i < chunk.length; i++) buf[i] = chunk.charCodeAt(i)
    chunk = new Int8Array(buf)
    this.emit('data', chunk)
    this.offset = this.xhr.responseText.length
  }
}
