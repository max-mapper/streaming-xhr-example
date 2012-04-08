#!/usr/bin/env node
var http = require('http')
var ecstatic = require('ecstatic')(__dirname)

function countdown(req, res) {
  var n = 10
  var iv = setInterval(function () {
    res.write(n + '\r\n')
    if (--n === 0) {
      clearInterval(iv)
      res.end()
    }
  }, 250)
}

var server = http.createServer(function (req, res) {
  if (req.url === '/octet-stream') {
    res.setHeader('content-type', 'multipart/octet-stream')
    countdown(req, res)
  } else if (req.url === '/json') {
    res.setHeader('content-type', 'application/json')
    countdown(req, res)
  } else {
    ecstatic(req, res)
  }
})

server.listen(8001)
console.log('Listening on :8001')
