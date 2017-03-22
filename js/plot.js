
// Functions for plotting data
//   Include this AFTER load.js

// D3 line chart constants
//  See https://bl.ocks.org/mbostock/3883245

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

var dailyData = {};

var svg = d3.select("svg")
    .attr('width', sitemap.getSize().x)
    .attr('height', sitemap.getSize().y),
    margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var line = d3.line()
    .x(function(d) { return x(d.day); })
    .y(function(d) { return y(d.val); });




function plotSite(data, g_id) {
    // This is an async problem.  Really, we should be working with the
    //   async nature of d3.csv and embedding things in callbacks.  However,
    //   leaflet and d3 don't seem to play nice together. Hence, this.
    //
    // It will cause an attempt to plot a site to fail (silently, for now)
    //   if the data aren't yet loaded.
    
    if (data.length >= 0) {
      
      data = data.filter(function(d) { return(d.G_ID == g_id) });
      data.sort(function(a,b) { return a.day-b.day});
      
      x.domain(d3.extent(data, function(d) { return d.day; }));
      y.domain(d3.extent(data, function(d) { return d.val; }));

      g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
        .select(".domain")
          .remove();

      g.append("g")
          .call(d3.axisLeft(y))
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Value");

      g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);
    }
}



// Import the daily monitoring data
function loadDailyData() {
    
    d3.csv("./data/daily_data.csv", function(d) {
      d.val = +d.val;
      d.day = parseDate(d.day.split(".")[0]);
      
      return d;
    }, function(error, data) {
        dailyData = data;
        console.log(dailyData.length);
        
        g_id = d3.select("#selected-station").property('value');
        plotSite(data, g_id);
        
    });
};


loadDailyData();
