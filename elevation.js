$(document).ready(
  function() {
    eph = new IMCCE();
    plot = new Plot();
    table = $('#elevation-target-table').DataTable({
      'searching': false,
      'paging': false,
    });
    $('#elevation-date').val(moment.tz().format().substr(0, 10));
    $('#elevation-add-target-button').click(addTargetCallback);
    $('#elevation-load-button').click(loadTargets);
    $('#elevation-reset-button').click(plot.clearTargets);
    $('.elevation-observatory').click(setLocation);
    $('#elevation-date').on('change', updateCallback);
    $('#elevation-update-location-button').click(updateCallback);
    $('.elevation-target-set-button').click(loadTargetSetButton);
    eph.get('sun', 'p', function(data){plot.updateSun(data);});
  }
);

var DEBUG = false;
var ctSteps = 360;
var ctStepSize = 2 * Math.PI / ctSteps;  // rad
var eph;
var plot;
var table;

/**********************************************************************/
function error(msg) {
  $('#elevation-error').prepend('<p>' + msg + '</p>');
}

/**********************************************************************/
function sum(a, b) {
  return a + b;
}

/**********************************************************************/
class Plot {
  constructor() {
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
  }
  
  updateSun(s) {
    if (s === undefined) {
      s = this.sun;
    } else {
      this.sun = s;
    }

    var altaz = generateAltAz(s);
    this.sun.ct = altaz.ct;
    this.sun.alt = altaz.alt;
    this.sun.az = altaz.az;

    var update = { shapes: [] };
    var alt = [-18, -6, 0];
    for (var i in alt) {
      var t = [[-12, altaz.ct[altaz.alt.findIndex(findSet(alt[i]))]],
	       [12, altaz.ct[altaz.alt.findIndex(findRise(alt[i]))]]];
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

    this.clearSun();
    Plotly.relayout('elevation-plot', update);
  }

  clearSun() {
    Plotly.relayout('elevation-plot', {shapes:[]});
  }

  target(t) {
    var data = {
      name: t.name,
      x: t.ct,
      y: t.alt,
      type: 'scatter',
      mode: 'lines',
      hoverinfo: 'name',
    };
    Plotly.addTraces('elevation-plot', data);
  }
  
  clearTargets() {
    var plotdiv = $('#elevation-plot')[0];
    var traces = [];
    for (var i=0; i<plotdiv.data.length; i++) {
      traces.push(i);
    }
    Plotly.deleteTraces('elevation-plot', traces);
    $('#elevation-target-table tbody').html('');
  }
}

/**********************************************************************/
function addTargetCallback(e) {
  var name = $('#elevation-add-target-name').val();
  var type = $('#elevation-add-target-type').val();
  eph.get(name, type, newTarget);
}

/**********************************************************************/
function updateCallback(e) {
  if ((e.target.id == 'elevation-date') || (plot.sun === undefined)) {
    eph.get('sun', 'p', function(data){ console.log('updatecallback.sun', data); plot.updateSun(data); });
  }
  
  if (e.target.id == 'elevation-date') {
    plot.clearTargets();
  } else if ((e.target.id == 'elevation-update-location-button')
	     || (e.target.classList.contains('elevation-observatory'))) {
    plot.updateSun();

    var targets = $('.elevation-target');
    if (targets.length > 0) {
      var coords = targets.map(function(i, x) {
	return $(x).data('target');
      });
      plot.clearTargets();
      for (var i=0; i<coords.length; i++) {
	newTarget(coords[i]);
      }
    }
  }
}

/**********************************************************************/
class IMCCE {
  get(name, type, done) {
    var date = getDate();
    if (isNaN(date)) {
      error(Date() + ': Invalid date.');
      return;
    }
    
    var params = {};
    params['-name'] = type + ':' + name;
    params['-ep'] = date.toISOString();
    //params['-mime'] = 'votable';
    params['-mime'] = 'text';
    params['-from'] = 'elevation-webapp';
    var self = this;
    $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', params)
      .done(function(data){self.processTXT(data, done);});
  }

  getDataByField(doc, fieldName) {
    var fields = doc.find('FIELD');
    var columns = doc.find('TD');
    var field = doc.find('FIELD[name="' + fieldName + '"]')[0];
    var i = doc.index(field);
    return columns[i].textContent;
  }

