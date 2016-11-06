/**********************************************************************/
function error(msg) { $('#elevation-console').prepend('<p>' + msg + '</p>'); }

/**********************************************************************/
var Util = {
  sum: function(a, b) { return a + b; },
  sexagesimalToFloat: function(s) {
    var _s = s.trim().match(/^([-+]?)(.+)/);
    var sign = (_s[1] == '-')?-1:1;
    _s = _s[2];  // now just the magnitude

    if (_s.includes('d')) {
      _s = _s.replace('d', ' ').replace('m', ' ').replace('s', ' ');
    } else if (_s.includes('h')) {
      _s = _s.replace('h', ' ').replace('m', ' ').replace('s', ' ');
    }

    if (_s.includes(':')) {
      _s = _s.replace(/:/g, ' ');
    }

    var dms = _s.trim().split(/\s+/).map(parseFloat);
    var angle = 0;
    var scales = [1, 60, 3600];
    for (var i in dms) {
      if (i > 2) {
	break;
      }
      angle += dms[i] / scales[i];
    }
    
    return sign * angle;
  },
  
  deg2rad: function(x) { return (x * Math.PI / 180); },
  rad2deg: function(x) { return (x * 180 / Math.PI); },

  hr2rad: function(x) { return (x * Math.PI / 12); },
  rad2hr: function(x) { return (x * 12 / Math.PI); },
  
  hr2deg: function(x) { return (x * 15); },
  deg2hr: function(x) { return (x / 15); },
  
  branchcut: function(x, cut, period) {
    y = x % period;
    y = (y < 0)?(y + period):(y);
    return (y < cut)?(y):(y - period);
  },

  sexagesimal: function(x, seconds_precision, degrees_width) {
    /* 
       seconds_precision : integer
         decimals after the point, default 3.
       
       degrees_width : integer
         Zero pad the degrees place to this width.  The default is
         no padding.
    */
    if (seconds_precision === undefined) {
      seconds_precision = 3;
    }

    var sign = (x < 0)?'-':'+';
    var d = Math.floor(Math.abs(x));
    var m = Math.floor((Math.abs(x) - d) * 60);
    var s = ((Math.abs(x) - d) * 60 - m) * 60;

    factor = Math.pow(10, seconds_precision);
    s = Math.round(s * factor) / factor;
    if (s >= 60) {
      s -= 60;
      m += 1;
    }
    
    if (m >= 60) {
      m -= 60;
      d += 1;
    }
    
    d = d.toFixed(0);
    m = m.toFixed(0);
    s = s.toFixed(seconds_precision);
    
    if (degrees_width === undefined) {
      d = sign + d;
    } else {
      d = sign + '0'.repeat(degrees_width - d.length) + d;
    }
    
    m = '0'.repeat(2 - m.length) + m;

    if (seconds_precision == 0) {
      s = '0'.repeat(2 - s.length) + s;
    } else {
      s = '0'.repeat(2 - s.length + seconds_precision + 1) + s;
    }

    return d + ':' + m + ':' + s;
  }
}

/**********************************************************************/
class Angle {
  constructor(a, unit) {
    /* 
       a : Number
         angle magnitude, may be a number or a string with the
         following formats:
            1.2
            01 23 45
            1 23 45.6
            1 2 3
            1 2
            12:34:56
            12d34m56s
            12d 34m 56s
            12h 34m 56s
       unit : string
         'deg', 'rad', or 'hr', default is 'rad'.
    */

    var a;
    if (typeof a === 'string') {
      a = Util.sexagesimalToFloat(a);
    } else {
      a = a;
    }

    switch(unit) {
    case 'deg':
      a = Util.deg2rad(a);
      break;
    case 'hr':
      a = Util.hr2rad(a);
      break;
    default:
    }
    this._a = a;
  }
  

  get deg () { return Util.rad2deg(this.rad); }
  get hr () { return Util.rad2hr(this.rad); }
  get rad () { return this._a; }
  
  dms(seconds_precision, degrees_width) {
    return Util.sexagesimal(this.deg, seconds_precision, degrees_width);
  }

  hms(seconds_precision, hours_width) {
    return Util.sexagesimal(this.hr, seconds_precision, hours_width);
  }

  branchcut(cut, period) {
    return new Angle(Util.branchcut(this.rad, cut.rad, period.rad));
  }

  add(a) { return new Angle(this.rad + a.rad); }
  mod(a) { return new Angle(this.rad % a.rad); }
}

