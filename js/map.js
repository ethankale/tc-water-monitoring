
// Build the map from the list of sites.
// Include this after selectsite.js and before plot.js

var displayDateFormat = d3.timeFormat("%Y-%m-%d");

var sitemap = L.map("mapid", {
    center: [47.04, -122.9],
    zoom: 10,
    scrollWheelZoom: true,
    dragging: true
    //tap: false
});

var siteMarkers = L.layerGroup();
var inactiveMarkers = L.layerGroup();
var rainMarkers = L.layerGroup();
var streamMarkers = L.layerGroup();
var wellMarkers = L.layerGroup();
var lakeMarkers = L.layerGroup();

// Basemap
var arcmapBase = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
}).addTo(sitemap);

//sitemap.on('focus', function() {sitemap.dragging.enable(); })
//sitemap.on('blur', function() {sitemap.dragging.disable(); })

// Stamen
//var layer = new L.StamenTileLayer("toner");
//sitemap.addLayer(layer);

// Osm
//L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
//    maxZoom: 18,
//}).addTo(sitemap);

// Custom icons to differentiate between well, rain, and discharge monitoring.
var SiteIcon = L.Icon.extend({
    options: {
        iconSize:     [15, 15],
        shadowSize:   [15, 15],
        iconAnchor:   [7.5, 7.5],
        shadowAnchor: [5, 5],
        popupAnchor:  [15, 15]
    }
});

var greenIcon = new SiteIcon({iconUrl: "./img/marker/green_circle.png",
                              shadowURL: "./img/marker/shadow_circle.png"}),
    purpleIcon = new SiteIcon({iconUrl: "./img/marker/purple_triangle.png",
                              shadowURL: "./img/marker/shadow_triangle.png"}),
    orangeIcon = new SiteIcon({iconUrl: "./img/marker/orange_square.png",
                              shadowURL: "./img/marker/shadow_square.png"});
    blueIcon = new SiteIcon({iconUrl: "./img/marker/blue_diamond.png",
                              shadowURL: "./img/marker/shadow_diamond.png"});
    starIcon = new SiteIcon({iconUrl: "./img/marker/select.png",
                              shadowURL: "./img/marker/shadow_select.png"});

// The highlight icon will be different - slightly smaller
// var highlightIcon = L.icon({
    // iconUrl: "./img/marker/highlight_circle.png",
    
    // iconSize:       [10, 10],
    // shadowSize:     [10, 10],
    // iconAnchor:     [5, 5],
    // shadowAnchor:   [10, 10],
    // popupAnchor:    [10, 10]
// })

// var highlightMarker = L.marker({icon: highlightIcon});

function iconType(type) {
    var icon = {};
    
    if (type == "Rain") {
        icon = greenIcon;
    } if (type == "Well") {
        icon = purpleIcon;
    } if (type == "Flow") {
        icon = orangeIcon;
    } if (type == "Lake") {
        icon = blueIcon;
    };
    
    return icon;
}

// Make a legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (sitemap) {
    var div = L.DomUtil.create("div", "info legend"),
        filenames = ["green_circle.png", "purple_triangle.png", "blue_diamond.png", "orange_square.png"],
        labels = ["Rain", "Well", "Lake", "Stream/<br />River"];
    
    div.innerHTML += '<strong>Gauges</strong><br />';
    for (var i=0; i<filenames.length; i++) {
        div.innerHTML += '<img src="./img/marker/' + filenames[i] + '"></img>' +
        '  ' + labels[i] + '<br />';
    }
    
    return div;
};

legend.addTo(sitemap)

// Load the data from the CSV file into memory
function loadSites() {
    
    d3.csv("./data/station_list.csv", function(d) {
      d.id = +d.G_ID;
      d.LAT = +d.LAT;
      d.LON = +d.LON;
      d.Elevation = +d.Elevation;
      
      return d;
    }, function(error, data) {
      //if (error) throw error;
      
      //data = data.filter(function(d) {return d.STATUS == "Active"})
      
      // Create the list of sites in the selectbox
      var select = d3.select("#selected-station")
        .selectAll("option")
        .data(data)
        .enter()
        .append("option")
          .attr("value", function(d) { return d.G_ID})
          .text(function(d) {return d.SITE_CODE + ": " + d.SITE_NAME + " (" + (d.type == "Flow" ? "Stream" : d.type) + ")"});
      
      sitelist = data;
      
      // Make the select box better
      $('#selected-station').select2({
          theme: "bootstrap",
          width: "100%"
      });
      
      $('#selected-station').on('select2:select', function(e) {
          selectChange();
      });
      
      updateMapSites(sitelist);
    });
};

// Add the monitoring sites to the leaflet map
function updateMapSites(data) {
    
    data.forEach(function(d) {
        if (!(isNaN(d.LAT) || isNaN(d.LON))){
            
            var marker = L.marker([d.LAT, d.LON], {
                icon: iconType(d.type),
                riseOnHover: true,
                title: d.SITE_CODE,
                });
            marker.g_id = d.G_ID;
            marker.g_type = d.type;
            marker.on("click", onMarkerClick);
            
            siteMarkers.addLayer(marker);
            
            switch (d.type) {
              case 'Flow':
                streamMarkers.addLayer(marker);
                break;
              case 'Well':
                wellMarkers.addLayer(marker);
                break;
              case 'Rain':
                rainMarkers.addLayer(marker);
                break;
              case 'Lake':
                lakeMarkers.addLayer(marker);
            }
            
            if (d.STATUS == "Active") {

            } else {
                inactiveMarkers.addLayer(marker);
            };
        };
    });
    
    siteMarkers.addTo(sitemap);
    streamMarkers.addTo(sitemap);
    rainMarkers.addTo(sitemap);
    wellMarkers.addTo(sitemap);
    lakeMarkers.addTo(sitemap);
    inactiveMarkers.addTo(sitemap);
    
    // Add a layer control

    
    var overlayMaps = {
        "Stream/River": streamMarkers,
        "Rain": rainMarkers,
        "Well": wellMarkers,
        "Lake": lakeMarkers,
        "Inactive": inactiveMarkers
    };
    
    var baseMaps = {
        "ArcMap": arcmapBase
    };
    
    L.control.layers(null, overlayMaps).addTo(sitemap);
    
    // Load up data when we launch the page
    var getvars = window.location.href.split("#")[1];
    var g_id = typeof getvars === "undefined" ? sitelist[0].G_ID : getvars.split("=")[1].replace(/\D/g,'');
    
    selectSite(sitelist, g_id);
};

// The user clicked on a marker in the Leaflet map
function onMarkerClick(e) {
    selectSite(sitelist, e.target.g_id);
}







