
// Functions for plotting data
//   Include this AFTER load.js

// D3 line chart constants
//  See https://bl.ocks.org/mbostock/3883245

// Multiple x-scales used to plot all water years on the same axis
//   See http://stackoverflow.com/questions/42870187/d3-multi-series-chart-time-year-interval-x-axis-overlaying-multiple-years-of/42870609

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

var formatMouseNumber = d3.format(",.2f");
var formatMouseDate = d3.timeFormat("%Y-%m-%d");

var svg = d3.select("#chartSVG")
    .attr("width", document.getElementById("mapid").offsetWidth)
    .attr("height", document.getElementById("mapid").offsetHeight),
    margin = {top: 20, right: 10, bottom: 75, left: 35},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Add the SVG container for the plot
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

// Function to support labelling on mouseover
bisectDate = d3.bisector(function(d) { return d.day; }).left

// Color the dots that indicate provisional, warning, and estimated data
//   differently from each other; warning > estimated > provisional

function qalevel(d) {
    var level = "";
    if (d.w == 1) {
      level = "Warning";
    } else if (d.e == 1) {
      level = "Estimate";
    } else if (d.p == 1) {
      level = "Provisional";
    }
    return level;
}

var circleColor = d3.scaleOrdinal()
    .domain(["Normal","Warning", "Estimate", "Provisional"])
    .range(["#cccccc", "#8e0152", "#de77ae", "#4d9221"])

// Add the legend
svg.append("g")
  .attr("class", "legendOrdinal")
  .attr("transform", "translate(" + margin.left + ", " + (height + margin.bottom - 5) + ")");

var legend = d3.legendColor()
    .shape("circle")
    .orient("horizontal")
    .shapeRadius(3)
    .shapePadding((width + margin.left + margin.right)/4)
    .scale(circleColor)

svg.select(".legendOrdinal")
    .call(legend);

// Function for building the SVG line from the data
var line = d3.line()
    .x(function(d) { return x_scales[thisYear](d.day); })
    .y(function(d) { return y(d.plotval); });

// Fires when the year selectbox changes value.
function SelectYearChange() {
    wy = d3.select("#selected-wy").property("value");
    highlightYear(wy);
}

