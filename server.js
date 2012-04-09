#!/usr/bin/env node
// only use this file when you aren't running it as a couchapp
var http = require('http')
var request = require('request')
var ecstatic = require('ecstatic')(__dirname + '/attachments')

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
  if (req.url === '/proxy') {
    
    // request('http://localhost:5984/dc04d3b7447ec273c850ce2cc45662e950/_all_docs?include_docs=true').pipe(res)
    request('http://localhost:5984/dc6f8a0ac42757c164cd9397a00400fc06/_all_docs?include_docs=true').pipe(res)
  } else if (req.url === '/countdown') {
    res.setHeader('content-type', 'application/json')
    countdown(req, res)
  } else {
    ecstatic(req, res)
  }
})

server.listen(8001)
console.log('Listening on :8001')
