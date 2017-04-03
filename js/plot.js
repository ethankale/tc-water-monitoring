
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

// Function for building the SVG line from the data
var line = d3.line()
    .x(function(d) { return x_scales[thisYear](d.day); })
    .y(function(d) { return y(d.val); });


// Fires when the year selectbox changes value.
function SelectYearChange() {
    wy = d3.select("#selected-wy").property("value");
    highlightYear(wy);
}

// Highlight the currently selected water year
function highlightYear(wy) {
    d3.selectAll("svg path.valueLine").classed("highlight", false);
    d3.select("svg path.wy" + wy).classed("highlight", true);
    d3.select("#selected-wy").property("value", wy);
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

// Load the daily data
function plotSite(g_id) {
    // If the data have not yet been loaded, pull them in via d3.csv, then
    //   write them to dailyData and update everything.
    
    d3.selectAll("g.x-axis").remove();
    d3.selectAll("g.y-axis").remove();
    svg.selectAll("path.valueLine").remove();
    
    clearStatsRow();
    
    var data = _.filter(dailyData, {"G_ID" : g_id});
    
    if (data.length > 0) {
        updatePlot(g_id);
        updateStatsRow(data);
    } else {
        
        var filepath = "./data/g_id-" + g_id + ".csv"
        //console.log("Loading " + filepath);
        
        d3.csv(filepath, function(d) {
          d.val =  d.val.length > 0 ? +d.val : "-";
          d.day = parseDate(d.day);
          d.wy = calcWaterYear(d.day);
          
          return d;
        }, function(error, data) {
            //console.log("Data file parsed.");
            dailyData = dailyData.concat(data);
            //dailyData = data;
            updatePlot(g_id);
            updateStatsRow(data);
        });
    };
};

// Plot the daily data
function updatePlot(g_id) {
    
    
    // Only show data for the site we"ve selected.
    var data = _.filter(dailyData, {"G_ID" : g_id});
    var data_wy = _.groupBy(data, "wy");
    
    years = _.keys(data_wy);
    var data_plot = [];
    
    // Update the water year select box; standard D3 update/enter/exit pattern
    var options = d3.select("#selected-wy")
        .on('change', SelectYearChange)
      .selectAll("option")
        .data(years, function(d) {return d;});
      
    options.enter().append("option")
        .attr("value", function(d) { return d})
        .text(function(d) {return d});
        
    options.exit().remove();
    
    
    // Get some info about the site we"re working with
    var site = sitelist.filter(function(d) {return d.G_ID == g_id})[0];
    var type = site.type;
    
    // Different data sets for each water year; also sort by day.
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
    
    // Set up the y range; important that it be inside the function for resizing
    //   Might be able to just include rangeRound in the resize function...
    y.rangeRound([height, 0]);
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
    g.selectAll(".valueLine")
      .data(data_plot)
      .enter()
      .append("path")
        .attr("class", function(d,i) {return "valueLine wy" + d.year})
        .classed("currentwy", function(d) {return (new Date()).getFullYear() == +d.year})
        .attr("d", function(d) {
            thisYear = "scale" + d.year;
            return line(d.points)})
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .on("mouseover", function(d) { highlightYear(d.year)});
    
    // Label years on mouseover
    d3.select("g.x-axis")
      .append("text")
        .attr("class", "hoverText")
        .attr("fill", "#000")
        .attr("y", - 20)
        .attr("x", width - 20)
        .attr("dy", "0.8em")
        .attr("text-anchor", "end");
}

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
    plotSite(g_id);
}

d3.select(window).on("resize", resize);

loadSites();


