


/*****************************
Globals
*****************************/

// For event listeners section
var tabs = ["summary-tab", "graph-tab"]

// For graphing section
var highlightColor = '#525252'
var backgroundColor = '#cccccc'

/*****************************
Bind event listeners
*****************************/

// Add a listener for parameter select change
document.getElementById("param-select").addEventListener('change', function() {
    //console.log(this.options[this.selectedIndex]);
    var gid = document.getElementById("gid").innerHTML
    var site = _.filter(sites, {"G_ID" : gid})[0];
    var param = this.options[this.selectedIndex].innerHTML;
    
    document.getElementById("daily-long-chart").innerHTML = "";
    document.getElementById("daily-wateryear-chart").innerHTML = "";
    
    //console.log(site);
    createDataDisplay(site, graph_data, mobile_overrides, param);
});

// Add listeners for the tabs
for (var i=0; i<tabs.length; i++) {
    document.getElementById(tabs[i]).addEventListener('click', function() {
        if (!this.parentElement.classList.contains('is-active')) {
            switchTab(this);
        }
    });
}

function switchTab(clicked_element) {
    document.getElementById("summary-container").classList.toggle('is-hidden');
    document.getElementById("chart-container").classList.toggle('is-hidden');
    for (var i=0; i<tabs.length; i++) {
        var t = document.getElementById(tabs[i]);
        t.parentElement.classList.toggle('is-active');
        // You have to update the graphs when you switch to then, because
        //   if they were originally drawn in a hidden container, their dimensions
        //   will be all wrong.
        if (tabs[i] == "graph-tab") {
            var charts = document.querySelectorAll('#chart-container .ct-chart')
        } else if (tabs[i] == "summary-tab") {
            var charts = document.querySelectorAll('#summary-container .ct-chart')
        };
        charts.forEach( function(e) { e.__chartist__.update(); });
    };
}

/*****************************
Generic functions
*****************************/

function createDataDisplay(site, graph_data, mobile_overrides, param) {
    // Clear the previous data
    var el_list = document.querySelectorAll("#summary_container p")
    
    for (var i=0; i<el_list.length; i++) {
        var el = el_list[i];
        el.innerHTML = "";
    }
    
    document.getElementById('sparkline').innerHTML = "";
    
    if (site.type == "Flow" || site.type == "Lake") {
        createDischargeDisplay(site, graph_data, mobile_overrides, param);
        createDischargeSummary(site, graph_data, param);
    } else if (site.type == "Well") {
        createGroundwaterDisplay(site, graph_data, mobile_overrides, param);
        createGroundwaterSummary(site, graph_data, param);
    } else if (site.type == "Rain") {
        createRainDisplay(site, graph_data, mobile_overrides, param);
        createRainSummary(site, graph_data, param);
    };
}

function getWYDateAxisTicks(dt) {
    // dt is a moment.js object.
    // Returns an array of 6 moment.js objects, the first of the month for each year.
    var mon = dt.month();
    var firstOfWY = moment();
    if (mon > 8) {
        firstOfWY = moment({year:dt.year(), month:9, day:1})
    } else {
        firstOfWY = moment({year:dt.year()-1, month:9, day:1})
    }
    var ticks = [];
    var i = 0;
    while (i < 12) {
        ticks.push(moment(firstOfWY).add(i, 'months'));
        i += 2;
    }
    return ticks;
}

function getLongDateAxisTicks(data) {
    var minDT = _.minBy(data, 'dt').dt
    var maxDT = _.maxBy(data, 'dt').dt
    return maxDT.diff(minDT, 'years');
}

/*****************************
Display Functions
*****************************/

function createDischargeDisplay(site, data, mobile_overrides, type="Stage") {
    
    //console.log(type)
    
    var column = "val"
    if (type == "Stage") {
        column = "val"
    } else if (type == "Temperature") {
        column = "temp_c"
    }
    
    var wy_series = _.reduce(data, function(result, value, key) {
        var i = _.findIndex(result, {"name": value.wy})
        // Every time we encounter a new water year, create a new array
        if (i == -1) {
            result.push({"name": value.wy, "data":[]});
            i = _.findIndex(result, {"name": value.wy});
        }
        result[i].data.push({x:value.graph_dt, y:value[column], e:value.estimate, p:value.provisional, w:value.warning});
        return result;
    }, []);
    
    var chart_long_data = _.map(data, function(d) { return {'x': d.dt, 'y':d[column], 'e':d.estimate, 'p':d.provisional, 'w':d.warning} });
    
    var wateryear_data = {
      series: wy_series
    };
    
    var long_data = {
      series: [
        {
          name: 'Discharge',
          data: chart_long_data
        }
      ]
    };
    var options_wateryear = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        ticks: getWYDateAxisTicks(moment()),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM');
        }
      }
    }
    var options_long = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 4,
        //divisor: getLongDateAxisTicks(data),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM YYYY ');
        }
      }
    }

    var chart_long = new Chartist.Line('#daily-long-chart', long_data, options_long, mobile_overrides);
    
    chart_long.on('draw', function(context) {
        if(context.type === 'point'){
            var d = chart_long_data[context.index];
            if(d.e != "False") { context.element.addClass("estimate");}
            if(d.p != "0") { context.element.addClass("provisional");}
            if(d.w != "False") { context.element.addClass("warning");}
        }
    });
    
    var chart_wy = new Chartist.Line('#daily-wateryear-chart', wateryear_data, options_wateryear, mobile_overrides);
    
    chart_wy.on('draw', function(context) {
        if(context.type === 'point') {
            var d = _.find(wy_series, {'name': context.series.name}).data[context.index]
            if(d.e != "False") { context.element.addClass("estimate");}
            if(d.p != "0") { context.element.addClass("provisional");}
            if(d.w != "False") { context.element.addClass("warning");}
        }
    });
    
    addMouseInteraction(chart_long, 'ct-point');
}


