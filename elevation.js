/**********************************************************************/
var Util = {
  airmassToAltitude: function(am) {
    return new Angle(Math.PI / 2 - Math.acos(1 / am));
  },

  altitudeToAirmass: function(alt) {
    return 1 / Math.cos(Math.PI / 2 - alt.rad);
  },

  branchcut: function(x, cut, period) {
    y = x % period;
    y = (y < 0)?(y + period):(y);
    return (y < cut)?(y):(y - period);
  },

  date: function() {
    return moment.tz($('#elevation-date').val() + ' 00:00',
		     $('#elevation-timezone').val());
  },
  
  deg2hr: function(x) { return (x / 15); },
  deg2rad: function(x) { return (x * Math.PI / 180); },  

  figureOfMerit: function(rh, delta, mv) {
    let mH = mv - 5 * Math.log10(delta);
    let Q = Math.pow(10, 30.675 - 0.2453 * mH);
    let FoM = Math.pow(rh, -1.5) / delta * Q / 2.3e26;
    return FoM;
  },

  hr2rad: function(x) { return (x * Math.PI / 12); },
  hr2deg: function(x) { return (x * 15); },

  isComet: function(name) {
    let n = name.trim().toUpperCase();
    return (n.startsWith(('P/', 'C/', 'X/', 'D/')) || n.endsWith('P'));
  },

  jd: function(date) {
    // Moment to Julian Date
    let utc = date.clone().tz('UTC');
    let Y = utc.year();
    let M = utc.month() + 1;
    if (M < 3) {
      Y -= 1;
      M + 12;
    }
    let D = (utc.date()
	     + (utc.hour()
		+ (utc.minute()
		   + utc.second() / 60)
		/ 60)
	     / 24);

    let A = parseInt(Y / 100);
    let B = 2 - A + parseInt(A / 4);
    let jd = (parseInt(365.25 * (Y + 4716)) + parseInt(30.6001 * (M + 1))
	      + D + B - 1524.5);
    return jd;
  },

  loadTargets: function(targetList) {
    // Parse a CSV table and add any targets to Elevation's target table.
    let lines = targetList.split('\n');
    let delay = 0;
    
    for (let i in lines) {
      if (lines[i].startsWith('#') || (lines[i].trim().length == 0)) {
	continue;
      }

      let row = lines[i].split(',');
      if ((row.length < 2) || (row.length == 3) || (row.length > 5)) {
	Util.msg("Bad row length: " + lines[i], true)
	continue;
      }

      if (row[1].trim() == 'f') {
	let name = row[0];
	let ra = new Angle(row[2], 'hr');
	let dec = new Angle(row[3], 'deg');
	table.add(new Target(name, ra, dec, 'f'));
      } else {
	console.log(row[0]);
	let promise = new Promise((resolve, reject) => {
	  setTimeout(() => resolve(1), 1000);
	}).then(() => { console.log(row[0]); return eph.get(row[0]); })
	    .then((target) => { console.log(target); table.add(target); });
	
	//setTimeout(Util.newMovingTarget, delay * Config.ajaxDelay,
	//row[0], row[1], Util.addTargetToTable);
	//delay += 1;
      }
    }
  },

  msg: function(s, error) {
    let time = moment().toISOString().substr(11, 8);
    let con = $('#elevation-console');
    if (con.length) {
      let p = $('<p><span class="elevation-timestamp">' + time +
		'</span>: ' + s + '</p>');
      if (error) {
	p.addClass('elevation-error');
      }
      con.prepend(p).scrollTop(0);
    }
    console.log(time + (error?' (Error): ':': ') + s)
  },
  
  rad2deg: function(x) { return (x * 180 / Math.PI); },
  rad2hr: function(x) { return (x * 12 / Math.PI); },

  scrollTo: function(id) {
    let e = $(id);
    if (e.length) {
      $('html, body').animate({ scrollTop: e.offset().top }, 500);
    }
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

    let sign = (x < 0)?'-':'+';
    let d = Math.floor(Math.abs(x));
    let m = Math.floor((Math.abs(x) - d) * 60);
    let s = ((Math.abs(x) - d) * 60 - m) * 60;

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
  },
  
  sexagesimalToFloat: function(s) {
    let _s = s.trim().match(/^([-+]?)(.+)/);
    let sign = (_s[1] == '-')?-1:1;
    _s = _s[2];  // now just the magnitude

    if (_s.includes('d')) {
      _s = _s.replace('d', ' ').replace('m', ' ').replace('s', ' ');
    } else if (_s.includes('h')) {
      _s = _s.replace('h', ' ').replace('m', ' ').replace('s', ' ');
    }

    if (_s.includes(':')) {
      _s = _s.replace(/:/g, ' ');
    }

    let dms = _s.trim().split(/\s+/).map(parseFloat);
    let angle = 0;
    let scales = [1, 60, 3600];
    for (let i in dms) {
      if (i > 2) {
	break;
      }
      angle += dms[i] / scales[i];
    }
    
    return sign * angle;
  },

  sum: function(a, b) { return a + b; },  

  updateTargets: function(updateEphemerides) {
    // If any targets have been defined, update them.
    let rows = $('.elevation-target');
    for (let i = 0; i < rows.length; i += 1) {
      target = table.datatable.row(i).data().targetData;
      if (updateEphemerides && (target.type != 'f')) {
	eph.get(target.name)
	  .then((target) => table.add(target, i));
      } else {
	target.update();
	table.add(target, i);
      }
    }
  },
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
  sub(a) { return new Angle(this.rad - a.rad); }
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

    let conv = function(a) {
      let b;
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

    this._a = a.map(conv);
  }

  add(a) {
    let b;
    if (a instanceof AngleArray) {
      if (a.rad.length == this.rad.length) {
	b = this.rad.map(function(x, i) { return x + a.rad[i]; });
      } else {
	throw "Arrays have different lengths: "
	  + this.rad.length + " " + a.rad.length;
      }
    } else if (a instanceof Angle) {
      b = this.rad.map(function(x) { return x + a.rad; });
    } else {
      throw "Can only add Angles or AngleArrays: " + (typeof a);
    }
    return new AngleArray(b);
  }
  
  get deg () { return this._a.map(Util.rad2deg); }
  get hr () { return this._a.map(Util.rad2hr); }
  get rad () { return this._a; }
  
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
    }));
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
    return this.rad.findIndex(function(a, i, alt) {
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
  constructor(name, ra, dec, type, attr) {
    /* name, ra (Angle), dec (Angle), type ((m)oving target, (f)ixed
     * target, or (sun)), object with any attributes to save */
    this.name = name;
    this.ra = ra;
    this.dec = dec;
    this.type = type;
    for (let k in attr) {
      this[k] = attr[k];
    }
    this.update();
  }

  update() {
    /* Create/update ct, ha, alt, and az arrays.

      Based, in part, on the IDL Astron hadec2altaz procedure by
      Chris O'Dell (UW-Maddison).
    */
    let _ct = Array.apply(null, Array(Config.ctSteps))
      .map(function(x, i){
	return -Math.PI + i * Config.ctStepSize.rad;
      });
    this.ct = new AngleArray(_ct)
      .branchcut(new Angle(12, 'hr'), new Angle(24, 'hr'));

    this.ha = new AngleArray(
      this.ct.rad.map(function(x){
	return (x + observatory.lst0.rad - this.ra.rad) % (2 * Math.PI);
      }, this));

    let sha = this.ha.rad.map(Math.sin);
    let cha = this.ha.rad.map(Math.cos);
    let sdec = Math.sin(this.dec.rad);
    let cdec = Math.cos(this.dec.rad);
    let slat = Math.sin(observatory.lat.rad);
    let clat = Math.cos(observatory.lat.rad);

    let x, y, z, r;
    let alt = [];
    let az = [];
    for (let i = 0; i < Config.ctSteps; i += 1) {
      x = -cha[i] * cdec * slat + sdec * clat;
      y = -sha[i] * cdec;
      z = cha[i] * cdec * clat + sdec * slat;
      r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      alt.push(Math.atan2(z, r));
      az.push(Math.atan2(y, x) % (2 * Math.PI));
    }
    this.alt = new AngleArray(alt);
    this.az = new AngleArray(az);
  }
}

/**********************************************************************/
class Sun extends Target {
  constructor(date) {
    // Meeus, Astronomical Algorithms.  Sun coordinates good to 0.01°
    // between 1900 and 2100.
    let jd = Util.jd(date);
    let T = (jd - 2451545.0) / 36525;
    
    let L0 = new Angle(280.46646 + 36000.76983 * T + 0.0003032 * T**2, 'deg');
    let M = new Angle(357.52911 + 35999.05029 * T - 0.0001537 * T**2, 'deg');
    //let e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T**2;
    
    let C = new Angle(
      (1.914602 - 0.004817 * T - 0.000014 * T**2) * Math.sin(M.rad)
	+ (0.019993 - 0.000101 * T) * Math.sin(2 * M.rad)
	+ 0.000289 * Math.sin(3 * M.rad), 'deg');

    let dlam = new Angle(1.297 * T, 'deg');
    let lambda = new Angle(L0.rad + C.rad - dlam.rad);

    let eps0 = new Angle(23.43929111111111, 'deg');
    let ra = new Angle(
      Math.atan2(
	Math.cos(eps0.rad) * Math.sin(lambda.rad),
	Math.cos(lambda.rad)));
    let dec = new Angle(
      Math.asin(Math.sin(eps0.rad) * Math.sin(lambda.rad)));

    super('Sun', ra, dec, 'sun', {});
  }
}


/**********************************************************************/
class Observatory {
  constructor(name, lat, lon, alt, date) {
    /* name : string
       lat, lon : Angles
       date : moment.js Date, midnight local time.
    */
    this.name = name;
    this.lat = lat;
    this.lon = lon;
    this.alt = alt;
    this.date = date;
    this._setLST0();
  }

  _setLST0() {
    /*  Convert civil time to local sidereal time at midnight.

    Timezone is not considered.

    See Meeus, Astronomical Algorithms.

    Returns
    -------
    lst : Angle
      The local sidereal time.

    */
    let tzoff = new Angle(this.date.utcOffset() / 60, 'hr');
    let d = Math.round(this.date / 86400 / 1000);  // seconds to days
    let j2000 = moment.utc("2000-01-01 12:00");  // J2000 epoch
    let d0 = (d - j2000 / 86400 / 1000);  // days since J2000 epoch
    let T0 = d0 / 365.25;  // years since J2000 epoch
    let th0 = 280.46061837
	+ 360.98564736629 * d0
	+ 0.000387933 * Math.pow(T0, 2)
	- Math.pow(T0, 3) / 38710000.0;
    th0 = new Angle(th0 % 360.0, 'deg');
    this.lst0 = th0.add(this.lon).sub(tzoff).mod(new Angle(2 * Math.PI));
  }

  get midnight () {
    let tzoff = new Angle(this.date.utcOffset() / 60, 'hr');
    return moment(this.date).add(tzoff, 'hours');
  }
}

/**********************************************************************/
class Plot {
  constructor() {
    let layout = {
      title: 'YYYY-MM-DD at ASDF',
      yaxis: {
	title: 'Elevation (deg)',
	range: [10, 90]
      },
      xaxis: {
	range: [-7, 7],
	tickmode: "array",
	tickvals: [-12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12],
      },
      margin: {
	t: 40,
	b: 50,
	l: 50,
	r: 50,
      },
      hovermode: 'closest',
      showlegend: true,
    };
    Plotly.newPlot('elevation-plot', [], layout);
    this.setupXAxis();
  }
  
  add(t) {
    let data = {
      name: t.name,
      x: t.ct.hr,
      y: t.alt.deg,
      type: 'scatter',
      mode: 'lines',
      hoverinfo: 'name',
    };
    Plotly.addTraces('elevation-plot', data);
  }
  
  airmassGuides() {
    // 19, 30, 50, 65 = 3, 2, 1.3, 1.1
    let alt = [19, 30, 50];
    let shapes = [];
    for (let i in alt) {
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
  
  clear() {
    let plotdiv = $('#elevation-plot')[0];
    let traces = [];
    for (let i = 0; i < plotdiv.data.length; i += 1) {
      traces.push(i);
    }
    Plotly.deleteTraces('elevation-plot', traces);

    let n = table.datatable.data().count();
    for (let i = 0; i < n; i += 1) {
      let data = table.datatable.row(i).data();
      table.datatable.row(i).data(data);
    }
  }

  clearGuides() {
    Plotly.relayout('elevation-plot', {shapes: []});
  }

  guides() {
    let shapes = [];
    Array.prototype.push.apply(shapes, this.sunGuides());
    Array.prototype.push.apply(shapes, this.airmassGuides());

    this.clearGuides();
    Plotly.relayout('elevation-plot', {shapes: shapes});
  }

  sunGuides() {
    let shapes = [];
    let alt = [new Angle(-18, 'deg'),
	       new Angle(-6, 'deg'),
	       new Angle(0)];
    for (let i in alt) {
      let t = [[-12, observatory.sun.ct.hr[observatory.sun.alt.set(alt[i])]],
	       [12, observatory.sun.ct.hr[observatory.sun.alt.rise(alt[i])]]];
      for (let j in t) {
	let shape = {
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
	shapes.push(shape);
      }
    }
    return shapes;
  }

  setupXAxis() {
    let tickvals = [];
    let ticklabels = [];
    for (let i = -12; i <= 12; i++) {
      tickvals.push(i);
      if (i < 0) {
	ticklabels.push(i + 24);
      } else {
	ticklabels.push(i);
      }
    }

    let update = {
      xaxis: {
	range: [-7, 7],
	tickmode: "array",
	tickvals: tickvals
      }
    };
    let t = new AngleArray(ticklabels, 'hr');
    if (Config.timeAxis == 'CT') {
      update.xaxis.title = 'Civil Time (hr)';
    } else if (Config.timeAxis == 'UT') {
      update.xaxis.title = 'Universal Time (hr)';
      t = t.add(new Angle(-Util.date().utcOffset() / 60, 'hr'))
	.branchcut(new Angle(24, 'hr'), new Angle(24, 'hr'));
    }

    update.xaxis.ticktext = t.hms(0, 2)
      .map(function(a) { return a.substr(1, 5); });
    Plotly.relayout('elevation-plot', update);
  }

  updateTitle() {
    let update = {
      title: (observatory.name + ' / ' +
	      observatory.date.toISOString().substring(0, 10))
    };
    Plotly.relayout('elevation-plot', update);
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
        { data: "FoM" },
        { data: "rh" },
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

  add(t, replace) {
    /* t : Target
         Target to add.
       replace : int, optional
         Index of a row to replace.
    */
    let row = {};

    row.targetData = t;
    row.checkbox = '<input type="checkbox" checked="true">';
    row.target = t.name;
    row.ra = t.ra.hms(1, 2);
    row.dec = {
      display: t.dec.dms(0, 2),
      degree: Util.rad2deg(t.dec)
    };

    // columns and number of places for toFixed call
    let columns = {
      mv: {places: 1},
      FoM: {places: 1},
      rh: {places: 2},
      delta: {places: 2},
      ddot: {places: 1},
      phase: {places: 0},
      elong: {places: 0},
      mu: {places: 0}
    };
    for (let k in columns) {
      if (k in t) {
	row[k] = t[k].toFixed(columns[k].places);
      } else {
	row[k] = '';
      }
    }

    let transit = t.ct.hr[t.alt.transit()];
    let offset = 0;
    if (Config.timeAxis == 'UT') {
      offset = -Util.date().utcOffset() / 60;
    }
    row.transit = {
      display: Util.sexagesimal(Util.branchcut(transit + offset, 24, 24), 0, 2).substr(0, 6),
      hour: transit
    };

    let up = t.alt.greater(Config.altitudeLimit);
    let uptime = 24 / Config.ctSteps * up.reduce(Util.sum, 0);
    row.uptime = Util.sexagesimal(uptime, 0, 2).substr(0, 6);

    if (observatory.sun === undefined) {
      row.darktime = 0;
    } else {
      let dark = observatory.sun.alt.less(new Angle(-18, 'deg'));
      let test = up.map(function(x, i) { return x * dark[i]; });
      let darktime = 24 / Config.ctSteps * test.reduce(Util.sum, 0);
      row.darktime = Util.sexagesimal(darktime, 0, 2).substr(0, 6);
    }

    let tr;
    if (replace === undefined) {
      tr = $(this.datatable.row
	     .add(row)
	     .draw()
	     .node());
      tr = $(tr);
    } else {
      // Keep the same checkbox state
      let checkboxState = $(this.datatable.row(replace).node())
	  .find(':checkbox')[0].checked;

      tr = $(this.datatable.row(replace)
	     .data(row)
	     .draw()
	     .node());
      tr.find(':checkbox')[0].checked = checkboxState;
    }

    tr.click(Callback.rowCheckboxToggle)
      .addClass('elevation-target');
  }

  clear() {
    this.datatable.rows().remove().draw();
  }

  darktime(i) {
    let j = table.datatable.rows().indexes()[i];
    return Util.sexagesimalToFloat(this.datatable.row(j).data().darktime);
  }

  plot() {
    Util.scrollTo('body');
    let delay = 0;
    let targets = $('#elevation-target-table').find(':checkbox');
    for (let i = 0; i < targets.length; i += 1) {
      if (targets[i].checked) {
	setTimeout(function(i) {
	  let j = table.datatable.rows().indexes()[i];
	  let data = table.datatable.row(j).data();
	  plot.add(data.targetData);
	}, delay * Config.ajaxDelay, i);
	delay += 1;
      }
    }
  }

  uptime(i) {
    let j = table.datatable.rows().indexes()[i];
    return Util.sexagesimalToFloat(this.datatable.row(j).data().uptime);
  }

}

/**********************************************************************/
class DummyEphemeris {
  constructor() {
    Util.msg('Using offline (random) ephemerides.');
  }

  checkAvailability() {
    Util.msg('Dummy ephemeris service (random) is available.');
  }
  
  get(name, type, done, opts) {
    let date = Util.date();
    if (isNaN(date)) {
      Util.msg(Date() + ': Invalid date.', true);
      return;
    }

    let t;
    if (name == 'sun') {
      Util.msg('Using the Sun position for 2016 Nov 17.');
      let ra = new Angle('14:51:29.3', 'hr');
      let dec = new Angle('-16:25:58', 'deg');
    } else {
      let ra = new Angle(Math.random() * Math.PI * 2);
      let dec = new Angle((Math.random() - 0.5) * Math.PI);
    }
    done(new Target(name, ra, dec, type), opts);
  }
}

/**********************************************************************/
var Callback = {
  addMovingTarget: function(e) {
    let name = $('#elevation-add-moving-target-name').val();
    let type = $('#elevation-add-moving-target-type').val();
    eph.get(name)
      .then((target) => table.add(target));
  },

  addFixedTarget: function(e) {
    t = new Target(
      $('#elevation-add-fixed-target-name').val(),
      new Angle($('#elevation-add-fixed-target-ra').val(), 'hr'),
      new Angle($('#elevation-add-fixed-target-dec').val(), 'deg'),
      'f'
    );
    table.add(t);
  },

  checkEphemerisAvailability: function(e) {
    eph.checkAvailability();
  },
  
  openFile: function(e) {
    let reader = new FileReader();
    reader.onload = function(f) { Util.loadTargets(f.target.result); };
    reader.readAsText(e.target.files[0]);
  },

  loadTargetSetButton: function(e) {
    let button = $(e.target);
    $('#elevation-target-list').val(button.data('targets'));
    Util.loadTargets(button.data('targets'));
    Util.scrollTo('#elevation-target-table-box');
  },
  
  rowCheckboxToggle: function(e) {
    if (e.target.tagName == 'INPUT') { return; }
    $(e.target)
      .parent()
      .find(':checkbox')
      .each(function() {
	this.checked = !this.checked;
      });
  },

  selectRows: function(e) {
    let _table = $('#elevation-target-table');
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
	  let up = table.uptime(i);
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
	  let dark = table.darktime(i);
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
  },

  setAirmassLimit: function(e) {
    let am = parseFloat($(e.target).val());
    Config.altitudeLimit = Util.airmassToAltitude(am);
    $('#elevation-altitude-limit').html(Config.altitudeLimit.deg.toFixed(1));
    Util.updateTargets(false);
  },
  
  updateObservatory: function(e) {
    plot.clear();

    let date = Util.date();
    let name = $('#elevation-observatory-name').val();
    let lat = new Angle(
      parseFloat($('#elevation-observatory-latitude').val()), 'deg');
    let lon = new Angle(
      parseFloat($('#elevation-observatory-longitude').val()), 'deg');
    let alt = parseFloat($('#elevation-observatory-altitude').val());
    let lastYMD;
    if (observatory !== undefined) {
      lastYMD = observatory.date.toISOString().substr(0, 10);
    }
    observatory = new Observatory(name, lat, lon, alt, date);

    // If the date has changed or the Sun is not yet defined, get a
    // new Sun RA and Dec.
    let updatedSun = false;
    let ymd = date.toISOString().substr(0, 10);
    observatory.sun = new Sun(observatory.date);
    plot.guides();
    plot.updateTitle();
    Util.updateTargets(true);

    if (e !== undefined) {
      Util.scrollTo('#elevation-target-table-box');
    }
  }
}

/**********************************************************************/
$(document).ready(
  function() {
    // Need the date setup for timezone first in case plot uses UT
    $('#elevation-date').val(moment.tz().format().substr(0, 10));
    
    if (Config.debug) {
      eph = new DummyEphemeris();
    } else if (Config.ephSource == 'mpc') {
      eph = new MPC();
    } else {
      eph = new DummyEphemeris();
    }
    plot = new Plot();
    table = new Table();

    $('#elevation-row-selection').change(Callback.selectRows);
    $('#elevation-plot-selected').click(function(){table.plot();});
    $('#elevation-clear-plot').click(function(){plot.clear();});
    $('#elevation-clear-table').click(function(){table.clear();});

    $('.add-fixed-target-on-enter').keyup(
      function(e) { if (e.keyCode == 13) { Callback.addFixedTarget(e); } }
    );

    $('.add-moving-target-on-enter').keyup(
      function(e) { if (e.keyCode == 13) { Callback.addMovingTarget(e);	} }
    );

    $('#elevation-add-moving-target-button').click(Callback.addMovingTarget);
    $('#elevation-add-fixed-target-button').click(Callback.addFixedTarget);

    $('#elevation-open-file').change(Callback.openFile);

    $('.elevation-observatory').click(function(e) {
      $('#elevation-observatory-name').val(
	$(e.target).text());
      $('#elevation-observatory-latitude').val(
	parseFloat(e.target.dataset.latitude));
      $('#elevation-observatory-longitude').val(
	parseFloat(e.target.dataset.longitude));
      $('#elevation-observatory-altitude').val(
	parseFloat(e.target.dataset.altitude));
      $('#elevation-timezone').val(
	e.target.dataset.timezone);
      Callback.updateObservatory(e);
    });
    $('#elevation-update-observatory-button')
      .click(Callback.updateObservatory);
    Callback.updateObservatory();
    $('#elevation-airmass-limit')
      .change(Callback.setAirmassLimit)
      .change();

    $('#elevation-xaxis-ut').change(function(e) {
      if (e.target.checked) {
	Config.timeAxis = 'UT';
      } else {
	Config.timeAxis = 'CT';
      }
      plot.setupXAxis();
      $('.elevation-time-axis').html(Config.timeAxis);
      Util.updateTargets();
    }).change();
    
    $('#elevation-load-button').click(function(e) {
      Util.loadTargets($('#elevation-target-list').val());
      Util.scrollTo('#elevation-target-table-box');
    });
    $('.elevation-load-target-set-button').click(Callback.loadTargetSetButton);

    $('#elevation-check-ephemeris-availability').click(Callback.checkEphemerisAvailability);
  }
);

var Config = {}
Config.ajaxDelay = 300;  // ms delay between ephemeris calls
Config.altitudeLimit = undefined;  // will be updated by document.ready
Config.ctSteps = 360;
Config.ctStepSize = new Angle(2 * Math.PI / Config.ctSteps);
Config.debug = false;
Config.ephSource = 'mpc';  // mpc
Config.timeAxis = 'UT';  // UT or CT (civil time / local time)

var eph;
var plot;
var table;
var observatory;
