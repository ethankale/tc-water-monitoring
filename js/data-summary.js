


function createDischargeSummary(site, data, type="Stage") {

    // Calculated values to fill in tile display
    if (type == "Stage") {
        param = "val";
        digits = 2;
        units = "'"
    } else if (type == "Temperature") {
        param = "temp_c";
        digits = 0;
        units = "°F"
    }
    
    data = _.filter(data, function(d) { return d[param] != null })
    
    var lastRecord = _.maxBy(data, "dt");
    
    var minDate = data[0].dt;
    var maxDate = lastRecord.dt;
    var yearsMeasured = maxDate.diff(minDate, "years");
    
    var minValRecord = _.minBy(data, param)
    var maxValRecord = _.maxBy(data, param)
    
    var lastVal = lastRecord[param];
    
    var minVal = minValRecord[param];
    var maxVal = maxValRecord[param];
    
    
    // Make a sparkline style graph.
    var daysPast = 7;
    
    var lastIndex = _.findIndex(data, {'day': lastRecord.day})
    var sliced_data = data.slice(lastIndex-daysPast, lastIndex)
    var spark_data = _.map(sliced_data, function(d) { return {'x': d.dt, 'y':d[param]} } );
    
    var sparkchart = new Chartist.Line('#sparkline', 
      {
        series: [{
            name: type,
            data: spark_data
        }]
      }, {
        axisX: {
          type: Chartist.FixedScaleAxis,
          divisor: 2,
          labelInterpolationFnc: function(value) {
              return moment(value).format('MMM-D');
          }
        }, 
        axisY: {
          divisor: 2
        }
      }
    );
    
    // Update the document with the values we've derived/calculated.
    document.querySelector("#tile1 .summary-info").innerHTML = Number(lastVal).toFixed(digits) + units ;
    document.querySelector("#tile1 .summary-details").innerHTML = "Latest on " + maxDate.format("Y-MM-DD");
    
    document.querySelector("#tile2 .summary-details").innerHTML = "Last " + daysPast + " days of measurement";
    
    document.querySelector("#tile3 .summary-info").innerHTML = yearsMeasured;
    document.querySelector("#tile3 .summary-details").innerHTML = "Years Monitored";
    
    document.querySelector("#tile4 .summary-info").innerHTML = Number(minVal).toFixed(digits) + units + "  -  " + Number(maxVal).toFixed(digits) + units;
    document.querySelector("#tile4 .summary-details").innerHTML = "Minimum and Maximum All Time";
}


function createGroundwaterSummary(site, data, type="Level") {
    
    // Calculated values to fill in tile display
    if (type == "Level") {
        param = "val";
        digits = 2;
        units = "'"
    } else if (type == "Temperature") {
        param = "temp_c";
        digits = 0;
        units = "°F"
    }
    
    data = _.filter(data, function(d) { return d[param] != null })
    
    var lastRecord = _.maxBy(data, "dt");
    
    var minDate = data[0].dt;
    var maxDate = lastRecord.dt;
    var yearsMeasured = maxDate.diff(minDate, "years");
    
    var minValRecord = _.minBy(data, param)
    var maxValRecord = _.maxBy(data, param)
    
    var lastVal = lastRecord[param];
    
    var minVal = minValRecord[param];
    var maxVal = maxValRecord[param];
    
    
    // Make a sparkline style graph.
    var daysPast = 7;
    
    var lastIndex = _.findIndex(data, {'day': lastRecord.day})
    var sliced_data = data.slice(lastIndex-daysPast, lastIndex)
    var spark_data = _.map(sliced_data, function(d) { return {'x': d.dt, 'y':d[param]} } );
    
    var sparkchart = new Chartist.Line('#sparkline', 
      {
        series: [{
            name: type,
            data: spark_data
        }]
      }, {
        axisX: {
          type: Chartist.FixedScaleAxis,
          divisor: 2,
          labelInterpolationFnc: function(value) {
              return moment(value).format('MMM-D');
          }
        }, 
        axisY: {
          divisor: 2
        }
      }
    );
    
    // Update the document with the values we've derived/calculated.
    document.querySelector("#tile1 .summary-info").innerHTML = Number(lastVal).toFixed(digits) + units ;
    document.querySelector("#tile1 .summary-details").innerHTML = "Latest on " + maxDate.format("Y-MM-DD");
    
    document.querySelector("#tile2 .summary-details").innerHTML = "Last " + daysPast + " days of measurement";
    
    document.querySelector("#tile3 .summary-info").innerHTML = yearsMeasured;
    document.querySelector("#tile3 .summary-details").innerHTML = "Years Monitored";
    
    document.querySelector("#tile4 .summary-info").innerHTML = Number(minVal).toFixed(digits) + units + "  /  " + Number(maxVal).toFixed(digits) + units;
    document.querySelector("#tile4 .summary-details").innerHTML = "Minimum / Maximum All Time";
}


