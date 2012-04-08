#!/usr/bin/env node
var http = require('http')
var request = require('request')
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
  if (req.url === '/couch-irc-logs') {
    request('http://max.ic.ht/couch-irc-logs/_all_docs?include_docs=true').pipe(res)
  } else if (req.url === '/countdown') {
    res.setHeader('content-type', 'application/json')
    countdown(req, res)
  } else {
    ecstatic(req, res)
  }
})

server.listen(8001)
console.log('Listening on :8001')
