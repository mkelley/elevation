
function rad2hr(x) { return (x * 12 / Math.PI); }
function rad2deg(x) { return (x * 180 / Math.PI); }
function deg2rad(x) { return (x * Math.PI / 180); }
function hr2rad(x) { return (x * Math.PI / 12); }
function branchcut(cut, period) { return function(x) { y = x % period; return (y<cut)?(y):(y - period);}; }

function hadec2altaz(ha, dec, lat) {
/*  Convert hour angle and declination to altitude and azimuth.

    Parameters
    ----------
    ha : array
      Hour angle. [rad]
    dec : float
      Target declination. [rad]
    lat : float
      The latitude of the observer. [rad]

    Returns
    -------
    alt, az : array
      The altitude and azimuth of the object.

    Notes
    -----
    Based on the IDL Astron hadec2altaz procedure by Chris O'Dell
    (UW-Maddison).

*/

  var sha = ha.map(Math.sin);
  var cha = ha.map(Math.cos);
  var sdec = Math.sin(dec);
  var cdec = Math.cos(dec);
  var slat = Math.sin(lat);
  var clat = Math.cos(lat);

  var x = cha.map(function(x){return -x * cdec * slat + sdec * clat;});
  var y = sha.map(function(x){return -x * cdec;});
  var z = cha.map(function(x){return x * cdec * clat + sdec * slat});

  var r;
  var alt = [];
  var az = [];
  for (i=0; i<ha.length; i++) {
    r = Math.sqrt(x[i]**2 + y[i]**2);
    alt.push(Math.atan2(z[i], r));
    az.push(Math.atan2(y[i], x[i]) % (2 * Math.PI));
  }

  return {alt: alt, az: az};
}

function ct2lst(date, lon) {
/*  Convert civil time to local sidereal time.

    Timezone is not considered.

    See Meeus, Astronomical Algorithms.

    Parameters
    ----------
    date : Date
      The requested date and time (usually midnight civil time).
    lon : float
      The East longitude of the observer. [rad]

    Returns
    -------
    lst : float
      The local sidereal time.  [rad]

*/

  var tzoff = 0;
  var j2000 = new Date(Date.UTC(2000, 1, 1, 12)); // JD2000 = 2451545
  var d = (date - j2000) / 86400 / 1000;  // days
  var y = d / 36525;  // years
  //th0 = 280.46061837 + 360.98564736629 * d + 0.000387933 * y**2 - y**3 / 38710000.0;
  //th0 = th0 % 360.0;
  th0 = 4.8949612127357929 + 6.300388098984957 * d + 6.7707081271391622e-06 * y**2 - 4.508729661571505e-10 * y**3;
  lst = (th0 + lon - hr2rad(tzoff)) % (2 * Math.PI);
  return lst;
}

var plot;

$(document).ready(
  function() {
    // create some data and a ColumnDataSource
    var date = new Date(2016, 6, 14);
    var lat = deg2rad(32.0);  // rad
    var lon = 0.0;  // rad
    var lst0 = ct2lst(date, lon);  // rad
    var ra = 0.0;  // rad
    var dec = 0.0;  // rad
    var ct = Bokeh.LinAlg.linspace(0, 2 * Math.PI, 361);  // rad
    var ha = ct.map(function(x){return (x + lst0 - ra) % (2 * Math.PI)});
    var altaz = hadec2altaz(ha, dec, lat);

    var data = {
      x: ct.map(rad2hr).map(branchcut(12, 24)),
      y: altaz.alt.map(rad2deg)
    };

    var line_properties = {
      x: { field: "x" },
      y: { field: "y" },
      line_color: "#666699",
      line_width: 2
    };

    var options = {
      x_range: Bokeh.Range1d(-12, 12),
      y_range: Bokeh.Range1d(0, 90),
      plot_width: 800,
      plot_height: 600,
      background_fill_color: "#2F2F2F",
      border_fill_color: "#2F2F2F",
      outline_line_color: '#444444'
    };

    var axis_properties = {
      axis_line_color: "white",
      axis_label_text_color: "white",
      major_label_text_color: "white",
      major_tick_line_color: "white",
      minor_tick_line_color: "white",
      minor_tick_line_color: "white"
    };

    plot = new Bokeh.Plot(options);

    var xaxis = new Bokeh.LinearAxis(axis_properties);
    var yaxis = new Bokeh.LinearAxis(axis_properties);
    xaxis.axis_label = "Civil Time (hr)";
    yaxis.axis_label = "Elevation (°)";
    plot.add_layout(xaxis, "below");
    plot.add_layout(yaxis, "left");

    var xgrid = new Bokeh.Grid({ ticker: xaxis.ticker, dimension: 0, grid_line_dash: [6, 4], grid_line_alpha: 0.3 });
    var ygrid = new Bokeh.Grid({ ticker: yaxis.ticker, dimension: 1, grid_line_dash: [6, 4], grid_line_alpha: 0.3 });
    plot.add_layout(xgrid);
    plot.add_layout(ygrid);

    var source = new Bokeh.ColumnDataSource({ data: data });
    var line = new Bokeh.Line(line_properties);
    plot.add_glyph(line, source);

    var doc = new Bokeh.Document();
    doc.add_root(plot);
    var div = document.getElementById("plot");
    Bokeh.embed.add_document_standalone(doc, div);

    $('#plot-button').click(plotData);
  }
);

function generateData(ra, dec) {
  var date = new Date(2016, 6, 14);
  var lat = deg2rad(32.0);  // rad
  var lon = 0.0;  // rad
  var lst0 = ct2lst(date, lon);  // rad
  var ra = 0.0;  // rad
  var dec = 0.0;  // rad
  var ct = Bokeh.LinAlg.linspace(0, 2 * Math.PI, 361);  // rad
  var ha = ct.map(function(x){return (x + lst0 - ra) % (2 * Math.PI)});
  var altaz = hadec2altaz(ha, dec, lat);

  return {
    x: ct.map(rad2hr).map(branchcut(12, 24)),
    y: altaz.alt.map(rad2deg)
  };
}

function plotData() {
  var comets = $('#comets').val().split('\n');

  var line_properties = {
    x: { field: "x" },
    y: { field: "y" },
    line_color: "#666699",
    line_width: 2
  };

  for (var i=0; i<comets.length; i++) {
    var row = comets[i].split(',');
    console.log(row);
    if (row.length != 3) {
      continue;
    }
    var data = generateData(parseFloat(row[1]), parseFloat(row[2]));
    var source = new Bokeh.ColumnDataSource({ data: data });
    var line = new Bokeh.Line(line_properties);
    plot.add_glyph(line, source);
  }
}
