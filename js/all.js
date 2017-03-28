
// Load this file first, before map.js and plot.js

// On load, the progression is to load the globals (this script),
//   then load the site list & map (map.js).  Then the first site
//   is selected, and the plotSite() function creates a graph.


/* Functions that control what happens when a site is selected.

   Three possible ways to select a site:
   - Click a marker
   - Select an option from the selectbox
   - Load the map (eventually use http POST to store selected site)
   
   Once a site is selected, do three things:
   - Pan the map to the site location
   - Update the selectbox option to the correct site
   - Update the graph for the new data
*/

// Global variables.  I know, I"m a terrible person.
var sitelist = {};
var dailyData = [];

// The user selected a different site in the selectbox
function selectChange() {
    g_id = d3.select("#selected-station").property("value");
    selectSite(sitelist, g_id);
}

// The user clicked on a marker in the Leaflet map
function onMarkerClick(e) {
    selectSite(sitelist, e.target.g_id);
}

// What happens when a user selects a site from the map or the list
function selectSite(data, g_id) {
    var site = data.filter(function(d) { return (d.G_ID === g_id); })[0];
    d3.select("#selected-station").property("value", g_id);
    
    // Map manipulation
    sitemap.panTo([site.LAT, site.LON]);
    highlightMarker.setLatLng([site.LAT, site.LON]);
    highlightMarker.setIcon(highlightIcon);
    highlightMarker.addTo(sitemap);
    
    // Plot data
    plotSite(g_id);
    
    // Update the quick-stats bar
    //var currentData = _.filter(dailyData, {G_ID: g_id});
    //updateStatsRow(currentData);
}

// Calculate and add statistics to the stats row, using
//   data from the currently selected site
function updateStatsRow(data) {
    
    //d3.selectAll(".quick-stats").classed("bg-info", false)
    
    // Calculate statistics
    var prettyDate = d3.timeFormat("%b %e, %Y");
    var yearOnlyFormat = d3.timeFormat("%Y");
    
    var site = sitelist.filter(function (d) { return (d.G_ID === data[0].G_ID); })[0];
    
    var maxMeasure = _.maxBy(data, "val");
    var mostRecent = _.maxBy(data, "day");
    
    var currYearList = _.uniqBy(data, "wy");
    var yearCount = currYearList.length;
    var maxYear = _.maxBy(currYearList, "wy").wy;
    
    var currWY = calcWaterYear(new Date());
    var data_thisyear = _.filter(data, {"wy": currWY});
    
    // If there is no data for the current year, replacement values
    var maxThisYearVal;
    var maxThisYearDay;
    
    if (maxYear === currWY) {
        var maxThisYear = {};
        
        if (site.type === "Rain") {
            maxThisYear = _.maxBy(data_thisyear, "oldval");
            maxThisYearVal = maxThisYear.oldval.toFixed(2);
        } else {
            var maxThisYear = _.maxBy(data_thisyear, "val");
            maxThisYearVal = maxThisYear.val.toFixed(2);
        }
        
        maxThisYearDay = prettyDate(maxThisYear.day);
        
    } else {
        maxThisYearVal = "No Data";
        maxThisYearDay = "--";
        
    }
    
    //console.log(maxThisYearVal);
    //console.log(maxThisYearDay);
    
    // Tailor the context of the stats to the type of station we"re looking at
    var recentContext1 = "Most Recent";
    var recentContext2 = "";
    
    var max_currentyearContext1 = "Max This Year";
    
    var max_overallContext1 = "Highest Recorded";
    var max_overallDate = prettyDate(maxMeasure.day)
    
    if (site.type == "Rain") {
        recentContext1 = "Inches This Year";
        recentContext2 = "As Of ";
        
        max_currentyearContext1 = "Wettest Day This Year";
        
        max_overallContext1 = "Wettest Year";
        max_overallDate = yearOnlyFormat(maxMeasure.day);
    }
    
    // Using the calculated stats & context, update the text
    d3.select(".quick-stats.recent").html("<small>" + recentContext1 + "</small><br />" +
        mostRecent.val.toFixed(2) +
        " <br /><small>" + recentContext2 + prettyDate(mostRecent.day) + "</small>");
    
    d3.select(".quick-stats.count").html("<small>Years Measured</small><br />" +
        yearCount);
    
    d3.select(".quick-stats.max-currentyear").html("<small>" + max_currentyearContext1 + "</small><br />" +
        maxThisYearVal +
        "<br /><small>" + maxThisYearDay + "</small>");
        
    d3.select(".quick-stats.max-overall").html("<small>" + max_overallContext1 + "</small><br />" +
        maxMeasure.val.toFixed(2) +
        "<br /><small>" + max_overallDate + "</small>");

}

