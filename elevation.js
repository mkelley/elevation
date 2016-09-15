// http://vo.imcce.fr/webservices/miriade/ephemcc_query.php?-name=c:2P&-ep=2016-09-14&-from:maryland&-mime=html
$(document).ready(
  function() {
    $('#plot-button').click(plotData);
  }
);

var layout = {
  xaxis: {title: 'Civil Time (hr)'},
  yaxis: {title: 'Elevation (deg)'},
  margin: {t: 20},
  hovermode: 'closest'
};

function generateData(name, ra, dec) {
  // ra, dec in radians
  var date = new Date(2016, 6, 14);
  var lat = deg2rad(32.0);  // rad
  var lon = 0.0;  // rad
  var lst0 = ct2lst(date, lon);  // rad

  var ct = [0];
  for (var i=1; i<361; i++) {
    ct.push(ct[i-1] + 2 * Math.PI / 360);  // rad
  };
  
  var ha = ct.map(function(x){return (x + lst0 - ra) % (2 * Math.PI)});
  var altaz = hadec2altaz(ha, dec, lat);

  return {
    name: name,
    x: ct.map(rad2hr).map(branchcut(12, 24)),
    y: altaz.alt.map(rad2deg),
    type: 'scatter',
    mode: 'lines'
  };
}

function plotData() {
  var comets = $('#comets').val().split('\n');
  var data = [];
  
  for (var i=0; i<comets.length; i++) {
    var row = comets[i].split(',');
    console.log(row);
    if (row.length != 3) {
      continue;
    }
    
    data.push(generateData(row[0],
			   hr2rad(parseFloat(row[1])),
			   deg2rad(parseFloat(row[2]))));
  }

  Plotly.newPlot('plot-window', data, layout);
}