  processVotable(data, done) {
    var doc = $(data);

    var status = doc.find('INFO[name="QUERY_STATUS"]');
    if (status.attr('value') == 'ERROR') {
      error(status.text());
      return;
    }

    var target = {};
    target.name = doc.find('PARAM[ID="targetname"]').attr('value');
    
    var c = this.getDataByField(doc, 'RA')
	.split(/\s+/)
	.map(parseFloat);
    console.log(c);
    target.ra = hr2rad(c[0] + c[1] / 60 + c[2] / 3600);
    
    var c = this.getDataByField(doc, 'DEC');
    var sgn = -1 ? (c[0] == '-') : 1;
    c = c.substr(1).split(/\s+/).map(parseFloat);
    target.dec = deg2rad(c[0] + c[1] / 60 + c[2] / 3600);

    target.delta = parseFloat(this.getDataByField(doc, 'Distance'));
    target.mv = parseFloat(this.getDataByField(doc, 'Mv'));
    target.phase = parseFloat(this.getDataByField(doc, 'Phase'));
    target.elong = parseFloat(this.getDataByField(doc, 'Elongation'));
    var dra = parseFloat(this.getDataByField(doc, 'dRAcosDEC'));
    var ddec = parseFloat(this.getDataByField(doc, 'dDEC'));
    target.motion = 60 * Math.sqrt(Math.pow(dra, 2), Math.pow(ddec, 2));
    target.ddot = parseFloat(this.getDataByField(doc, 'dist_dot'));

    if (DEBUG) {
      console.log(data);
      console.log(eph);
      console.log(target);
    }
  
    done(target);
  }

  processTXT(data, done) {
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
    target.motion = Math.sqrt(Math.pow(parseFloat(eph[12]), 2)
			      + Math.pow(parseFloat(eph[13]), 2)) * 60;
    target.ddot = parseFloat(eph[14]);

    if (DEBUG) {
      console.log(data);
      console.log(eph);
      console.log(target);
    }
  
    done(target);
  }
}

/**********************************************************************/
function getDate() {
  return moment.tz($('#elevation-date').val(), $('#elevation-timezone').val());
}

/**********************************************************************/
function getLocation() {
  // rad
  var lat = deg2rad(parseFloat($('#elevation-latitude').val()));
  var lon = deg2rad(parseFloat($('#elevation-longitude').val()));
  return { lat: lat, lon: lon };
}

/**********************************************************************/
function getLST0(date, loc) {
  // rad
  return ct2lst(date, loc.lon);
}

/**********************************************************************/
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

/**********************************************************************/
function setLocation(e) {
  $('#elevation-latitude').val(parseFloat(e.target.dataset.latitude));
  $('#elevation-longitude').val(parseFloat(e.target.dataset.longitude));
  $('#elevation-timezone').val(e.target.dataset.timezone);
  updateCallback(e);
}

/**********************************************************************/
function loadTargets() {
  plot.clearTargets();
  var lines = $('#elevation-target-list').val().split('\n');

  var delay = 0;
  for (var i in lines) {
    if (lines[i].startsWith('#') || (lines[i].trim().length == 0)) {
      continue;
    }

    var row = lines[i].split(',');
    if ((row.length < 2) || (row.length == 3) || (row.length > 5)) {
      error("Bad row length: " + lines[i])
      continue;
    }

    if (row[1] == 'f') {
      newTarget({
	name: row[0],
	ra: hr2rad(parseFloat(row[2])),
	dec: deg2rad(parseFloat(row[3]))
      });
    } else {
      setTimeout(function(name, type, done) { eph.get(name, type, done); },
		 delay * 300, row[0], row[1], newTarget);
      delay++;
    }
  }
}

/**********************************************************************/
function newTarget(t) {
  var row = [];

  var altaz = generateAltAz(t);
  t.ct = altaz.ct;
  t.alt = altaz.alt;
  t.az = altaz.az;

  row.push('<input type="checkbox">');
  row.push(t.name);
  row.push(rad2hr(t.ra).toFixed(1));
  row.push(rad2deg(t.dec).toFixed(1));

  if ('mv' in t) {
    row.push(t.mv.toFixed(1));
    row.push(t.delta.toFixed(2));
    row.push(t.ddot.toFixed(1));
    row.push(t.phase.toFixed(0));
    row.push(t.elong.toFixed(0));
    row.push(t.motion.toFixed(0));
  } else {
    for (var i=0; i<6; i++) {
      row.push('');
    }
  }

  var test = t.alt.map(function(x) { return (x > 30); });
  var uptime = 24 / ctSteps * test.reduce(sum, 0);
  row.push(uptime.toFixed(1));

  var test = t.alt.map(function(x, i) {
    return (x > 30) * (plot.sun.alt[i] < -18);
  });
  var darktime = 24 / ctSteps * test.reduce(sum, 0);
  row.push(darktime.toFixed(1));

  table.row.add(row).draw();
  plot.target(t);
}