// Remove data from the stats row, and display a "Loading" alert
function clearStatsRow() {
    d3.select(".quick-stats.recent").html("<small>--</small><br />Loading...<br /><small>--</small>");
    d3.select(".quick-stats.count").html("");
    d3.select(".quick-stats.max-currentyear").html("");
    d3.select(".quick-stats.max-overall").html("");
    
    //d3.selectAll(".quick-stats").classed("bg-info", true)
}



// Build the map from the list of sites.
// Include this after selectsite.js and before plot.js

var displayDateFormat = d3.timeFormat("%Y-%m-%d");

var sitemap = L.map("mapid").setView([47.04, -122.9], 10);

// For now, we"ll use OSM.  In the future it might behoove us to make our own
//  tile layer, maybe using NAIP, hillshade, streets, NHD?

var layer = new L.StamenTileLayer("toner");
sitemap.addLayer(layer);


//L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
//    maxZoom: 18,
//}).addTo(sitemap);

// Custom icons to differentiate between well, rain, and discharge monitoring.
var CircleIcon = L.Icon.extend({
    options: {
        shadowUrl: "./img/marker/shadow_circle.png",
        iconSize:     [15, 15],
        shadowSize:   [15, 15],
        iconAnchor:   [7.5, 7.5],
        shadowAnchor: [5, 5],
        popupAnchor:  [15, 15]
    }
});

var greenIcon = new CircleIcon({iconUrl: "./img/marker/green_circle.png"}),
    purpleIcon = new CircleIcon({iconUrl: "./img/marker/purple_circle.png"}),
    orangeIcon = new CircleIcon({iconUrl: "./img/marker/orange_circle.png"});

// The highlight icon will be different - slightly larger
var highlightIcon = L.icon({
    iconUrl: "./img/marker/highlight_circle.png",
    
    iconSize:       [10, 10],
    shadowSize:     [10, 10],
    iconAnchor:     [5, 5],
    shadowAnchor:   [10, 10],
    popupAnchor:    [10, 10]
})

var highlightMarker = L.marker({icon: highlightIcon});

function iconType(type) {
    var icon = {};
    
    if (type == "Rain") {
        icon = greenIcon;
    } if (type == "Well") {
        icon = purpleIcon;
    } if (type == "Flow") {
        icon = orangeIcon;
    };
    
    return icon;
}

// Load the data from the CSV file into memory
function loadSites() {
    
    d3.csv("./data/station_list.csv", function(d) {
      d.id = +d.G_ID;
      d.LAT = +d.LAT;
      d.LON = +d.LON;
      
      return d;
    }, function(error, data) {
      //if (error) throw error;
      
      data = data.filter(function(d) {return d.STATUS == "Active"})
      
      // Create the list of sites in the selectbox
      var select = d3.select("#selected-station")
          .on("change", selectChange)
        .selectAll("option")
        .data(data)
        .enter()
        .append("option")
          .attr("value", function(d) { return d.G_ID})
          .text(function(d) {return d.SITE_CODE + ": " + d.SITE_NAME + " (" + d.type + ")"});
      
      sitelist = data;
      
      updateMapSites(data);
      
    });
};

// Add the monitoring sites to the leaflet map
function updateMapSites(data) {
    
    data.forEach(function(d) {
        if (!(isNaN(d.LAT) || isNaN(d.LON)) & d.STATUS == "Active"){
            
            var marker = L.marker([d.LAT, d.LON], {icon: iconType(d.type)});
            marker.g_id = d.G_ID;
            marker.on("click", onMarkerClick);
            
            marker.addTo(sitemap);
        };
    });
    
    // Load up data when we launch the page
    var g_id = sitelist[0].G_ID;
    //console.log(g_id);
    
    plotSite(g_id);
    
};









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
    d3.select(".x-axis .hoverText")
        .text(d.year);
    // Use the line below if you want the select line to always appear on top.
    // http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
    //this.parentNode.appendChild(this);
};

function handleMouseOut(d, i) {
    d3.select(this)
        .attr("stroke-width", 1.5)
        .attr("stroke", color(d.year));
    
    d3.select(".x-axis .hoverText")
        .text("");
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
    
    var years = _.keys(data_wy);
    var data_plot = [];
    
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


