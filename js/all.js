function selectChange(){g_id=d3.select("#selected-station").property("value"),selectSite(sitelist,g_id)}function onMarkerClick(t){selectSite(sitelist,t.target.g_id)}function selectSite(t,e,l){void 0===l&&(url=window.location.href,url.split("?").length>1&&(url=url.split("?")[0]),window.history.pushState({site:e},"TC Water Monitoring","/?site="+e));var a=t.filter(function(t){return t.G_ID===e})[0];d3.select("#selected-station").property("value",e),d3.select("#downloadCSV").property("href","/data/g_id-"+e+".csv"),sitemap.panTo([a.LAT,a.LON]),highlightMarker.setLatLng([a.LAT,a.LON]),highlightMarker.setIcon(highlightIcon),highlightMarker.addTo(sitemap),plotSite(e)}function updateStatsRow(t){var e,l,a=d3.timeFormat("%b %e, %Y"),s=d3.timeFormat("%Y"),i=sitelist.filter(function(e){return e.G_ID===t[0].G_ID})[0],r=_.maxBy(t,"val"),o=_.maxBy(t,"day"),c=_.uniqBy(t,"wy"),n=c.length,d=_.maxBy(c,"wy").wy,m=calcWaterYear(new Date),h=_.filter(t,{wy:m});if(d===m){var u={};if("Rain"===i.type)u=_.maxBy(h,"oldval"),e=u.oldval.toFixed(2);else{var u=_.maxBy(h,"val");e=u.val.toFixed(2)}l=a(u.day)}else e="No Data",l="--";var g="Most Recent",y="",p="Max This Year",v="Highest Recorded",f=a(r.day);"Rain"==i.type&&(g="Inches This Year",y="As Of ",p="Wettest Day This Year",v="Wettest Year",f=s(r.day)),d3.select(".quick-stats.recent").html("<small>"+g+"</small><br />"+o.val.toFixed(2)+" <br /><small>"+y+a(o.day)+"</small>"),d3.select(".quick-stats.count").html("<small>Years Measured</small><br />"+n),d3.select(".quick-stats.max-currentyear").html("<small>"+p+"</small><br />"+e+"<br /><small>"+l+"</small>"),d3.select(".quick-stats.max-overall").html("<small>"+v+"</small><br />"+r.val.toFixed(2)+"<br /><small>"+f+"</small>")}function clearStatsRow(){d3.select(".quick-stats.recent").html("<small>--</small><br />Loading...<br /><small>--</small>"),d3.select(".quick-stats.count").html(""),d3.select(".quick-stats.max-currentyear").html(""),d3.select(".quick-stats.max-overall").html("")}var sitelist={},dailyData=[];window.onpopstate=function(t){if(t.state){console.log(t.state);var e=window.location.href;e.split("?").length>1&&(g_id=e.split("?")[1].split("=")[1].replace(/\D/g,""),selectSite(sitelist,g_id,"popstate"))}};
function iconType(e){var n={};return"Rain"==e&&(n=greenIcon),"Well"==e&&(n=purpleIcon),"Flow"==e&&(n=orangeIcon),n}function loadSites(){d3.csv("./data/station_list.csv",function(e){return e.id=+e.G_ID,e.LAT=+e.LAT,e.LON=+e.LON,e},function(e,n){n=n.filter(function(e){return"Active"==e.STATUS});d3.select("#selected-station").on("change",selectChange).selectAll("option").data(n).enter().append("option").attr("value",function(e){return e.G_ID}).text(function(e){return e.SITE_CODE+": "+e.SITE_NAME+" ("+e.type+")"});sitelist=n,updateMapSites(n)})}function updateMapSites(e){e.forEach(function(e){if(!(isNaN(e.LAT)||isNaN(e.LON))&"Active"==e.STATUS){var n=L.marker([e.LAT,e.LON],{icon:iconType(e.type)});n.g_id=e.G_ID,n.on("click",onMarkerClick),n.addTo(sitemap)}});var n=window.location.href.split("?")[1],i=void 0===n?sitelist[0].G_ID:n.split("=")[1].replace(/\D/g,"");selectSite(sitelist,i)}var displayDateFormat=d3.timeFormat("%Y-%m-%d"),sitemap=L.map("mapid").setView([47.04,-122.9],10),layer=new L.StamenTileLayer("toner");sitemap.addLayer(layer);var SiteIcon=L.Icon.extend({options:{iconSize:[15,15],shadowSize:[15,15],iconAnchor:[7.5,7.5],shadowAnchor:[5,5],popupAnchor:[15,15]}}),greenIcon=new SiteIcon({iconUrl:"./img/marker/green_circle.png",shadowURL:"./img/marker/shadow_circle.png"}),purpleIcon=new SiteIcon({iconUrl:"./img/marker/purple_triangle.png",shadowURL:"./img/marker/shadow_triangle.png"}),orangeIcon=new SiteIcon({iconUrl:"./img/marker/orange_square.png",shadowURL:"./img/marker/shadow_square.png"}),highlightIcon=L.icon({iconUrl:"./img/marker/highlight_circle.png",iconSize:[10,10],shadowSize:[10,10],iconAnchor:[5,5],shadowAnchor:[10,10],popupAnchor:[10,10]}),highlightMarker=L.marker({icon:highlightIcon}),legend=L.control({position:"bottomright"});legend.onAdd=function(e){for(var n=L.DomUtil.create("div","info legend"),i=["green_circle.png","purple_triangle.png","orange_square.png"],r=["Rain","Well","Flow"],o=0;o<i.length;o++)n.innerHTML+='<img src="./img/marker/'+i[o]+'"></img>  '+r[o]+"<br />";return n},legend.addTo(sitemap);
function qalevel(e){var t="";return 1==e.w?t="Warning":1==e.e?t="Estimate":1==e.p&&(t="Provisional"),t}function SelectYearChange(){wy=d3.select("#selected-wy").property("value"),highlightYear(wy)}function highlightYear(e){d3.selectAll("svg path.valueLine").classed("highlight",!1),d3.selectAll("svg circle.valueCircle").classed("highlight",!1),"Clear"!=e&&(d3.select("svg path.wy"+e).classed("highlight",!0),d3.selectAll("svg circle.wy"+e).classed("highlight",!0),d3.select("#selected-wy").property("value",e))}function hoverYear(e){d3.select(".x-axis .hoverText").text(e),d3.select("svg path.wy"+e).classed("hover",!0),d3.selectAll("svg circle.wy"+e).classed("hover",!0)}function unHoverYear(e){d3.select(".x-axis .hoverText").text(""),d3.select("svg path.wy"+e).classed("hover",!1),d3.selectAll("svg circle.wy"+e).classed("hover",!1)}function calcWaterYear(e){var t=e.getFullYear(),a=e.getMonth(),r=t;return a>=9&&(r=t+1),r}function plotSite(e){d3.selectAll("g.x-axis").remove(),d3.selectAll("g.y-axis").remove(),svg.selectAll("path.valueLine").remove(),svg.selectAll("circle.valueCircle").remove(),clearStatsRow();var t=_.filter(dailyData,{G_ID:e});if(t.length>0)updatePlot(e),updateStatsRow(t);else{var a="./data/g_id-"+e+".csv";d3.csv(a,function(e){return e.val=e.val.length>0?+e.val:"-",e.day=parseDate(e.day),e.wy=calcWaterYear(e.day),e.p=0==e.provisional||"False"==e.provisional?0:1,e.w=0==e.warning||"False"==e.warning?0:1,e.e=0==e.estimate||"False"==e.estimate?0:1,e.qa=qalevel(e),e},function(t,a){dailyData=dailyData.concat(a),updatePlot(e),updateStatsRow(a)})}}function updatePlot(e){var t=_.filter(dailyData,{G_ID:e}),a=_.groupBy(t,"wy");years=_.keys(a);var r=_.clone(years),l=[];r.push("Clear");var n=d3.select("#selected-wy").on("change",SelectYearChange).selectAll("option").data(r,function(e){return e});n.enter().append("option").attr("value",function(e){return e}).text(function(e){return e}),n.exit().remove(),d3.select("#selected-wy").property("value","Clear");var i=sitelist.filter(function(t){return t.G_ID==e})[0],s=i.type;years.forEach(function(e,t){l.push({year:e,points:_.sortBy(a[e],["day"])})}),"Rain"==s&!("Y"==i.cumCalculated)&&(l.forEach(function(e){var t=0;e.points.forEach(function(e){e.oldval=e.val,e.val=t+e.oldval,t=e.val})}),i.cumCalculated="Y"),years.forEach(function(e){x_scales["scale"+e]=d3.scaleTime().domain([new Date(e-1,10,1),new Date(e,9,30)]).rangeRound([margin.left,width])}),y.rangeRound([height,0]),y.domain(d3.extent(t,function(e){return e.val})),g.append("g").attr("class","x-axis").attr("transform","translate(0,"+height+")").call(d3.axisBottom(x_scales["scale"+_.max(years)]).tickFormat(d3.timeFormat("%b"))).select(".domain").remove(),g.append("g").call(d3.axisLeft(y)).attr("class","y-axis").append("text").attr("fill","#000").attr("transform","rotate(-90)").attr("y",6).attr("dy","0.8em").attr("text-anchor","end").text("Rain"==s?"Rainfall (inches)":"Water Level (feet)");var o=_.filter(t,function(e){return e.p+e.e+e.w>0});g.selectAll(".valueCircle").data(o).enter().append("circle").attr("class",function(e,t){return"valueCircle wy"+e.wy}).attr("cx",function(e){return x_scales["scale"+e.wy](e.day)}).attr("cy",function(e){return y(e.val)}).attr("r",3).attr("stroke",function(e){return circleColor(e.qa)}).attr("fill",function(e){return circleColor(e.qa)}).on("mouseover",function(e){hoverYear(e.wy)}).on("mouseout",function(e){unHoverYear(e.wy)}).on("click",function(e){highlightYear(e.wy)}).exit().remove(),g.selectAll(".valueLine").data(l).enter().append("path").attr("class",function(e,t){return"valueLine wy"+e.year}).classed("currentwy",function(e){return(new Date).getFullYear()==+e.year}).attr("d",function(e){return thisYear="scale"+e.year,line(e.points)}).attr("stroke-linejoin","round").attr("stroke-linecap","round").attr("stroke-width",1.5).attr("fill","none").on("mouseover",function(e){hoverYear(e.year)}).on("mouseout",function(e){unHoverYear(e.year)}).on("click",function(e){highlightYear(e.year)}),d3.select("g.x-axis").append("text").attr("class","hoverText").attr("fill","#000").attr("y",-20).attr("x",width-20).attr("dy","0.8em").attr("text-anchor","end")}function setSVGSize(){svg.attr("width",document.getElementById("mapid").offsetWidth).attr("height",document.getElementById("mapid").offsetHeight),width=+svg.attr("width")-margin.left-margin.right,height=+svg.attr("height")-margin.top-margin.bottom}function resize(){setSVGSize(),legend.shapePadding((width+margin.left+margin.right)/4),svg.select(".legendOrdinal").call(legend),g_id=d3.select("#selected-station").property("value"),plotSite(g_id)}var parseDate=d3.timeParse("%Y-%m-%d %H:%M:%S"),svg=d3.select("svg").attr("width",document.getElementById("mapid").offsetWidth).attr("height",document.getElementById("mapid").offsetHeight),margin={top:20,right:10,bottom:50,left:50},width=+svg.attr("width")-margin.left-margin.right,height=+svg.attr("height")-margin.top-margin.bottom,bisectDate=d3.bisector(function(e){return e.date}).left,g=svg.append("g").attr("transform","translate("+margin.left+","+margin.top+")"),x_scales={},y=d3.scaleLinear(),thisYear,years=[];bgcolor="#d9d9d9",maincolor="#525252";var circleColor=d3.scaleOrdinal().domain(["Normal","Warning","Estimate","Provisional"]).range(["#cccccc","#8e0152","#de77ae","#4d9221"]);svg.append("g").attr("class","legendOrdinal").attr("transform","translate("+margin.left+", "+(height+margin.bottom-5)+")");var legend=d3.legendColor().shape("circle").orient("horizontal").shapeRadius(3).shapePadding((width+margin.left+margin.right)/4).scale(circleColor);svg.select(".legendOrdinal").call(legend);var line=d3.line().x(function(e){return x_scales[thisYear](e.day)}).y(function(e){return y(e.val)});d3.select(window).on("resize",resize),loadSites();
//# sourceMappingURL=all.js.map
