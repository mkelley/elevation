$(document).ready(
  function() {
    initializePlot();
    $('#elevation-load-button').click(loadTargets);
    $('.elevation-observatory').click(setLocation);
  }
);

var DEBUG = true;
var ctSteps = 360;
var ctStepSize = 2 * Math.PI / ctSteps;  // rad

function initializePlot() {
  var layout = {
    xaxis: {
      title: 'Civil Time (hr)',
      range: [-7, 7],
      tickmode: "array",
      tickvals: [-12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12],
      ticktext: ['12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
		 '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
		 '12:00']
    },
    yaxis: {
      title: 'Elevation (deg)',
      range: [0, 90]
    },
    margin: {
      t: 10,
      b: 50,
      l: 50,
      r: 50,
    },
    hovermode: 'closest'
  };
  Plotly.newPlot('elevation-plot', [], layout);
  getIMCCE('sun', 'p', addSun);
}

function getIMCCE(name, type, done) {
  params = {};
  params['-name'] = type + ':' + name;
  params['-ep'] = getDate().toISOString();
  params['-mime'] = 'text';
  params['-from'] = 'elevation-webapp';
  $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', params)
    .done(function(data){done(processIMCCE(data));});
}

function processIMCCE(data) {
  if (DEBUG) {
    console.log(data);
  }
  lines = data.split('\n');
  name = lines[3].substr(2);
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
  return {name: name, ra: ra, dec: dec};
}

function addSun(c) {
  // data is a result from the IMCCE's ephemcc service
  var sun = generateAltAz(c.ra, c.dec);

  var update = { shapes: [] };
  var alt = [-18, -6, 0];
  for (var i in alt) {
    var t = [[-12, sun.ct[sun.alt.findIndex(findSet(alt[i]))]],
	     [12, sun.ct[sun.alt.findIndex(findRise(alt[i]))]]];
    for (var j in t) {
      var shape = {
	type: 'rect',
	xref: 'x',
	x0: t[j][0],
	x1: t[j][1],
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      };
      update.shapes.push(shape);
    }
  }

  Plotly.relayout('elevation-plot', update);
}

function getDate() {
  //var d = $('#elevation-date').val().split('-');
  return moment.tz($('#elevation-date').val(), $('#elevation-timezone').val());
}

function getLocation() {
  // rad
  var lat = deg2rad(parseFloat($('#elevation-latitude').val()));
  var lon = deg2rad(parseFloat($('#elevation-longitude').val()));
  return { lat: lat, lon: lon };
}

function getLST0(date, loc) {
  // rad
  return ct2lst(date, loc.lon);
}

function generateAltAz(ra, dec) {
  // ra, dec in radians
  var date = getDate();
  var loc = getLocation();
  var lst0 = getLST0(date, loc);  // rad

  var ct = [-Math.PI];
  for (var i=1; i<=ctSteps; i++) {
    ct.push(ct[i-1] + ctStepSize);  // rad
  };

  var ha = ct.map(function(x){return (x + lst0 - ra) % (2 * Math.PI)});
  var altaz = hadec2altaz(ha, dec, loc.lat);

  if (DEBUG) {
    console.log(date);
    console.log(loc);
    console.log(lst0);
  }
  
  return {
    ct: ct.map(rad2hr).map(branchcut(12, 24)),
    alt: altaz.alt.map(rad2deg),
    az: altaz.az.map(rad2deg),
  };
}

function deleteData() {
  var plot = document.getElementById('elevation-plot');
  var traces = [];
  for (var i in plot.data) {
    traces.push(i);
  }
  Plotly.deleteTraces('elevation-plot', traces);
}

function plotData() {
  deleteData();
  var data = [];

  var targets = $('#elevation-targets').val().split('\n');
  for (var i=0; i<targets.length; i++) {
    if (targets[i].startsWith('#')) {
      continue;
    }
    var row = targets[i].split(',');
    if (targets.length != 4) {
      continue;
    }

    altaz = generateAltAz(hr2rad(parseFloat(row[2])),
			  deg2rad(parseFloat(row[3])));
    
    data.push({
      name: row[0],
      x: altaz.ct,
      y: altaz.alt,
      type: 'scatter',
      mode: 'lines'
    });
  }

  Plotly.addTraces('elevation-plot', data);
}

function setLocation(e) {
  $('#elevation-latitude').val(parseFloat(e.target.dataset.latitude));
  $('#elevation-longitude').val(parseFloat(e.target.dataset.longitude));
  $('#elevation-timezone').val(e.target.dataset.timezone);
}

function loadTargets() {
  var targets = $('#elevation-targets').val().split('\n');
  $('#elevation-target-control').html('');
  
  for (var i in targets) {
    if (targets[i].startsWith('#')) {
      continue;
    }
    var row = targets[i].split(',');
    if (row.length == 2) {
      getIMCCE(row[0], row[1], newTarget);
    } else if (row.length == 4) {
      newTarget({
	name: parseFloat[0],
	ra: parseFloat(row[2]),
	dec: parseFloat(row[3])
      });
    }
  }
}

function newTarget(c) {
  var targetControl = $('#elevation-target-control');
  var input = $('<input type="checkbox" checked="checked">');
  input.data('c', c);
  input.change(toggleLine);
  targetControl.append(input);
  targetControl.append('<label>'
		       + c.name + '('
		       + Math.round(c.ra) + ', '
		       + Math.round(c.dec)
		       + ')</label><br>');
  plotTarget(c);
}

function plotTarget(c) {
  var altaz = generateAltAz(hr2rad(c.ra), deg2rad(c.dec));
  var data = {
    name: c.name,
    x: altaz.ct,
    y: altaz.alt,
    type: 'scatter',
    mode: 'lines'
  };
  Plotly.addTraces('elevation-plot', data);
}

function toggleLine(e) {
  var plot = $('#elevation-plot')[0];
  var c = $(e.target).data('c');
  var traces = plot.data.map(function(x){return x.name;});
  var i = traces.indexOf(c.name);
  console.log(i);
  if (i >= 0) {
    Plotly.deleteTraces('elevation-plot', traces.indexOf(c.name));
  } else {
    plotTarget(c);
  }
}
