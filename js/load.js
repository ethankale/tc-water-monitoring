
// Build the map from the list of sites.

var displayDateFormat = d3.timeFormat("%Y-%m-%d");

var sitelist = {};

var sitemap = L.map('mapid').setView([47.04, -122.9], 10);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(sitemap);

// Add bootstrap alert classes to html elements, depending on how long
//  it's been since the last data collection
function alertStatus(days) {
    var htmlclass;
    
    if (days > 30 & days <= 90) {
        htmlclass = "alert alert-warning";
    } else if (days > 90) {
        htmlclass = "alert alert-danger";
    } else if (days == "-") {
        htmlclass = "alert alert-info";
    }
    
    return htmlclass;
}

// Load the data from the CSV file into memory
function loadSites() {
    
    d3.csv("./data/station_list.csv", function(d) {
      d.id = +d.G_ID;
      d.LAT = +d.LAT;
      d.LON = +d.LON;
      
      return d;
    }, function(error, data) {
      if (error) throw error;
      
      data = data.filter(function(d) {return d.STATUS == 'Active'})
      
      // Create the list of sites in the selectbox
      var select = d3.select('#selected-station')
          .on('change', selectChange)
        .selectAll('option')
        .data(data)
        .enter()
        .append('option')
          .attr('value', function(d) { return d.G_ID})
          .text(function(d) {return d.SITE_CODE + ": " + d.SITE_NAME});
      
      sitelist = data;
      
      updateMapSites(data);
      
    });
};

// Add the monitoring sites to the leaflet map
function updateMapSites(data) {
    
    data.forEach(function(d) {
        if (!(isNaN(d.LAT) || isNaN(d.LON)) & d.STATUS == "Active"){
            
            var marker = L.marker([d.LAT, d.LON]);
            marker.g_id = d.G_ID;
            marker.on('click', onMarkerClick);
            
            marker.addTo(sitemap);
        };
    });
    
    selectSite(data, data[0].G_ID);
};

// The user selected a different site in the selectbox
function selectChange() {
    g_id = d3.select("#selected-station").property('value');
    selectSite(sitelist, g_id);
}

// What happens when a user selects a site from the map or the list
function selectSite(data, g_id) {
    var site = data.filter(function(d) { return(d.G_ID == g_id) })[0];
    d3.select("#selected-station").property('value', g_id);
    sitemap.panTo([site.LAT, site.LON]);
}

// Select the site when you click on the marker
function onMarkerClick(e) {
    selectSite(sitelist, e.target.g_id);
}

loadSites();





