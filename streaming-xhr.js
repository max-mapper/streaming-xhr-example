var stream = require('stream')
var util = require('util')
var JSONStream = require('JSONStream')

var column = 'duration'
// var column = 'ASSESSED_VALUE'

// Various formatters.
var formatNumber = d3.format(",d"),
    formatChange = d3.format("+,d"),
    formatDate = d3.time.format("%B %d, %Y"),
    formatTime = d3.time.format("%I:%M %p");

// A nest operator, for grouping the flight list.
var nestByDate = d3.nest()
    .key(function(d) { return d3.time.day(d.date); });

// Create the crossfilter for the relevant dimensions and groups.
var xf = crossfilter()
var all = xf.groupAll()
var hour = xf.dimension(function(d) { return d[column] })
var hours = hour.group(Math.floor)

function render() {
  
  var charts = [
    barChart()
        .dimension(hour)
        .group(hours)
      .x(d3.scale.linear()
        .domain([0, 150])
        .rangeRound([0, 10 * 24]))
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  // Render the initial lists.
  var list = d3.selectAll(".list")
      .data([flightList]);

  // Render the total.
  d3.selectAll("#total")
      .text(formatNumber(xf.size()));

  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    // list.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  }

  // Like d3.time.format, but faster.
  function parseDate(d) {
    return new Date(2001,
        d.substring(0, 2) - 1,
        d.substring(2, 4),
        d.substring(4, 6),
        d.substring(6, 8));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function flightList(div) {
    var flightsByDate = nestByDate.entries(date.top(40));
    
    div.each(function() {
      var date = d3.select(this).selectAll(".date")
          .data(flightsByDate, function(d) { return d.key; });
    
      date.enter().append("div")
          .attr("class", "date")
        .append("div")
          .attr("class", "day")
          .text(function(d) { return formatDate(d.values[0].date); });
    
      date.exit().remove();
    
      var flight = date.order().selectAll(".flight")
          .data(function(d) { return d.values; }, function(d) { return d.index; });
    
      var flightEnter = flight.enter().append("div")
          .attr("class", "flight");
    
      flightEnter.append("div")
          .attr("class", "time")
          .text(function(d) { return formatTime(d.date); });
    
      flightEnter.append("div")
          .attr("class", "origin")
          .text(function(d) { return d.origin; });
    
      flightEnter.append("div")
          .attr("class", "destination")
          .text(function(d) { return d.destination; });
    
      flightEnter.append("div")
          .attr("class", "distance")
          .text(function(d) { return formatNumber(d.distance) + " mi."; });
    
      flightEnter.append("div")
          .attr("class", "delay")
          .classed("early", function(d) { return d.delay < 0; })
          .text(function(d) { return formatChange(d.delay) + " min."; });
    
      flight.exit().remove();
    
      flight.order();
    });
  }

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
}

document.addEventListener('DOMContentLoaded', function() {
  fetch('http://localhost:8001/proxy', '#output')
})

function fetch(url, outputSelector) {
  var count = document.querySelectorAll(outputSelector)[0]
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  var stream = new XHRStream(xhr)
  
  var json = JSONStream.parse(['rows', /./, 'doc'])
  stream.pipe(json)
  
  json.on('data', function(doc) {
    doc[column] = +doc[column]
    xf.add([doc])
  })
  
  json.on('end', function() { render() })
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