/**********************************************************************/
class AngleArray {
  constructor(a, unit) {
    /* 
       a : Array 
         angle magnitudes, each item may be a number or a string with
         the following formats:
            1.2
            01 23 45
            1 23 45.6
            1 2 3
            1 2
            12:34:56
            12d34m56s
            12d 34m 56s
            12h 34m 56s
       unit : string
         'deg', 'rad', or 'hr', default is 'rad'.
    */

    var conv = function(a) {
      var b;
      if (typeof a === 'string') {
	b = Util.sexagesimalToFloat(a);
      } else {
	b = a;
      }

      switch(unit) {
      case 'deg':
	b = Util.deg2rad(b);
	break;
      case 'hr':
	b = Util.hr2rad(b);
	break;
      default:
      }

      return b;
    };

    this.data = a.map(conv);
  }
  
  get deg () { return this.data.map(Util.rad2deg); }
  get hr () { return this.data.map(Util.rad2hr); }
  get rad () { return this.data; }
  
  dms(seconds_precision, degrees_width) {
    return this.deg.map(function(a) {
      return Util.sexagesimal(a, seconds_precision, degrees_width);
    });
  }

  hms(seconds_precision, hours_width) {
    return this.hr.map(function(a) {
      return Util.sexagesimal(a, seconds_precision, hours_width);
    });
  }

  branchcut(cut, period) {
    return new AngleArray(this.rad.map(function(a){
      return Util.branchcut(a, cut.rad, period.rad);
    });
  }

  rise(thresh) {
    /* Return the index of angle where it rises past thresh (default
       radians). */
    return this.rad.findIndex(function(a, i, alt) {
      return ((alt[i-1] < thresh.rad) && (alt[i] >= thresh.rad));
    });
  }

  transit() {
    /* Return the index of transit. */
    return this.rad.indexOf(Math.max.apply(null, this.rad));
  }

  set(thresh) {
    /* Return the index of alt where it sets past thresh (default
       radians). */
    return this.findIndex(function(a, i, alt) {
      return ((alt[i-1] > thresh.rad) && (alt[i] <= thresh.rad));
    });
  }

  greater(thresh) {
    /* Return true for each element greater than the threshold
       (default radians). */
    return this.rad.map(function(a) { return (a > thresh.rad); });
  }

  less(thresh) {
    /* Return true for each element less than the threshold
       (default radians). */
    return this.rad.map(function(a) { return (a < thresh.rad); });
  }
}

/**********************************************************************/
class Target {
  /* name, ra (Angle), dec (Angle) */
  constructor(name, ra, dec) {
    this.name = name;
    this.ra = ra;
    this.dec = dec;
    this.update();
  }

  update() {
    /* Create ct, ha, alt, and az arrays.

      Based, in part, on the IDL Astron hadec2altaz procedure by
      Chris O'Dell (UW-Maddison).
    */
    var ct = [-Math.PI];
    for (var i=1; i<=Config.ctSteps; i++) {
      ct.push(ct[i-1] + Config.ctStepSize.rad);
    };
    this.ct = new AngleArray(ct)
      .branchcut(new Angle(12, 'hr'), new Angle(24, 'hr'));

    this.ha = new AngleArray(
      this.ct.rad.map(function(x){
	return (x + location.lst0.rad - this.ra.rad) % (2 * Math.PI);
      });
    );

    var sha = this.ha.rad.map(Math.sin);
    var cha = this.ha.rad.map(Math.cos);
    var sdec = Math.sin(this.dec.rad);
    var cdec = Math.cos(this.dec.rad);
    var slat = Math.sin(this.lat.rad);
    var clat = Math.cos(this.lat.rad);

    var x = cha.map(function(x){return -x * cdec * slat + sdec * clat;});
    var y = sha.map(function(x){return -x * cdec;});
    var z = cha.map(function(x){return x * cdec * clat + sdec * slat});

    var r;
    var alt = [];
    var az = [];
    for (i=0; i<ha.length; i++) {
      r = Math.sqrt(Math.pow(x[i], 2) + Math.pow(y[i], 2));
      alt.push(Math.atan2(z[i], r));
      az.push(Math.atan2(y[i], x[i]) % (2 * Math.PI));
    }
    this.alt = new AngleArray(alt);
    this.az = new AngleArray(az);
  }
}

/**********************************************************************/
class Location {
  constructor(name, lat, lon, date) {
    /* name : string
       lat, lon : Angles
       date : moment.js Date, midnight local time.
    */
    this.name = name;
    this.lat = lat;
    this.lon = lon;
    this.date = date;
    this._setLST();
  }