// Highlight the currently selected water year
function highlightYear(wy) {
    d3.selectAll("svg path.valueLine").classed("highlight", false);
    d3.selectAll("svg circle.valueCircle").classed("highlight", false);
    d3.select("#selected-wy").property("value", wy);
    
    var currentYear = calcWaterYear(new Date())
    if (wy != currentYear) {
        d3.select("svg path.wy" + wy).classed("highlight", true);
        d3.selectAll("svg circle.wy" + wy).classed("highlight", true);
    }
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

// Take raw daily data and filter by G ID, set the plot values correctly,
//  and remove NA/NAN values
function filterData(g_id, dailyData, param) {
    var data_filtered = _.filter(dailyData, {"G_ID" : g_id});
    if (param == "level") {
        data_filtered.forEach(function(d) { d.plotval = d.val})
    } else if (param == "temp") {
        data_filtered.forEach(function(d) { d.plotval = d.temp_c})
    }
    var d2 = _.filter(data_filtered, function(d) { return parseFloat(d.plotval) === d.plotval})
    return d2;
}


// Load the daily data
function plotSite(g_id, param) {
    // If the data have not yet been loaded, pull them in via d3.csv, then
    //   write them to dailyData and update everything.
    
    d3.selectAll("g.x-axis").remove();
    d3.selectAll("g.y-axis").remove();
    svg.selectAll("path.valueLine").remove();
    svg.selectAll("circle.valueCircle").remove();
    
    clearStatsRow();
    
    var data = _.filter(dailyData, {"G_ID" : g_id});
    
    if (data.length > 0) {
        updatePlot(g_id, param);
        updateStatsRow(g_id, data, param);
    } else {
        var filepath = "./data/g_id-" + g_id + ".csv"
        //console.log("Loading " + filepath);
        
        d3.csv(filepath, function(d) {
          d.val =  d.val.length > 0 ? +d.val : "-";
          d.temp_c = d.temp_c > 0 ? +d.temp_c : "-";
          d.day = parseDate(d.day);
          d.wy = calcWaterYear(d.day);
          d.p = d.provisional == 0 || d.provisional == "False" ? 0 : 1;
          d.w = d.warning == 0 || d.warning == "False" ? 0 : 1;
          d.e = d.estimate == 0 || d.estimate == "False" ? 0 : 1;
          d.qa = qalevel(d);
          
          return d;
        }, function(error, data) {
            if(data.length > 0) {
                dailyData = dailyData.concat(data);
                updatePlot(g_id, param);
                updateStatsRow(g_id, data, param);
            } else {
                d3.select(".quick-stats.recent").html("<small>--</small><br />No Data Available<br /><small>--</small>");
            }
        });
    };
};

// Plot the daily data
function updatePlot(g_id, param) {
    param = param || "level";
    
    // Get some info about the site we're working with
    var site = sitelist.filter(function(d) {return d.G_ID == g_id})[0];
    var type = site.type;
    
    // Set the status of the parameter buttons/images
    d3.selectAll("#buttonRow img").classed("disabled", false)
    
    var data_t = filterData(g_id, dailyData, "temp")
    if (data_t.length == 0) {
        d3.select("#thermImg").classed("disabled", true)
        //d3.select("#tempIconLabel").classed("text-muted", true)
    }
    
    var data_l = filterData(g_id, dailyData, "level")
    if (data_l.length == 0) {
        d3.select("#waterImg").classed("disabled", true)
    }
    
    // Only show data for the site we've selected.
    //  This MUST be after the parameter button stuff, otherwise
    //  it messes with the filtered data
    var data = filterData(g_id, dailyData, param)
    
    var data_wy = _.groupBy(data, "wy");
    
    years = _.keys(data_wy);
    var wy_options = _.clone(years);
    var data_plot = [];
    
    // Update the buttons 
    d3.selectAll("#buttonRow img").classed("selected", false)
    //d3.selectAll("#buttonRow p").classed("text-muted", true)
    if (param == "level") {
        d3.select("#waterImg").classed("selected", true)
        //d3.select("#waterIconLabel").classed("text-muted", false)
    } else if (param == "temp") {
        d3.select("#thermImg").classed("selected", true)
        //d3.select("#tempIconLabel").classed("text-muted", false)
    }
    
    if (type == "Rain") {
        d3.select("#waterIconLabel").text("Rainfall")
    } else {
        d3.select("#waterIconLabel").text("Water Level")
    }
    
    // Remember the currently selected water year
    var selected_wy = d3.select("#selected-wy").property("value")
    
    // Update the water year select box; standard D3 update/enter/exit pattern
    //wy_options.push("Clear");
    var options = d3.select("#selected-wy")
        .on('change', SelectYearChange)
      .selectAll("option")
        .data(wy_options, function(d) {return d;});
      
    options.enter().append("option")
        .attr("value", function(d) { return d})
        .text(function(d) {return d});
        
    options.exit().remove();
    
    // Select the water year that was selected before, OR the most recent water year
    if(!years.includes(selected_wy)) { selected_wy = years[years.length-1] }
    d3.select("#selected-wy").property("value", selected_wy)
    
    // Different data sets for each water year; also sort by day.
    years.forEach(function(d, i) {
        data_plot.push({
            year: d,
            points: _.sortBy(data_wy[d], ["day"])
        });
    });
    
    // Create separate x scales for each water year.  They need to have the
    //   same range, but the domain will be different; that allows different
    //   dates to map to the same x coordinate, which is what we want.
    years.forEach(function(d) {
        x_scales["scale" + d] = d3.scaleTime()
          .domain([new Date(d-1, 9, 1), new Date(d, 8, 30)])
          .rangeRound([margin.left, width]);
    });
    
    // Calculate a cumulative total if this is a rain site
    //  AND we're measuring rainfall (not temperature)
    //if (type == "Rain" & !(site.cumCalculated == "Y") & param == "level") {
    if (type == "Rain" & param == "level") {
        data_plot.forEach(function(d) {
            var cumulative = 0;
            d.points.forEach(function(p) {
                p.oldval = p.plotval;
                p.plotval = cumulative + p.oldval;
                cumulative = p.plotval;
            });
        });
        //site.cumCalculated = "Y";
    };
    
    // Set up the y range; important that it be inside the function for resizing
    y.rangeRound([height, 0]);
    y_extent = d3.extent(data, function(d) { return d.plotval; });
    y_extent[0] = y_extent[0] - 0.1;
    y_extent[1] = y_extent[1] + 0.1;
    if (type == "Well" & param == "level") {
        y_extent = [y_extent[0], Math.max(y_extent[1], site.Elevation)]
    }
    y.domain(y_extent)
        .tickFormat(d3.format(".1f"));
    
    // Add the mouseover data overlay to the plot
    d3.selectAll(".focus").remove();
    d3.selectAll(".overlay").remove();
    
    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");
    
    focus.append("circle")
        .attr("r", 4.5);
    
    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");
    
    // Add the x-axis to the plot.  Use a class to identify it later.
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x_scales["scale" + _.max(years)])
          .tickFormat(d3.timeFormat("%b")))
      .select(".domain")
        .remove();
    
    g.select(".x-axis")
      .append("text")
        .attr("class", "x-axis-label")
        .attr("font-size", "1.2em")
        .attr("y", 40)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .text("Why October through September?")
        .on("click", function() {window.open("http://www.thurstoncountywa.gov/sw/Pages/monitoring-researchers-definitions.aspx"); });
    
    // Add the y-axis to the graph.  Includes some labeling text.
    var axisLabel = "";
    if (param == "level") {
        switch (type) {
            case "Rain": 
                axisLabel = "Rainfall (inches)";
                break;
            case "Well":
                axisLabel = "Water Elevation (feet)";
                break;
            default:
                axisLabel = "Water Level (feet)";
        }
    } else if (param == "temp") {
        axisLabel = "Temperature (celsius)";
    }
    g.append("g")
        .call(d3.axisLeft(y))
        .attr("class", "y-axis")
      .append("text")
        .attr("fill", "#000")
        .attr("font-size", "1.2em")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "1em")
        .attr("text-anchor", "end")
        .text(axisLabel)
    // Add circles for the provisional values
    var data_provisional = _.filter(data, function(d) {
        return d.p + d.e + d.w > 0;
    });
    
    g.selectAll(".valueCircle")
        .data(data_provisional)
        .enter()
        .append("circle")
        .attr("class", function(d,i) {return "valueCircle wy" + d.wy})
        .attr("cx", function(d) { return x_scales["scale" + d.wy](d.day)})
        .attr("cy", function(d) { return y(d.plotval)})
        .attr("r", 3)
        .attr("stroke", function(d) { return circleColor(d.qa)})
        .attr("fill", function(d) { return circleColor(d.qa)})
        .on("click", function(d) { highlightYear(d.wy)})
      .exit()
        .remove();
    
    
    // Add multiple lines to the graph; one for each water year
    g.selectAll(".valueLine")
      .data(data_plot)
      .enter()
      .append("path")
        .attr("class", function(d,i) {return "valueLine wy" + d.year})
        .classed("currentwy", function(d) {return (calcWaterYear(new Date()) == +d.year)})
        .attr("d", function(d) {
            thisYear = "scale" + d.year;
            return line(d.points)})
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .on("click", function(d) { highlightYear(d.year)});
    
    // Add the ground elevation to the plot (or remove it, if not a well)
    var groundLine = g.select("#groundLine")
    var groundText = g.select("#groundText")
    
    if(site.type == "Well" & param == "level") {
        var firstYear = years[0];
        //var dates = _.map(data, 'day')
        var data_ground = [{day: new Date(firstYear-1, 9, 1), plotval: site.Elevation},
                           {day: new Date(firstYear, 8, 30), plotval: site.Elevation}]
        
        //console.log(data_ground);
        //console.log(line(data_ground));
        
        if(groundLine.empty()) {
            groundLine = g.append('path')
                .attr("id", "groundLine")
                .attr("class", "groundLine")
                .attr("d", function(){thisYear = "scale" + firstYear; return line(data_ground)})
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("fill", "none");
            
            groundText = g.append('text')
                .attr("id", "groundText")
                .text("Ground Elevation")
                .attr("text-anchor", "middle")
                .attr("y", -10)
                .attr("x", (width)/2);
        } else {
            groundLine.attr("d", function(){thisYear = "scale" + firstYear; return line(data_ground)})
        }
    } else {
        groundLine.remove();
        groundText.remove();
    }
    
    // Label years on mouseover
    var hover = d3.select("g.x-axis")
      .append("text")
        .attr("class", "hoverText")
        .attr("fill", "#000")
        .attr("y", - 20)
        .attr("x", width - 20)
        .attr("dy", "0.8em")
        .attr("text-anchor", "end");
    
    // Label values on mouseover  
    
    g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); hover.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); hover.style("display", "none"); })
        .on("mousemove", mousemove);
    
    function mousemove() {
        var x = x_scales["scale" + d3.select("#selected-wy").property("value")],
            x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i];
        if ( (typeof(d0) != "undefined") && (typeof(d1) != "undefined")  && (x(x0) >= margin.left)) {
            var d = x0 - d0.day > d1.day - x0 ? d1 : d0;
            hover.text(formatMouseNumber(d.plotval) + " | " + formatMouseDate(d.day));
            focus.attr("transform", "translate(" + x(d.day) + "," + y(d.plotval) + ")");
        };
        //focus.select("text").text(formatMouseNumber(d.plotval) + " <br> " + formatMouseDate(d.day));
    }
    
    SelectYearChange()
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
    // Reset legend to match width
    legend.shapePadding((width + margin.left + margin.right)/4);
    svg.select(".legendOrdinal").call(legend);
    g_id = d3.select("#selected-station").property("value");
    var groundText = g.select("#groundText");
    if(!groundText.empty()) {groundText.attr("x", (width)/2);};
    plotSite(g_id, currentParam());
}

d3.select(window).on("resize", resize);

loadSites();


