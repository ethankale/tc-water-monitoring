
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

var x = d3.scaleTime();

var y = d3.scaleLinear();

var line = d3.line()
    .x(function(d) { return x(d.day); })
    .y(function(d) { return y(d.val); });

// Helper function that takes a date object and calculates the water year
function calcWaterYear(dt) {
    var year = dt.getFullYear();
    var month = dt.getMonth();
    
    var wy = year;
    
    // Months are zero-indexed in js, so this is greater than
    //  or equal to October
    if (month >= 9) {
        wy = year + 1;
    };
    
    return(wy);
}

// Plot the daily data
function plotSite(data, g_id) {
    // This is an async problem.  Really, we should be working with the
    //   async nature of d3.csv and embedding things in callbacks.  However,
    //   leaflet and d3 don't seem to play nice together. Hence, this.
    //
    // It will cause an attempt to plot a site to fail (silently, for now)
    //   if the data aren't yet loaded.
    
    if (data.length >= 0) {
      
      // Wipe out the old graph
      d3.select("g.x-axis").remove();
      d3.select("g.y-axis").remove();
      d3.select("path").remove();
      
      
      // Only show data for the site we've selected; also sort by day.
      data = _.filter(data, {"G_ID" : g_id});
      data = _.sortBy(data, ["day"]);
      
      // Set up the range; important that it be inside the function for resizing
      x.rangeRound([0, width]);
      y.rangeRound([height, 0]);
      
      x.domain(d3.extent(data, function(d) { return d.day; }));
      y.domain(d3.extent(data, function(d) { return d.val; }));

      // Add the x-axis to the plot.  Us a class to identify it later.
      g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .attr("class", "x-axis")
        .select(".domain")
          .remove();
    
      // Add the y-axis to the graph.  Includes some labeling text.
      g.append("g")
          .call(d3.axisLeft(y))
          .attr("class", "y-axis")
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Value");

      // Add the actual data (line) to the graph.
      g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);
    };
};



// Import the daily monitoring data
function loadDailyData() {
    
    d3.csv("./data/daily_data.csv", function(d) {
      d.val = +d.val;
      d.day = parseDate(d.day.split(".")[0]);
      d.wy = calcWaterYear(d.day);
      
      return d;
    }, function(error, data) {
        dailyData = data;
        console.log(dailyData.length);
        
        g_id = d3.select("#selected-station").property('value');
        plotSite(data, g_id);
        
    });
};


// Keep the graph the same size as the map
function resize() {
    
    svg.attr('width', sitemap.getSize().x)
        .attr('height', sitemap.getSize().y);
    
    width = +svg.attr("width") - margin.left - margin.right;
    height = +svg.attr("height") - margin.top - margin.bottom;
    
    g_id = d3.select("#selected-station").property('value');
    plotSite(dailyData, g_id);
    
}

d3.select(window).on('resize', resize);

// Load up data when we launch the page
loadDailyData();