  _setLST() {
    /*  Convert civil time to local sidereal time.

    Timezone is not considered.

    See Meeus, Astronomical Algorithms.

    Returns
    -------
    lst : Angle
      The local sidereal time.

    */
    var tzoff = new Angle(this.date.utcOffset() / 60, 'hr');
    var j2000 = moment.utc("2000-01-01 12:00");
    var d = (date0 - j2000) / 86400 / 1000 - tzoff.hr / 24;  // days
    d = Math.round(d - 1.0) + 0.5; // UT date?
    var y = d / 36525;  // years
    var th0 = 280.46061837
      + 360.98564736629 * d
      + 0.000387933 * Math.pow(y, 2)
      - Math.pow(y, 3) / 38710000.0;
    th0 = new Angle(th0 % 360, 'deg');
    this.lst0 = th0.add(this.lon).add(tzoff).mod(new Angle(2 * Math.PI));
  }
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
	range: [10, 90]
      },
      margin: {
	t: 12,
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
      var t = [[-12, this.sun.ct[this.sun.alt.set(alt[i])]],
	       [12, this.sun.ct[this.sun.alt.rise(alt[i])]]];
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
    Array.prototype.push.apply(update.shapes, this.airmassGuides());

    this.clearSun();
    Plotly.relayout('elevation-plot', update);
  }

  clearSun() {
    Plotly.relayout('elevation-plot', {shapes:[]});
  }

  airmassGuides() {
    // 19, 30, 50, 65 = 3, 2, 1.3, 1.1
    var alt = [19, 30, 50];
    var shapes = [];
    for (var i in alt) {
      shapes.push({
        type: 'rect',
	xref: 'paper',
	x0: 0,
	x1: 1,
	yref: 'y',
	y0: -90,
	y1: alt[i],
	fillcolor: '#e5a839',
	opacity: 0.15,
	line: { width: 0 }
      });
    }
    return shapes;
  }

  target(t) {
    var data = {
      name: t.name,
      x: t.ct.hr,
      y: t.alt.deg,
      type: 'scatter',
      mode: 'lines',
      hoverinfo: 'name',
    };
    Plotly.addTraces('elevation-plot', data);
  }
  
  clear() {
    var plotdiv = $('#elevation-plot')[0];
    var traces = [];
    for (var i=0; i<plotdiv.data.length; i++) {
      traces.push(i);
    }
    Plotly.deleteTraces('elevation-plot', traces);
  }
}

/**********************************************************************/
class Table {
  constructor() {
    this.datatable = $('#elevation-target-table').DataTable({
      searching: false,
      paging: false,
      columns: [
        { data: "checkbox" },
        {
	  data: "target",
	  type: "natural"
	},
        { data: "ra" },
        { data:
	  {
	    _: "dec.display",
	    sort: "dec.degree"
	  },
	  type: "numeric"
	},
        { data: "mv" },
        { data: "delta" },
        { data: "ddot" },
        { data: "phase" },
        { data: "elong" },
        { data: "mu" },
        { data:
	  {
            _:    "transit.display",
            sort: "transit.hour",
	  },
	  type: "numeric"
        },
        { data: "uptime" },
        { data: "darktime" }
      ]
    })
  }

  add(row) {
    var tr = this.datatable.row.add(row)
      .draw()
      .node();
    
    $(tr).click(rowCheckboxToggle);
  }

  plot() {
    $('#elevation-target-table')
      .find(':checkbox').each(
	function(i) {
	  if (this.checked) {
	    plot.target(table.datatable.row(i).data().target_data);
	  }
	}
      );
  }

  clear() {
    this.datatable.rows().remove().draw();
  }

  darkitime(i) {
    return Util.sexagesimalToFloat(this.datatable.row(i).data().darktime);
  }

