
// Build the map from the list of sites.
// Include this after selectsite.js and before plot.js

var displayDateFormat = d3.timeFormat("%Y-%m-%d");

var sitelist = {};

var sitemap = L.map('mapid').setView([47.04, -122.9], 10);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(sitemap);


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



loadSites();





