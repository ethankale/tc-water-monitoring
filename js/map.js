
/* 
Some of the javascript that drives the Thurston County Water Dashboard.

Relies on leaflet, PapaParse, lodash, Chartist, and moment.js.
The project as a whole uses Bulma, but that's pure html/css, no js.

Created October 19, 2018 by Nat Kale.

*/

/***********************************************
Generic Functions
***********************************************/

function getWaterYear(dt) {
    // dt is a moment.js date object.
    // Returns an integer.
    var mon = dt.month();       // Months are 0-indexed.
    var year = dt.year();
    return (mon > 8 ? year+1 : year);
}

/***********************************************
Mapping Functions
***********************************************/

// List of sites, from CSV file
var sites = {};
var graph_data = {};

var sitemap = L.map("gaugemap", {
    center: [46.97, -122.9],
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
        const site = getSiteFromURL(sites);
        
        if (site != undefined) {
            loadData(site.G_ID);
        }
        
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
    loadData(e.target.g_id);
}

// Close the modal if you click the close button or background
var e_close = document.getElementById("close-modal");
e_close.addEventListener("click", toggleModal, false);
var e_back = document.getElementsByClassName("modal-background")[0];
e_back.addEventListener("click", toggleModal, false);

// Close the instructions 
var e_close_inst = document.getElementById("close_instructions");
e_close_inst.addEventListener("click", function(e) {
    var e_inst = document.getElementById("instructions");
    e_inst.classList.toggle("is-hidden");
});

/***********************************************

Modal Functions

***********************************************/

var mobile_overrides = [
['screen and (max-width: 768px)', {
    axisY: {
        offset: 20
    },
    axisX: {
        offset: 20
    },
    chartPadding: {
        top: 10,
        right: 0,
        bottom: 0,
        left: 3
    }
}]
]


function loadData(gid) {
    //console.log("GID is " + gid)
    toggleModal();
    document.getElementById("gid").innerHTML = gid;
    window.history.pushState(null, null, '?site=' + gid);
    
    var site = _.filter(sites, {"G_ID" : gid})[0];
    
    var el_title = document.getElementById("gauge-name");
    var el_code = document.getElementById("gauge-code");
    el_title.innerHTML = "Loading...";
    el_code.innerHTML = "..."
    
    // Probably would be good to get a gif of a spinner for this.
    // Bulma has a built in loading class?
    var el_chart_long = document.getElementById("daily-long-chart");
    var el_chart_wy = document.getElementById("daily-wateryear-chart");
    var el_footer = document.getElementById("chart-footer");
    el_chart_long.innerHTML = ""
    el_chart_wy.innerHTML = "";
    el_footer.innerHTML = "";
    
    // Find the right parameter to display
    var param_select = document.getElementById('param-select');
    var param_options = "";
    if ((site.type == "Flow") || (site.type == "Lake")) {
        param_options = "<option>Stage</option><option>Temperature</level>"
    } else if (site.type == "Well") {
        param_options = "<option>Level</option><option>Temperature</level>"
    } else if (site.type == "Rain") {
        param_options = "<option>Rainfall</option><option>Temperature</level>"
    }
    
    if (param_select.innerHTML != param_options) {
        param_select.innerHTML = param_options;
    }
    
    var param = param_select.options[param_select.selectedIndex].innerHTML;
    
    // Load data from CSV
    Papa.parse("./data/g_id-" + gid + ".csv", {
        download: true,
        header: true,
        complete: function(results) {
            graph_data = results.data;
            graph_data.forEach(function(d) {
                d.val = +d.val;
                d.temp_c = d.temp_c == "" ? null : ((+d.temp_c * (5/9) + 32));
                d.dt = moment(d.day , 'YYYY-MM-DD HH:mm:ss', true);
                d.wy = getWaterYear(d.dt);
                d.graph_dt = d.dt.clone().add(getWaterYear(moment())-d.wy, 'year');
            })
            //updateMapSites(sites);
            console.log("Graphing data loaded. " + graph_data.length + " data points found.");
            
            el_title.innerHTML = site.SITE_NAME + " (" + site.SITE_CODE + ")";
            el_code.innerHTML = site.SITE_CODE;
            el_footer.innerHTML = "<a href='" + "./data/g_id-" + gid + ".csv'>Download CSV</a>"
            
            // See data-graph.js
            createDataDisplay(site, graph_data, mobile_overrides, param);
        }
    })
}