  uptime(i) {
    return Util.sexagesimalToFloat(this.datatable.row(i).data().uptime);
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
    
    target.ra = Util.hr2rad(
      Util.sexagesimalToFloat(
	this.getDataByField(doc, 'RA')
      )
    );
    target.dec = Util.deg2rad(
      Util.sexagesimalToFloat(
	this.getDataByField(doc, 'DEC')
      )
    );
    target.delta = parseFloat(this.getDataByField(doc, 'Distance'));
    target.mv = parseFloat(this.getDataByField(doc, 'Mv'));
    target.phase = parseFloat(this.getDataByField(doc, 'Phase'));
    target.elong = parseFloat(this.getDataByField(doc, 'Elongation'));
    var dra = parseFloat(this.getDataByField(doc, 'dRAcosDEC'));
    var ddec = parseFloat(this.getDataByField(doc, 'dDEC'));
    target.mu = 60 * Math.sqrt(Math.pow(dra, 2), Math.pow(ddec, 2));
    target.ddot = parseFloat(this.getDataByField(doc, 'dist_dot'));
  
    done(target);
  }

  processTXT(data, done) {
    var lines = data.split('\n');

    var flag = parseInt(lines[0].split(/\s+/)[2]);
    if (flag == -1) {
      var msg = '';
      for (var i in lines) {
	if (lines[i][0] != '#') {
	  msg += lines[i];
	}
      }
      error(msg);
      return;
    }
    
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
    target.ra = Util.hr2rad(
      Util.sexagesimalToFloat(
	eph[2] + ' ' + eph[3] + ' ' + eph[4]
      )
    );
    target.dec = Util.deg2rad(
      Util.sexagesimalToFloat(
	eph[5] + ' ' + eph[6] + ' ' + eph[7]
      )
    );

    target.delta = parseFloat(eph[8]);
    target.mv = parseFloat(eph[9]);
    target.phase = parseFloat(eph[10]);
    target.elong = parseFloat(eph[11]);
    target.mu = Math.sqrt(Math.pow(parseFloat(eph[12]), 2)
			  + Math.pow(parseFloat(eph[13]), 2)) * 60;
    target.ddot = parseFloat(eph[14]);
  
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
  var lat = Util.deg2rad(parseFloat($('#elevation-latitude').val()));
  var lon = Util.deg2rad(parseFloat($('#elevation-longitude').val()));
  return { lat: lat, lon: lon };
}

/**********************************************************************/
function loadTargets(targetList) {
  var lines = targetList.split('\n');

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

    if (row[1].trim() == 'f') {
      newTarget({
	name: row[0],
	ra: Util.hr2rad(Util.sexagesimalToFloat(row[2])),
	dec: Util.deg2rad(Util.sexagesimalToFloat(row[3]))
      });
    } else {
      setTimeout(function(name, type, done) { eph.get(name, type, done); },
		 delay * 300, row[0], row[1], newTarget);
      delay++;
    }
  }
}

/**********************************************************************/
function openFile(e) {
  var reader = new FileReader();
  reader.onload = function(f) { loadTargets(f.target.result); };
  reader.readAsText(e.target.files[0]);
}

/**********************************************************************/
function loadTargetSetButton(e) {
  var button = $(e.target);
  $('#elevation-target-list').val(button.data('targets'));
  loadTargets(button.data('targets'));
}

/**********************************************************************/
function newTarget(t) {
  var altaz = generateAltAz(t);
  t.ct = altaz.ct;
  t.alt = altaz.alt;
  t.az = altaz.az;

  var row = {};

  row.target_data = t;
  row.checkbox = '<input type="checkbox" checked="true">';
  row.target = t.name;
  row.ra = Util.sexagesimal(Util.rad2hr(t.ra), 1, 2);
  row.dec = {
    display: Util.sexagesimal(Util.rad2deg(t.dec), 0, 2),
    degree: Util.rad2deg(t.dec)
  };

  if ('mv' in t) {
    row.mv = t.mv.toFixed(1);
    row.delta = t.delta.toFixed(2);
    row.ddot = t.ddot.toFixed(1);
    row.phase = t.phase.toFixed(0);
    row.elong = t.elong.toFixed(0);
    row.mu = t.mu.toFixed(0);
  } else {
    row.mv = '';
    row.delta = '';
    row.ddot = '';
    row.phase = '';
    row.elong = '';
    row.mu = '';
  }

  var transit = t.ct.hr[t.alt.transit()];
  row.transit = {
    display: Util.sexagesimal(transit, 0, 2).substr(0, 5),
    hour: transit
  };
  
  var up = t.alt.greater(30, 'deg');
  var uptime = 24 / ctSteps * test.reduce(Util.sum, 0);
  row.uptime = Util.sexagesimal(uptime, 0, 2).substr(0, 5);

  if (plot.sun === undefined) {
    row.darktime = 0;
  } else {
    var dark = plot.sun.alt.less(-18, 'deg');
    var test = up.map(function(x, i) { return x * dark[i]; });
    var darktime = 24 / ctSteps * test.reduce(Util.sum, 0);
    row.darktime = Util.sexagesimal(darktime, 0, 2).substr(0, 5);
  }

  table.add(row);
}