function createGroundwaterDisplay(site, data, mobile_overrides, type="Level") {
    
    // Parameter-specific vars; defaults are for param=="Level"
    var column = "val"
    var x_max = site.Elevation
    
    if (type == "Level") {
        column = "val"
        x_max = site.Elevation
    } else if (type == "Temperature") {
        column = "temp_c"
        x_max = String(_.maxBy(graph_data, "temp_c").temp_c)
    }
    
    // Reorganize the data into a format that Chartist can take
    var wy_series = _.reduce(data, function(result, value, key) {
          var i = _.findIndex(result, {"name": value.wy})
          // Every time we encounter a new water year, create a new array
          if (i == -1) {
              result.push({"name": value.wy, "data":[]});
              i = _.findIndex(result, {"name": value.wy});
          }
          result[i].data.push({x:value.graph_dt, y:value[column], e:value.estimate, p:value.provisional, w:value.warning});
          return result;
    }, []);
    
    var wateryear_data = {
      series: wy_series
    };
    var chart_long_data = _.map(data, function(d) { return {'x': d.dt, 'y':d[column], 'e':d.estimate, 'p':d.provisional, 'w':d.warning} } );
    var long_data = {
      series: [
        {
          name: 'Discharge',
          data: chart_long_data
        }
      ]
    };
    
    // Chartist display options
    var options_wateryear = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        ticks: getWYDateAxisTicks(moment()),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM');
        }
      },
      axisY: {
          type: Chartist.AutoScaleAxis,
          high: x_max
      }
    }
    var options_long = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 4,
        //divisor: getLongDateAxisTicks(data),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM YYYY ');
        }
      },
      axisY: {
          type: Chartist.AutoScaleAxis,
          high: x_max
      }
    }
    
    var chart_long = new Chartist.Line('#daily-long-chart', long_data, options_long, mobile_overrides);
    chart_long.on('draw', function(context) {
        if(context.type === 'point'){
            var d = chart_long_data[context.index];
            if(d.e != "False") { context.element.addClass("estimate");}
            if(d.p != "0") { context.element.addClass("provisional");}
            if(d.w != "False") { context.element.addClass("warning");}
        }
    });
    var chart_wy = new Chartist.Line('#daily-wateryear-chart', wateryear_data, options_wateryear, mobile_overrides);
    chart_wy.on('draw', function(context) {
        if(context.type === 'point') {
            var d = _.find(wy_series, {'name': context.series.name}).data[context.index]
            if(d.e != "False") { context.element.addClass("estimate");}
            if(d.p != "0") { context.element.addClass("provisional");}
            if(d.w != "False") { context.element.addClass("warning");}
        }
    });
    
    addMouseInteraction(chart_long, 'ct-point');
    
}

