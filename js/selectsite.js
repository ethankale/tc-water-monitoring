
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

// Polyfills

// Array.includes
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1. 
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}


// Global variables. 
var sitelist = {};
var dailyData = [];
var siteurls = {};
var message = "";

// The user selected a different site in the selectbox
function selectChange() {
    g_id = d3.select("#selected-station").property("value");
    selectSite(sitelist, g_id);
}

// The user pressed the back or forward button
window.onpopstate = function(e) {
    if(e.state) {
        
        //console.log(e.state);
        
        var url = window.location.href;
        
        if (url.split("#").length > 1) {
            g_id = url.split("#")[1].split("=")[1].replace(/\D/g,'');
            selectSite(sitelist, g_id, "popstate");
        }
    }
}

// Showing or hiding the stats row
$("#toggle_stats_link").click(function(e) { 
    e.preventDefault();
    $("#quick_stats_row").toggleClass("hidden");
});

// What happens when a user selects a site from the map or the list
function selectSite(data, g_id, called_by) {
    
    // Set the site GET variable, and update the browser history
    if (typeof called_by === "undefined") {
        url = window.location.href;
        
        if (url.split("#").length > 1) {
            url = url.split("#")[0];
        }
        
        window.history.pushState({"site": g_id}, "TC Water Monitoring", "#site=" + g_id);
    };
    
    // Collect the site-specific data
    var site = data.filter(function(d) { return (d.G_ID === g_id); })[0];
    //d3.select("#selected-station").property("value", g_id);
    $("#selected-station").val(g_id);
    $("#selected-station").trigger("change");
    
    // Update the download and more information links
    d3.select("#downloadCSV").property("href", url.split("#")[0].split("index")[0] + "/data/g_id-" + g_id + ".csv");
    
    if (site.URL == "") {
        d3.select("#siteInfoSpan").style("visibility", "hidden")
    } else {
        d3.select("#siteInfoSpan").style("visibility", "visible")
        d3.select("#siteInfoLink").property("href", site.URL)
    }
    //d3.select("#siteInfoLink").property("href", site.URL == "NULL" ? "http://www.thurstoncountywa.gov/sw/Pages/monitoring-dashboard.aspx" : site.URL);
    
    // Map manipulation
    sitemap.panTo([site.LAT, site.LON]);
    
    
    var i = 0;
    siteMarkers.eachLayer(function(layer) {
        i++;
        if (g_id == layer.g_id) {
            layer.setZIndexOffset(1000);
            layer.setIcon(starIcon);
        } else {
            layer.setZIndexOffset(i);
            layer.setIcon(iconType(layer.g_type, layer.g_status));
        };
    });
    
    
    // Plot data
    var param = d3.select("#selected-param").property("value");
    plotSite(g_id, param);
}


// Deep linking from in the iframe 
//  (see http://jonathonhill.net/2013-10-22/deep-linking-into-an-iframe-cross-domain/)
function bindEvent(el, eventName, eventHandler)
{
    if (el.addEventListener) {
        el.addEventListener(eventName, eventHandler);
    } else {
        el.attachEvent('on' + eventName, eventHandler);
    }
}

bindEvent(window, 'message', function(e) {
    if (e.origin === "http://www.thurstoncountywa.gov") {
        message = JSON.parse(e.data);
        var the_gid = message.location.hash.split("=")[1]
        selectSite(sitelist, the_gid);
        //alert(message.location.href);
    }
});