/**********************************************************************/
function addMovingTargetCallback(e) {
  var name = $('#elevation-add-moving-target-name').val();
  var type = $('#elevation-add-moving-target-type').val();
  eph.get(name, type, newTarget);
}

/**********************************************************************/
function addFixedTargetCallback(e) {
  var t = {
    name: $('#elevation-add-fixed-target-name').val(),
    ra: Util.hr2rad(
      Util.sexagesimalToFloat(
	$('#elevation-add-fixed-target-ra').val()
      )
    ),
    dec: Util.deg2rad(
      Util.sexagesimalToFloat(
	$('#elevation-add-fixed-target-dec').val()
      )
    )
  };
  newTarget(t);
}

/**********************************************************************/
function updateLocationCallback(e) {
  if ((e.target.id == 'elevation-date') || (plot.sun === undefined)) {
    eph.get('sun', 'p', function(data){ plot.updateSun(data); });
  }
  
  if (e.target.id == 'elevation-date') {
    plot.clear();
  } else if ((e.target.id == 'elevation-update-location-button')
	     || (e.target.classList.contains('elevation-observatory'))) {
    plot.clear();
    plot.updateSun();

    var targets = $('.elevation-target');
    if (targets.length > 0) {
      var coords = targets.map(function(i, x) {
	return $(x).data('target');
      });
      plot.clear();
      for (var i=0; i<coords.length; i++) {
	newTarget(coords[i]);
      }
    }
  }
}

/**********************************************************************/
function rowSelectionCallback(e) {
  var _table = $('#elevation-target-table');
  switch (e.target.value) {
  case "all":
    _table.find(':checkbox').each(function(){this.checked = true;});
    break;
  case "none":
    _table.find(':checkbox').each(function(){this.checked = false;});
    break;
  case "airmass":
    _table.find(':checkbox').each(
      function(i) {
	var up = table.uptime(i);
	if (up > 0) {
	  this.checked = true;
	} else {
	  this.checked = false;
	}
      });
    break;
  case "dark":
    _table.find(':checkbox').each(
      function(i) {
	var dark = table.darktime(i);
	if (dark > 0) {
	  this.checked = true;
	} else {
	  this.checked = false;
	}
      });
    break;
  default:
  }
  e.target.value = "select";
}

/**********************************************************************/
function rowCheckboxToggle(e) {
  if (e.target.tagName == 'INPUT') {
    return;
  }

  $(e.target)
    .parent()
    .find(':checkbox')
    .each(function() {
      this.checked = !this.checked;
    });
}


/**********************************************************************/
var Config = {
  debug: false,
  ctSteps: 360,
  ctStepSize: new Angle(2 * Math.PI / ctSteps)
}

var eph;
var plot;
var table;
var location;

$(document).ready(
  function() {
    eph = new IMCCE();
    plot = new Plot();
    table = new Table();
    updateLocation();

    $('#elevation-row-selection').change(rowSelectionCallback);
    $('#elevation-plot-selected').click(function(){table.plot();});
    $('#elevation-clear-plot').click(function(){plot.clear();});
    $('#elevation-clear-table').click(function(){table.clear();});

    $('#elevation-add-moving-target-button').click(addMovingTargetCallback);
    $('#elevation-add-fixed-target-button').click(addFixedTargetCallback);

    $('#elevation-open-file').change(openFile);

    $('#elevation-date').val(moment.tz().format().substr(0, 10));
    $('.elevation-observatory').click(function(e) {
      $('#elevation-latitude').val(parseFloat(e.target.dataset.latitude));
      $('#elevation-longitude').val(parseFloat(e.target.dataset.longitude));
      $('#elevation-timezone').val(e.target.dataset.timezone);
      updateLocationCallback(e);
    });
    $('#elevation-date').on('change', updateLocationCallback);
    $('#elevation-update-location-button').click(updateLocationCallback);

    $('#elevation-load-button').click(function(e) {
      loadTargets($('#elevation-target-list').val());
    });
    $('.elevation-load-target-set-button').click(loadTargetSetButton);
    eph.get('sun', 'p', function(data){plot.updateSun(data);});
  }
);