function createRainDisplay(site, data, mobile_overrides, type="Rainfall") {
    
    var column = "val"
    var wy_series = []
    if (type == "Rainfall") {
        column = "val"
        // Create a series of cumulative rainfall data to chart in Chartist
        wy_series = _.reduce(data, function(result, value, key) {
          var i = _.findIndex(result, {"name": value.wy})
          if (i == -1) {
              result.push({"name": value.wy, "data":[]});
              i = _.findIndex(result, {"name": value.wy});
          }
          var wyLen = result[i].data.length;
          var lastVal = wyLen > 0 ? result[i].data[wyLen-1].y : 0;
          result[i].data.push({x:value.graph_dt, y:(value.val+lastVal), e:value.estimate, p:value.provisional, w:value.warning});
          return result;
        }, []);
    } else if (type == "Temperature") {
        column = "temp_c"
        // Create a simple series of temperature data, like the other chart functions
        wy_series = _.reduce(data, function(result, value, key) {
          var i = _.findIndex(result, {"name": value.wy})
          if (i == -1) {
              result.push({"name": value.wy, "data":[]});
              i = _.findIndex(result, {"name": value.wy});
          }
          result[i].data.push({x:value.graph_dt, y:value[column], e:value.estimate, p:value.provisional, w:value.warning});
          return result;
        }, []);
    }
    
    var wateryear_data = {
      series: wy_series
    };
    test = wateryear_data
    
    var chart_long_data = _.map(data, function(d) { return {'x': d.dt, 'y':d[column], 'e':d.estimate, 'p':d.provisional, 'w':d.warning} } );
    
    //var chart_long_data_points = _.filter(chart_long_data, function(d) { return(d.e != 'False' | d.p != '0' | d.w != 'False') });
    
    var long_data = {
      series: [
        {
          name: 'Discharge',
          data: chart_long_data
        }
      ]
    };
    var options_wateryear = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        ticks: getWYDateAxisTicks(moment()),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM');
        }
      }, 
      showPoint: false,
    }
    var options_long = {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 4,
        //divisor: getLongDateAxisTicks(data),
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM YYYY ');
        }
      }
    }
    
    var chart_wy = new Chartist.Line('#daily-wateryear-chart', wateryear_data, options_wateryear, mobile_overrides);
    
    var chart_long = {};
    if (type == "Rainfall") {
        chart_long = new Chartist.Bar('#daily-long-chart', long_data, options_long, mobile_overrides);
        chart_long.on('draw', function(context) {
            if(context.type === 'bar'){
                var d = chart_long_data[context.index];
                if(d.e != "False") { context.element.addClass("estimate");}
                if(d.p != "0") { context.element.addClass("provisional");}
                if(d.w != "False") { context.element.addClass("warning");}
            }
        });
        addMouseInteraction(chart_long, 'ct-bar');
    } else if (type == "Temperature") {
        chart_long = new Chartist.Line('#daily-long-chart', long_data, options_long, mobile_overrides);
        addMouseInteraction(chart_long, 'ct-point');
    }
    
}

// When you mouseover a point (not a line) in the long data chart,
//   the point will light up, data will display above the graph, and
//   the point will get larger.  Same for bars.
//   Also, the water year in the graph below it will highlight.
function addMouseInteraction(chart_long, el_type) {
    // el_type should be either 'ct-point' or 'ct-bar'
    chart_long.on('created', function(context) {
        var el_point = document.getElementById('daily-long-chart').getElementsByClassName(el_type);
        var el_datadisplay = document.getElementById('mouseover-data');
        
        for(i=0; i<el_point.length; i++) {
            el_point[i].addEventListener('mouseover', function() {
                // Update the text
                var pointval = this.getAttribute('ct:value').split(',');
                var sel_dt = moment(Number(pointval[0]))
                el_datadisplay.innerHTML = Number.parseFloat(pointval[1]).toPrecision(3) + " on " + sel_dt.format('Y-MM-DD');
                
                this.classList.add('hover');
                
                // Select the water year in the other chart
                var sel_wy = getWaterYear(sel_dt)
                
                // Reorder the water year series so the selected water year is on top
                var el_wy_series_container = document.querySelectorAll('#daily-wateryear-chart svg g')[1]
                var el_wy_series_all = document.querySelectorAll('#daily-wateryear-chart svg [*|series-name]')
                var el_wy_series_sel = document.querySelector('#daily-wateryear-chart svg [*|series-name="' + sel_wy + '"]')
                
                // Select the correct water year
                for(j=0; j<el_wy_series_all.length; j++) {
                    el_wy_series_all[j].classList.remove('selected');
                }
                
                el_wy_series_sel.classList.toggle('selected');
                el_wy_series_container.appendChild(el_wy_series_sel);
                
                document.getElementById('wy-title').innerHTML = "Water Year " + sel_wy;
                
                // Highlight estimate, provisional, warning if warranted.
                if (this.classList.contains("provisional")) {
                    document.getElementById("legend-provisional").classList.remove("is-hidden");
                } else {
                    document.getElementById("legend-provisional").classList.add("is-hidden");
                };
                
                if(this.classList.contains("warning")) {
                    document.getElementById("legend-warning").classList.remove("is-hidden");
                } else {
                    document.getElementById("legend-warning").classList.add("is-hidden");
                };
                
                if(this.classList.contains("estimate")) {
                    document.getElementById("legend-estimate").classList.remove("is-hidden");
                } else {
                    document.getElementById("legend-estimate").classList.add("is-hidden");
                };
                
            });
            
            el_point[i].addEventListener('mouseout', function() {
                el_datadisplay.innerHTML = "&nbsp;";
                this.classList.remove('hover');
            });
        }
    });
}