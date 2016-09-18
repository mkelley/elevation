$(document).ready(
  function() {
    initializePlot();
    $('#elevation-load-button').click(loadTargets);
    $('#elevation-reset-button').click(clearTargets);
    $('#elevation-update-button').click(updatePlot);
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
    hovermode: 'closest',
    showlegend: true,
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
  var lines = data.split('\n');
  var name = lines[3].substr(2);
  var row = lines[lines.length - 3].split(/\s+/);
  var ra = hr2rad(parseFloat(row[2])
		  + parseFloat(row[3]) / 60
		  + parseFloat(row[4]) / 3600);

  var sgn = -1 ? (row[5][0] == '-') : 1;
  var dec = deg2rad(parseFloat(row[5])
		    + sgn * parseFloat(row[6]) / 60
		    + sgn * parseFloat(row[7]) / 3600);
  if (DEBUG) {
    console.log(data);
    console.log(row);
    console.log('RA, Dec:', ra, dec);
  }
  return {name: name, ra: ra, dec: dec};
}

function addSun(coords) {
  var sun = generateAltAz(coords);

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

function generateAltAz(coords) {
  // ra, dec in radians
  var date = getDate();
  var loc = getLocation();
  var lst0 = getLST0(date, loc);  // rad

  var ct = [-Math.PI];
  for (var i=1; i<=ctSteps; i++) {
    ct.push(ct[i-1] + ctStepSize);  // rad
  };

  var ha = ct.map(function(x){
    return (x + lst0 - coords.ra) % (2 * Math.PI);
  });
  var altaz = hadec2altaz(ha, coords.dec, loc.lat);

  if (DEBUG) {
    console.log(ct);
    console.log(coords);
    console.log(date);
    console.log(loc);
    console.log(lst0);
    console.log(altaz);
  }
  
  return {
    ct: ct.map(rad2hr).map(branchcut(12, 24)),
    alt: altaz.alt.map(rad2deg),
    az: altaz.az.map(rad2deg),
  };
}

function plotData() {
  clearTargets();
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

    altaz = generateAltAz({
      ra: hr2rad(parseFloat(row[2])),
      dec: deg2rad(parseFloat(row[3]))
    });
    
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

function updatePlot() {

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

function newTarget(coords) {
  var targetControl = $('#elevation-target-control');
  var input = $('<input type="checkbox" checked="checked">');
  input.data('coords', coords);
  input.change(toggleLine);
  targetControl.append(input);
  targetControl.append('<label>'
		       + coords.name + '('
		       + Math.round(rad2hr(coords.ra)) + ', '
		       + Math.round(rad2deg(coords.dec))
		       + ')</label><br>');
  plotTarget(coords);
}

function plotTarget(coords) {
  console.log(coords);
  var altaz = generateAltAz(coords);
  var data = {
    name: coords.name,
    x: altaz.ct,
    y: altaz.alt,
    type: 'scatter',
    mode: 'lines',
    hoverinfo: 'name',
  };
  Plotly.addTraces('elevation-plot', data);
}

function clearTargets() {
  var plot = $('#elevation-plot')[0];
  var traces = [];
  for (var i in plot.data) {
    traces.push(i);
  }
  Plotly.deleteTraces('elevation-plot', traces);
  $('#elevation-target-control').html('');
}

function toggleLine(e) {
  var plot = $('#elevation-plot')[0];
  var coords = $(e.target).data('coords');
  var traces = plot.data.map(function(x){return x.name;});
  var i = traces.indexOf(coords.name);
  console.log(i);
  if (i >= 0) {
    Plotly.deleteTraces('elevation-plot', traces.indexOf(coords.name));
  } else {
    plotTarget(coords);
  }
}
