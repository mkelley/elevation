$(document).ready(
  function() {
    initializePlot();
    $('#elevation-load-button').click(loadTargets);
    $('#elevation-reset-button').click(clearTargets);
    $('.elevation-observatory').click(setLocation);
    $('#elevation-date').on('change', updatePlot);
    $('#elevation-update-location-button').click(updatePlot);
    $('#target-set-load').click(loadTargetSet);
  }
);

var DEBUG = false;
var ctSteps = 360;
var ctStepSize = 2 * Math.PI / ctSteps;  // rad
var sunCoords;

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
  //getIMCCE('sun', 'p', addSun);
}

var IMCCE = function() {
  this.get = function(name, type, done) {
    params = {};
    params['-name'] = type + ':' + name;
    params['-ep'] = getDate().toISOString();
    params['-mime'] = 'text';
    params['-from'] = 'elevation-webapp';
    var self = this;
    $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', params)
      .done(function(data){done(self.process(data));});
  };

  this.process = function(data) {
  /* Example IMCCE data:
# Flag: 1
# Ticket: 1474378574835
# Solar system object ephemeris by IMCCE
# Comet: P/Encke  (2P)
# Source: numerical integration
# Diameter (km): 0.00
# CEU (arcsec): 0.00000000E+00
# CEU rate (arcsec/d): 0.24566182E+07
# Planetary theory INPOP13C
# Astrometric J2000 coordinates
# Frame center: geocenter
# Relativistic perturbations, coordinate system 0
# Equatorial coordinates (RA, DEC)
#         Date UTC              R.A            Dec.          Distance     V.Mag   Phase   Elong.  muRAcosDE     muDE      Dist_dot
#             h  m  s       h  m  s         o  '  "            AU                   o        o      "/min      "/min       km/s
  2016-09-14T00:00:00.00    0 47  8.02777 +16  5  3.5421    1.629841562   17.60   10.46   152.44 -0.8100E+00 -0.1066E+00  -24.79021
*/
    var lines = data.split('\n');

    var target = {};
    target.name = lines[3].substr(2);

    var m = target.name.match(/Asteroid: (.+)/);
    if (m !== null) {
      target.name = m[1];
    }

    var m = target.name.match(/Comet:.*\((.+)\)/);
    if (m !== null) {
      target.name = m[1];
    }
  
    var eph = lines[lines.length - 3].split(/\s+/);
    target.ra = hr2rad(parseFloat(eph[2])
		       + parseFloat(eph[3]) / 60
		       + parseFloat(eph[4]) / 3600);

    var sgn = -1 ? (eph[5][0] == '-') : 1;
    target.dec = deg2rad(parseFloat(eph[5])
			 + sgn * parseFloat(eph[6]) / 60
			 + sgn * parseFloat(eph[7]) / 3600);

    target.delta = parseFloat(eph[8]);
    target.mv = parseFloat(eph[9]);
    target.phase = parseFloat(eph[10]);
    target.elong = parseFloat(eph[11]);
    target.motion = Math.sqrt(parseFloat(eph[12])**2 + parseFloat(eph[13])**2) * 60;
    target.ddot = parseFloat(eph[14]);

    if (DEBUG) {
      console.log(data);
      console.log(eph);
      console.log(target);
    }
  
    return target;
  };
};

function HORIZONS() {
  this.running = false;  // keep track of when we are running the queue
  this.queue = [];

  this.get = function(name, type, done) {
    // add object to the queue
    this.queue.push({name: name, done: done});
    this.run();
  };

  this.run = function() {
    if (this.running) {
      // queue is already running, let it go.
      return;
    }

    if (this.queue.length == 0) {
      // queue is empty, we're done.
      return;
    }

    // run the queue
    this.running = true;
    next = this.queue.pop();

    start = "'" + getDate().toISOString().substr(0, 10) + "'";
    stop = "'" + getDate().add(1, 'day').toISOString().substr(0, 10) + "'";
    
    params = {};
    params['BATCH'] = 1;
    params['COMMAND'] = "'" + next.name + "'";
    params['MAKE_EPHEM'] = "'YES'";
    params['TABLE_TYPE'] = "'OBSERVER'";
    params['START_TIME'] = start;
    params['STOP_TIME'] = stop;
    params['STEP_SIZE'] = "'1'";
    params['QUANTITIES'] = "'1,3,9,19,20,23,24,27,33'";
    params['CSV_FORMAT'] = "'YES'";
    console.log(params);

    var self = this;
    $.get('http://ssd.jpl.nasa.gov/horizons_batch.cgi', params)
      .done(function(data){next.done(self.process(data));});
  };
  
  this.process = function(data) {
    console.log(data);
    this.running = false;
    this.run();
  };
};

function addSun(coords) {
  sunCoords = coords;
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

function clearSun() {
  Plotly.relayout('elevation-plot', {shapes:[]});
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

function updatePlot(e) {
  console.log(e);
  if (e.target.id == 'elevation-date') {
    clearSun();
    //getIMCCE('sun', 'p', addSun);
    clearTargets();
  } else if ((e.target.id == 'elevation-update-location-button')
	     || (e.target.classList.contains('elevation-observatory'))) {
    clearSun();
    addSun(sunCoords);

    var targets = $('.elevation-target');
    if (targets.length > 0) {
      var coords = targets.map(function(i, x) {
	return $(x).data('target');
      });
      clearTargets();
      for (var i=0; i<coords.length; i++) {
	newTarget(coords[i]);
      }
    }
  }
}

function setLocation(e) {
  $('#elevation-latitude').val(parseFloat(e.target.dataset.latitude));
  $('#elevation-longitude').val(parseFloat(e.target.dataset.longitude));
  $('#elevation-timezone').val(e.target.dataset.timezone);
  updatePlot(e);
}

function loadTargets() {
  clearTargets();
  var lines = $('#elevation-target-list').val().split('\n');

  for (var i in lines) {
    if (lines[i].startsWith('#')) {
      continue;
    }
    var row = lines[i].split(',');
    if (row.length == 2) {
      //getIMCCE(row[0], row[1], newTarget);
    } else if (row.length == 4) {
      newTarget({
	name: row[0],
	  ra: hr2rad(parseFloat(row[2])),
	  dec: deg2rad(parseFloat(row[3]))
      });
    }
  }
}

function newTarget(target) {
  var tbody = $('#elevation-target-table tbody');
  var row = $('<tr>');

  row.append($('<td>').append(target.name));
  row.append($('<td>').append(rad2hr(target.ra).toFixed(1)));
  row.append($('<td>').append(rad2deg(target.dec).toFixed(1)));

  if ('mv' in target) {
    row.append($('<td>').append(target.mv.toFixed(1)));
    row.append($('<td>').append(target.delta.toFixed(2)));
    row.append($('<td>').append(target.ddot.toFixed(1)));
    row.append($('<td>').append(target.phase.toFixed(0)));
    row.append($('<td>').append(target.elong.toFixed(0)));
    row.append($('<td>').append(target.motion.toFixed(0)));
  } else {
    for (var i=0; i<6; i++) {
      row.append($('<td>'));
    }
  }

  tbody.append(row);
  plotTarget(target);
}

function plotTarget(target) {
  console.log(target);
  var altaz = generateAltAz(target);
  var data = {
    name: target.name,
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
  for (var i=0; i<plot.data.length; i++) {
    traces.push(i);
  }
  Plotly.deleteTraces('elevation-plot', traces);
  $('#elevation-target-table tbody').html('');
}
