$(document).ready(
  function() {
    $('#plot-button').click(plotData);
    $('#plot-button').click();
  }
);

var DEBUG = true;
var ctSteps = 360;
var ctStepSize = 2 * Math.PI / ctSteps;  // rad

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
  if (DEBUG) {
    done("# Flag: 1\n# Ticket: 1474026768834\n# Solar system object ephemeris by IMCCE\n# Planet 11 Sun\n# Diameter (km): 1392000.00\n# CEU (arcsec): 0.00000000E+00\n# CEU rate (arcsec/d): 0.00000000E+00\n# Planetary theory INPOP13C\n# Astrometric J2000 coordinates\n# Frame center: geocenter\n# Relativistic perturbations, coordinate system 0\n# Equatorial coordinates (RA, DEC)\n#         Date UTC              R.A            Dec.          Distance     V.Mag   Phase   Elong.  muRAcosDE     muDE      Dist_dot\n#             h  m  s       h  m  s         o  '  \"            AU                   o        o      \"/min      \"/min       km/s\n  2016-09-14T00:00:00.00   11 28 20.21832 +03 25  1.0909    1.005859201  -26.73    0.00     0.00  0.2237E+01 -0.9590E+00   -0.46974\n\n");
  } else {
    params = {};
    params['-name'] = type + ':' + name;
    params['-ep'] = date;
    params['-mime'] = 'text';
    params['-from'] = 'elevation-webapp';
    $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', params)
      .done(done);
  }
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
  var sun = generateAltAz(c.ra, c.dec);
  var sunset = sun.ct[sun.alt.findIndex(findSet(0))];
  var sunrise = sun.ct[sun.alt.findIndex(findRise(0))];
  var atend = sun.ct[sun.alt.findIndex(findSet(-18))];
  var atstart = sun.ct[sun.alt.findIndex(findRise(-18))];
  var ctend = sun.ct[sun.alt.findIndex(findSet(-6))];
  var ctstart = sun.ct[sun.alt.findIndex(findRise(-6))];
  var update = {
    shapes: [
      { type: 'rect',
	xref: 'x',
	x0: -12,
	x1: sunset,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      },
      { type: 'rect',
	xref: 'x',
	x0: sunrise,
	x1: 12,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      },
      { type: 'rect',
	xref: 'x',
	x0: -12,
	x1: atend,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      },
      { type: 'rect',
	xref: 'x',
	x0: atstart,
	x1: 12,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      },
      { type: 'rect',
	xref: 'x',
	x0: -12,
	x1: ctend,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      },
      { type: 'rect',
	xref: 'x',
	x0: ctstart,
	x1: 12,
	yref: 'paper',
	y0: 0,
	y1: 1,
	fillcolor: '#87cefa',
	opacity: 0.2,
	line: { width: 0 }
      }
    ]
  };
  Plotly.relayout('plot-window', update);
}

function generateAltAz(ra, dec) {
  // ra, dec in radians
  var date = new Date(2016, 6, 14);
  var lat = deg2rad(32.0);  // rad
  var lon = 0.0;  // rad
  var lst0 = ct2lst(date, lon);  // rad

  var ct = [-Math.PI];
  for (var i=1; i<=ctSteps; i++) {
    ct.push(ct[i-1] + ctStepSize);  // rad
  };
  
  var ha = ct.map(function(x){return (x + lst0 - ra) % (2 * Math.PI)});
  var altaz = hadec2altaz(ha, dec, lat);

  return {
    ct: ct.map(rad2hr).map(branchcut(12, 24)),
    alt: altaz.alt.map(rad2deg),
    az: altaz.az.map(rad2deg),
  };
}

/*
  name: '',
x:,
y:,
    type: 'scatter',
    mode: 'lines'
*/
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

    altaz = generateAltAz(hr2rad(parseFloat(row[1])),
			  deg2rad(parseFloat(row[2])));
    
    data.push({
      name: row[0],
      x: altaz.ct,
      y: altaz.alt,
      type: 'scatter',
      mode: 'lines'
    });
  }

  Plotly.newPlot('plot-window', data, layout);
  getIMCCE('sun', 'p', $('#date').val(), addSun);
}
