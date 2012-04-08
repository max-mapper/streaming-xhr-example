document.addEventListener('DOMContentLoaded', function() {

  fetch('http://localhost:8001/octet-stream', '#octet-stream')
  fetch('http://localhost:8001/json', '#json')
  
})

function fetch(url, outputSelector) {
  var count = document.querySelectorAll(outputSelector)[0]

  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)

  xhr.onreadystatechange = function() {
    var data = xhr.responseText
    var span = document.createElement('span')
    span.innerHTML = "readystate " + xhr.readyState + ": " + data.toString() + '<br>'
    count.appendChild(span)
    return data
  }
  
  xhr.send(null)
}