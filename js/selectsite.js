
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

// The user pressed the back or forward button
window.onpopstate = function(e) {
    

    if(e.state) {
        
        console.log(e.state);
        
        var url = window.location.href;
        
        if (url.split("?").length > 1) {
            g_id = url.split("?")[1].split("=")[1].replace(/\D/g,'');
            selectSite(sitelist, g_id, "popstate");
        }
    }
}

// What happens when a user selects a site from the map or the list
function selectSite(data, g_id, called_by) {
    
    // Set the site GET variable, and update the browser history
    if (typeof called_by === "undefined") {
        url = window.location.href;
        
        if (url.split("?").length > 1) {
            url = url.split("?")[0];
        }
        
        window.history.pushState({"site": g_id}, "TC Water Monitoring", "/?site=" + g_id);
    };
    
    // Collect the site-specific data
    var site = data.filter(function(d) { return (d.G_ID === g_id); })[0];
    d3.select("#selected-station").property("value", g_id);
    
    // Update the download link
    d3.select("#downloadCSV").property("href", "/data/g_id-" + g_id + ".csv");
    
    // Map manipulation
    sitemap.panTo([site.LAT, site.LON]);
    highlightMarker.setLatLng([site.LAT, site.LON]);
    highlightMarker.setIcon(highlightIcon);
    highlightMarker.addTo(sitemap);
    
    // Plot data
    plotSite(g_id);
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

