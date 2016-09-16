$(document).ready(
  function() {
    $('#plot-button').click(plotData);
    $('#plot-button').click();
  }
);

var layout = {
  xaxis: {title: 'Civil Time (hr)', range: [-7, 7]},
  yaxis: {title: 'Elevation (deg)', range: [0, 90]},
  margin: {
    t: 10,
    b: 50,
    l: 50,
    r: 50,
  },
  hovermode: 'closest'
};

function getIMCCE(name, type, date, done) {
  // http://vo.imcce.fr/webservices/miriade/ephemcc_query.php?-name=c:2P&-ep=2016-09-14&-from:maryland&-mime=html
  data = {};
  data['-name'] = type + ':' + name;
  data['-ep'] = date;
  data['-mime'] = 'text';
  data['-from'] = 'elevation-webapp';
  $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', data)
    .done(done);
}

function processIMCCE(data) {
  console.log(data);
  lines = data.split('\n');
  row = lines[lines.length - 3].split(/\s+/);
  ra = hr2rad(parseFloat(row[2])
	      + parseFloat(row[3]) / 60
	      + parseFloat(row[4]) / 3600);
  if (row[5][0] == '-') {
    sgn = -1;
  } else {
    sgn = 1;
  }
  dec = deg2rad(parseFloat(row[5])
		+ sgn * parseFloat(row[6]) / 60
		+ sgn * parseFloat(row[7]) / 3600);
  return {ra: ra, dec: dec};
}

function addSun(data) {
  // data is a result from the IMCCE's ephemcc service
  c = processIMCCE(data);
  sun = generateData('Sun', c.ra, c.dec);
  daylight = sun.alt.map(function(x){return x>0;});
  twilight = sun.alt.map(function(x){return x>-0.314;});  // -18 deg = -0.314
  sunset = ct[sun.alt.findIndex(function(e, i, a){return (ct[i]<0)&&(e<0);})];
  sunrise = ct[sun.alt.findIndex(function(e, i, a){return (ct[i]<0)&&(e>0);})];
  data = [
    { type: 'box', x: [-12, sunset], y: [-90, 90] },
    { type: 'box', x: [sunrise, 12], y: [-90, 90] }
  ];
  Plotly.addTraces('plot-window', data);
}

function generateData(name, ra, dec) {
  // ra, dec in radians
  var date = new Date(2016, 6, 14);
  var lat = deg2rad(32.0);  // rad
  var lon = 0.0;  // rad
  var lst0 = ct2lst(date, lon);  // rad

  var ct = [-Math.PI];
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
    if (comets[i].startsWith('#')) {
      continue;
    }
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
  getIMCCE('sun', 'p', $('#date').val(), addSun);
}
