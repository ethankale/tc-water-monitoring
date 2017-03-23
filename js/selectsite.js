
// Load this file first, before map.js and plot.js

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

// The user selected a different site in the selectbox
function selectChange() {
    g_id = d3.select("#selected-station").property('value');
    selectSite(sitelist, g_id);
}

// The user clicked on a marker in the Leaflet map
function onMarkerClick(e) {
    selectSite(sitelist, e.target.g_id);
}

// What happens when a user selects a site from the map or the list
function selectSite(data, g_id) {
    var site = data.filter(function(d) { return(d.G_ID == g_id) })[0];
    d3.select("#selected-station").property('value', g_id);
    
    // Map manipulation
    sitemap.panTo([site.LAT, site.LON]);
    highlightMarker.setLatLng([site.LAT, site.LON]);
    highlightMarker.setIcon(highlightIcon);
    highlightMarker.addTo(sitemap);
    
    plotSite(dailyData, g_id);
}



