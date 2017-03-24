
// Functions for plotting data
//   Include this AFTER load.js

// D3 line chart constants
//  See https://bl.ocks.org/mbostock/3883245

// Multiple x-scales used to plot all water years on the same axis
//   See http://stackoverflow.com/questions/42870187/d3-multi-series-chart-time-year-interval-x-axis-overlaying-multiple-years-of/42870609

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

var svg = d3.select("svg")
    .attr("width", document.getElementById("mapid").offsetWidth)
    .attr("height", document.getElementById("mapid").offsetHeight),
    margin = {top: 20, right: 10, bottom: 30, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//var x = d3.scaleTime();
var x_scales = {};
var y = d3.scaleLinear();

var thisYear;
var years = [];

// Color the most recent year differently from the other years.
//   May replace this with a function that allows users to select
//   a water year to highlight.

bgcolor = "#d9d9d9";
maincolor = "#525252";
selectcolor = "red";

function color(year) {
    c = "";
    currentWY = calcWaterYear(new Date());
    
    if (+year == currentWY) {
        c = maincolor;
    } else {
        c = bgcolor;
    }
    
    return c;
};

// Function for building the SVG line from the data
var line = d3.line()
    .x(function(d) { return x_scales[thisYear](d.day); })
    .y(function(d) { return y(d.val); });

// Function for handling mouse events; highlight the line when you hover over it
function handleMouseOver(d, i) {
    currentLine = d3.select(this)
                    .attr("stroke-width", 4)
                    .attr("stroke", selectcolor);
    // Use the line below if you want the select line to always appear on top.
    // http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
    //this.parentNode.appendChild(this);
};

function handleMouseOut(d, i) {
    d3.select(this)
        .attr("stroke-width", 1.5)
        .attr("stroke", color(d.year));
};

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
    //   leaflet and d3 don"t seem to play nice together. Hence, this.
    //
    // It will cause an attempt to plot a site to fail (silently, for now)
    //   if the data aren"t yet loaded.
    
    if (data.length >= 0) {
      
      // Wipe out the old graph
      // In the future we can replace this with the standard enter/update/exit pattern,
      //   which will open the door to using transitions, but this is quick & easy
      d3.select("g.x-axis").remove();
      d3.select("g.y-axis").remove();
      svg.selectAll("path.valueLine").remove();
      
      // Only show data for the site we"ve selected; also sort by day.
      data = _.filter(data, {"G_ID" : g_id});
      var data_wy = _.groupBy(data, "wy");
      
      years = _.keys(data_wy);
      var data_plot = [];
      
      // Get some info about the site we"re working with
      site = sitelist.filter(function(d) {return d.G_ID == g_id})[0];
      type = site.type;
      
      // Different data sets for each water year.
      years.forEach(function(d, i) {
          data_plot.push({
              year: d,
              points: _.sortBy(data_wy[d], ["day"])
          });
      });
      
      // Calculate a cumulative total if this is a rain site
      if (type == "Rain" & !(site.cumCalculated == "Y")) {
          data_plot.forEach(function(d) {
              var cumulative = 0;
              d.points.forEach(function(p) {
                  p.oldval = p.val;
                  p.val = cumulative + p.oldval;
                  cumulative = p.val;
              });
          });
          site.cumCalculated = "Y";
      };
      
      // Create separate x scales for each water year.  They need to have the
      //   same range, but the domain will be different; that allows different
      //   dates to map to the same x coordinate, which is what we want.
      years.forEach(function(d) {
          x_scales["scale" + d] = d3.scaleTime()
            .domain([new Date(d-1, 10, 1), new Date(d, 9, 30)])
            .rangeRound([margin.left, width]);
      });
      
      // Set up the range; important that it be inside the function for resizing
      //x.rangeRound([0, width]);
      y.rangeRound([height, 0]);
      
      //x.domain(d3.extent(data, function(d) { return d.day; }));
      y.domain(d3.extent(data, function(d) { return d.val; }));

      // Add the x-axis to the plot.  Use a class to identify it later.
      g.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x_scales["scale" + _.max(years)])
            .tickFormat(d3.timeFormat("%b")))
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
          .attr("dy", "0.8em")
          .attr("text-anchor", "end")
          .text(type == "Rain" ? "Rainfall (inches)" : "Water Level (feet)");
      
      // Add multiple lines to the graph; one for each water year
      g.selectAll("valueLine")
        .data(data_plot)
        .enter()
        .append("path")
          .attr("class", "valueLine")
          .attr("stroke", function(d,i) { return color(d.year)})
          .attr("d", function(d) {
              thisYear = "scale" + d.year;
              return line(d.points)})
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("fill", "none")
          .on("mouseover", handleMouseOver)
          .on("mouseout", handleMouseOut);
        
      
    };
};

// Import the daily monitoring data
//   Runs just once, when the page loads
function loadDailyData() {
    
    d3.csv("./data/daily_data.csv", function(d) {
      d.val = +d.val;
      d.day = parseDate(d.day.split(".")[0]);
      d.wy = calcWaterYear(d.day);
      
      return d;
    }, function(error, data) {
        dailyData = data;
        
        g_id = d3.select("#selected-station").property("value");
        //plotSite(data, g_id);
        
        setSVGSize();
        selectSite(sitelist, g_id);
        
    });
};


// Keep the graph the same size as the map
function setSVGSize() {
    svg.attr("width", document.getElementById("mapid").offsetWidth)
        .attr("height", document.getElementById("mapid").offsetHeight)
    
    width = +svg.attr("width") - margin.left - margin.right;
    height = +svg.attr("height") - margin.top - margin.bottom;
}

function resize() {
    setSVGSize();
    g_id = d3.select("#selected-station").property("value");
    plotSite(dailyData, g_id);
}

d3.select(window).on("resize", resize);


