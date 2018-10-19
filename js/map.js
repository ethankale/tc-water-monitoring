
/* The javascript that drives the Thurston County Water Dashboard.

Relies on leaflet, PapaParse, lodash, Chartist, and moment.js.
The project as a whole uses Bulma, but that's pure html/css, no js.

Created October 19, 2018 by Nat Kale.

*/
/***********************************************

Mapping Functions

***********************************************/

// List of sites, from CSV file
var sites = {};
var graph_data = {};

var sitemap = L.map("gaugemap", {
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
var arcmapBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/' +
    'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/Canvas/World_Light_Gray_Base/MapServer">ArcGIS</a>',
}).addTo(sitemap);

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
                              shadowURL: "./img/marker/square_shadow.png"});
    blueIcon = new SiteIcon({iconUrl: "./img/marker/blue_diamond.png",
                              shadowURL: "./img/marker/shadow_diamond.png"});
    starIcon = new SiteIcon({iconUrl: "./img/marker/select.png",
                              shadowURL: "./img/marker/shadow_select.png"}),
    circleGrayIcon = new SiteIcon({iconUrl: "./img/marker/shadow_circle.png",
                              shadowURL: "./img/marker/shadow_circle.png"}),
    triangleGrayIcon = new SiteIcon({iconUrl: "./img/marker/shadow_triangle.png",
                              shadowURL: "./img/marker/shadow_triangle.png"}),
    squareGrayIcon = new SiteIcon({iconUrl: "./img/marker/square_shadow.png",
                              shadowURL: "./img/marker/square_shadow.png"}),
    diamondGrayIcon = new SiteIcon({iconUrl: "./img/marker/shadow_diamond.png",
                              shadowURL: "./img/marker/shadow_diamond.png"});


function iconType(type, status) {
    var icon = {};
    //console.log(type + " - " + status)
    if (status == "Active") {
        switch (type) {
          case 'Rain':
            icon = greenIcon;
            break;
          case 'Well':
            icon = purpleIcon;
            break;
          case 'Flow':
            icon = orangeIcon;
            break;
          case 'Lake':
            icon = blueIcon;
            break;
        };
    } else {
        switch (type) {
          case 'Rain':
            icon = circleGrayIcon;
            break;
          case 'Well':
            icon = triangleGrayIcon;
            break;
          case 'Flow':
            icon = squareGrayIcon;
            break;
          case 'Lake':
            icon = diamondGrayIcon;
            break;
        };
    };
    
    return icon;
}

// Make a legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (sitemap) {
    var div = L.DomUtil.create("div", "info legend"),
        filenames = ["green_circle.png", "purple_triangle.png", "blue_diamond.png", "orange_square.png"],
        labels = ["Rain", "Well", "Lake", "Stream/<br />River"];
    
    div.innerHTML += '<strong>Gauges</strong><br />Inactive in gray<br />';
    for (var i=0; i<filenames.length; i++) {
        div.innerHTML += '<img src="./img/marker/' + filenames[i] + '"></img>' +
        '  ' + labels[i] + '<br />';
    }
    
    return div;
};

legend.addTo(sitemap)


Papa.parse("./data/station_list.csv", {
    download: true,
    header: true,
    complete: function(results) {
        sites = results.data;
        sites.forEach(function(s) {
            s.LAT = +s.LAT;
            s.LON = +s.LON;
        })
        updateMapSites(sites);
        //console.log("Site load complete.");
    }
})


// Add the monitoring sites to the leaflet map
function updateMapSites(data) {
    
    data.forEach(function(d) {
        if (!(isNaN(d.LAT) || isNaN(d.LON))){
            var theIcon = iconType(d.type, d.STATUS);
            
            var marker = L.marker([d.LAT, d.LON], {
                icon: theIcon,
                riseOnHover: true,
                title: d.SITE_CODE,
                });
            marker.g_id = d.G_ID;
            marker.g_type = d.type;
            marker.g_status = d.STATUS;
            marker.on("click", onMarkerClick);
            
            siteMarkers.addLayer(marker);
            
            if (d.STATUS == "Active") {
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
    //var getvars = window.location.href.split("#")[1];
    //var g_id = typeof getvars === "undefined" ? sitelist[0].G_ID : getvars.split("=")[1].replace(/\D/g,'');
    
    //selectSite(sitelist, g_id);
};

function toggleModal() {
    var e = document.getElementById("graph-modal");
    e.classList.toggle("is-active");
}

// The user clicked on a marker in the Leaflet map
function onMarkerClick(e) {
    //console.log("GID is " + e.target.g_id);
    toggleModal();
    loadData(e.target.g_id);
}

// Close the modal if you click the close button or background
var e_close = document.getElementById("close-modal");
e_close.addEventListener("click", toggleModal, false);
var e_back = document.getElementsByClassName("modal-background")[0];
e_back.addEventListener("click", toggleModal, false);

/***********************************************

Modal Functions

***********************************************/

function loadData(gid) {
    //console.log("GID is " + gid)
    var site = _.filter(sites, {"G_ID" : gid})[0];
    
    var el_title = document.getElementById("gauge-name");
    el_title.innerHTML = "Loading...";
    
    Papa.parse("./data/g_id-" + gid + ".csv", {
        download: true,
        header: true,
        complete: function(results) {
            graph_data = results.data;
            graph_data.forEach(function(d) {
                d.val = +d.val;
                d.temp_c = +d.temp_c;
                d.dt = moment(d.day , 'YYYY-MM-DD HH:mm:ss', true);
            })
            //updateMapSites(sites);
            console.log("Graphing data loaded. " + graph_data.length + " data points found.");
            
            var el_title = document.getElementById("gauge-name");
            var el_code = document.getElementById("gauge-code");
            el_title.innerHTML = site.SITE_NAME + " (" + site.SITE_CODE + ")";
            el_code.innerHTML = site.SITE_CODE;
            
            if (site.type = "Flow") {
                createDischargeDisplay(site, graph_data);
            };
        }
    })
}

function createDischargeDisplay(site, data) {
    var chart_data = _.map(data, function(d) { return {'x': d.dt, 'y':d.val} } );
    var data = {
      // A labels array that can contain any sort of values
      // Our series array that contains series objects or in this case series data arrays
      series: [
        {
          name: 'Discharge',
          data: chart_data
        }
      ]
    };
    var options = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 5,
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM D, YYYY');
        }
      }
    }
    new Chartist.Line('#daily-chart', data, options);
}


