
// Globally useful formats
var prettyDate = d3.timeFormat("%b %e, %Y");
var yearOnlyFormat = d3.timeFormat("%Y");

// Stats row.  Functions for generating HTML for each of the four cells.
// Cell 1: most recent value - temperature or level or total rainfall.
function getYTDRainHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var max_date = _.maxBy(data_year, "day").day;
    var total_rain = _.sumBy(data_year, "plotval")
    
    var markup = "<small>Inches In " + year + "</small><br />" + 
        total_rain.toFixed(2) + 
        "<br /><small>As Of " + prettyDate(max_date) + "</small>";
    
    return markup;
}

function getLatestTempHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var last_row = _.maxBy(data_year, "day");
    var last_dt = prettyDate(last_row.day);
    var last_temp = last_row.temp_c
    
    var markup = "<small>Last Temperature Recorded In " + year + "</small><br />" + 
        last_temp + 
        "<br /><small>On " + last_dt + "</small>";
    
    return markup;
}

function getLatestLevelHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var last_row = _.maxBy(data_year, "day");
    var last_dt = prettyDate(last_row.day);
    var last_level = last_row.plotval
    
    var markup = "<small>Last Water Level Recorded In " + year + "</small><br />" + 
        last_level + 
        "<br /><small>On " + last_dt + "</small>";
    
    return markup;
}

// Cell 2: Max annual level or temperature, or wettest day
function getWettestDayHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var max_row = _.maxBy(data_year, "val");
    var max_day = prettyDate(max_row.day);
    var max_rain = max_row.val.toFixed(2)
    
    var markup = "<small>Wettest Day in Year " + year + "</small><br />" +
        max_rain +
        "<br /><small>" + max_day + "</small>"
    
    return markup;
}

function getTempExtremeDayHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var max_row = _.maxBy(data_year, "temp_c");
    var min_row = _.minBy(data_year, "temp_c");
    
    var max_day = prettyDate(max_row.day);
    var max_temp = max_row.temp_c.toFixed(2)
    
    var min_day = prettyDate(min_row.day);
    var min_temp = min_row.temp_c.toFixed(2)
    
    var markup = "<small>Daily Temperature Extremes for " + year + "</small><br />" +
        max_temp + " / " + min_temp +
        "<br /><small>" + max_day + " / " + min_day + "</small>"
    
    return markup;
}

function getLevelExtremeDayHTML(data, year) {
    var data_year = _.filter(data, {"wy": parseInt(year, 10)});
    var max_row = _.maxBy(data_year, "val");
    var min_row = _.minBy(data_year, "val");
    
    var max_day = prettyDate(max_row.day);
    var max_level = max_row.val.toFixed(2)
    
    var min_day = prettyDate(min_row.day);
    var min_level = min_row.val.toFixed(2)
    
    var markup = "<small>Level Max - Min in Year " + year + "</small><br />" +
        max_level + " / " + min_level +
        "<br /><small>" + max_day + " / " + min_day + "</small>"
    
    return markup;
}

// Cell 3: Overall extremes
function getOverallExtremesHTML(data) {
    var max_row = _.maxBy(data, "plotval");
    var min_row = _.minBy(data, "plotval");
    
    var max_day = prettyDate(max_row.day);
    var max_level = max_row.val.toFixed(2)
    
    var min_day = prettyDate(min_row.day);
    var min_level = min_row.val.toFixed(2)
    
    var markup = "<small>Level Max / Min </small><br />" +
        max_level + " / " + min_level +
        "<br /><small>" + max_day + " / " + min_day + "</small>"
    
    return markup;
}

function getOverallExtremeTempsHTML(data) {
    var max_row = _.maxBy(data, "temp_c");
    var min_row = _.minBy(data, "temp_c");
    
    var max_day = prettyDate(max_row.day);
    var max_temp = max_row.temp_c.toFixed(2)
    
    var min_day = prettyDate(min_row.day);
    var min_temp = min_row.temp_c.toFixed(2)
    
    var markup = "<small>Temperature Max / Min </small><br />" +
        max_temp + " / " + min_temp +
        "<br /><small>" + max_day + " / " + min_day + "</small>"
    
    return markup;
}

function getExtremeRainYearsHTML(data) {
    var wateryear = _(data)
      .groupBy('wy')
      .map(function(year, id) { return {
        wy: id,
        rain: _.sumBy(year, 'val'),
        days: year.length}
      })
      .filter(function(y) { return y.days >= 365} )
      .value()
    
    var max_row = _.maxBy(wateryear, "rain");
    var min_row = _.minBy(wateryear, "rain");
    
    var max_rain = max_row.rain.toFixed(2);
    var min_rain = min_row.rain.toFixed(2);
    
    var markup = "<small>Total Rainfall Max / Min </small><br />" +
        max_rain + " / " + min_rain +
        "<br /><small>" + max_row.wy + " / " + min_row.wy + "</small>"
    
    return markup;
}


// Calculate and add statistics to the stats row, using
//   data from the currently selected site
function updateStatsRow(g_id, data, param) {
    
    var data = filterData(g_id, data, param)
    var wy = d3.select("#selected-wy").property("value");
    
    // Calculate statistics
    var site = sitelist.filter(function (d) { return (d.G_ID === data[0].G_ID); })[0];
    
    var currYearList = _.uniqBy(data, "wy");
    var yearCount = currYearList.length;
    
    // Cells 1, 2, and 3 have conditional markup; cell 4 is always just the 
    //   count of years.
    var cellone_markup = ""
    var celltwo_markup = ""
    var cellthree_markup = ""
    
    if (param == "temp") {
        cellone_markup = getLatestTempHTML(data, wy)
        celltwo_markup = getTempExtremeDayHTML(data, wy)
        cellthree_markup = getOverallExtremeTempsHTML(data)
    } else if (param == "level") {
        if (site.type === "Rain") {
            cellone_markup = getYTDRainHTML(data, wy)
            celltwo_markup = getWettestDayHTML(data, wy)
            cellthree_markup = getExtremeRainYearsHTML(data)
        } else  {
            cellone_markup = getLatestLevelHTML(data, wy)
            celltwo_markup = getLevelExtremeDayHTML(data, wy)
            cellthree_markup = getOverallExtremesHTML(data)
        }
    }
    
    // Using the calculated stats & context, update the text
    d3.select(".quick-stats.recent").html(cellone_markup);
    
    d3.select(".quick-stats.max-currentyear").html(celltwo_markup);
        
    d3.select(".quick-stats.max-overall").html(cellthree_markup);

    d3.select(".quick-stats.count").html("<small>Years Measured</small><br />" +
        yearCount);
}

// Remove data from the stats row, and display a "Loading" alert
function clearStatsRow() {
    d3.select(".quick-stats.recent").html("<small>--</small><br />Loading...<br /><small>--</small>");
    d3.select(".quick-stats.count").html("");
    d3.select(".quick-stats.max-currentyear").html("");
    d3.select(".quick-stats.max-overall").html("");
    
    //d3.selectAll(".quick-stats").classed("bg-info", true)
}