


function createDischargeSummary(site, data, type="Stage") {
    
    if (type == "Stage") {
        param = "val";
        digits = 2;
    } else if (type == "Temperature") {
        param = "temp_c";
        digits = 0;
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
    var lastIndex = _.findIndex(data, {'day': lastRecord.day})
    var sliced_data = data.slice(lastIndex-5, lastIndex)
    var spark_data = _.map(sliced_data, function(d) { return {'x': d.dt, 'y':d[param]} } );
    
    document.getElementById('sparkline').innerHTML = "";
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
    document.querySelector("#tile1 .summary-info").innerHTML = Number(lastVal).toFixed(digits) ;
    document.querySelector("#tile1 .summary-details").innerHTML = "Latest on " + maxDate.format("Y-MM-DD");
    
    document.querySelector("#tile3 .summary-info").innerHTML = yearsMeasured;
    document.querySelector("#tile3 .summary-details").innerHTML = "Years Monitored";
    
    document.querySelector("#tile4 .summary-info").innerHTML = Number(minVal).toFixed(digits) + "  -  " + Number(maxVal).toFixed(digits);
    document.querySelector("#tile4 .summary-details").innerHTML = "Minimum to Maximum";

    
    
}