function createRainSummary(site, data, type="Rainfall") {
    
    
    // Calculated values to fill in tile display
    if (type == "Rainfall") {
        param = "val";
        digits = 2;
        units = '"';
    } else if (type == "Temperature") {
        param = "temp_c";
        digits = 0;
        units = "°F";
    }
    
    data = _.filter(data, function(d) { return d[param] != null })
    
    var lastRecord = _.maxBy(data, "dt");
    var lastIndex = _.findIndex(data, {'day': lastRecord.day})
    
    var minDate = data[0].dt;
    var maxDate = lastRecord.dt;
    var yearsMeasured = maxDate.diff(minDate, "years");
    
    var lastVal = lastRecord[param];
    
    var minValRecord = _.minBy(data, param)
    var maxValRecord = _.maxBy(data, param)
    
    var minVal = minValRecord[param];
    var maxVal = maxValRecord[param];
    
    var sevenDaySum = _.sumBy(data.slice(lastIndex-7, lastIndex), param);
    var thirtyDaySum = _.sumBy(data.slice(lastIndex-30, lastIndex), param);
    
    // Make a sparkline style graph.
    var daysPast = 7;
    

    var sliced_data = data.slice(lastIndex-daysPast, lastIndex)
    var spark_data = _.map(sliced_data, function(d) { return {'x': d.dt, 'y':d[param]} } );
    
    var graphSeries = {
        series: [{
            name: type,
            data: spark_data
        }]
      }
    
    var graphOptions = {
        axisX: {
          type: Chartist.FixedScaleAxis,
          divisor: 2,
          labelInterpolationFnc: function(value) {
              return moment(value).format('MMM-D');
          }
        }, 
        axisY: {
          divisor: 2
        }
    }
    
    var sparkchart = {};
    
    if (type == "Rainfall") {
        new Chartist.Bar('#sparkline', graphSeries, graphOptions);
        document.querySelector("#tile4 .summary-info").innerHTML = Number(sevenDaySum).toFixed(digits) + units + "  /  " + Number(thirtyDaySum).toFixed(digits) + units;
        document.querySelector("#tile4 .summary-details").innerHTML = "7 Days / 30 Days";
    } else if (type == "Temperature"){
        new Chartist.Line('#sparkline', graphSeries, graphOptions);
        document.querySelector("#tile4 .summary-info").innerHTML = Number(minVal).toFixed(digits) + units + "  /  " + Number(maxVal).toFixed(digits) + units;
        document.querySelector("#tile4 .summary-details").innerHTML = "Minimum / Maximum All Time";
    }
    
    // Update the document with the values we've derived/calculated.
    document.querySelector("#tile1 .summary-info").innerHTML = Number(lastVal).toFixed(digits) + units ;
    document.querySelector("#tile1 .summary-details").innerHTML = "Last daily total on " + maxDate.format("Y-MM-DD");
    
    document.querySelector("#tile2 .summary-details").innerHTML = "Last " + daysPast + " days of measurement";
    
    document.querySelector("#tile3 .summary-info").innerHTML = yearsMeasured;
    document.querySelector("#tile3 .summary-details").innerHTML = "Years Monitored";
    

}

