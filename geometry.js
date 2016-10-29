function rad2hr(x) { return (x * 12 / Math.PI); }
function rad2deg(x) { return (x * 180 / Math.PI); }
function deg2rad(x) { return (x * Math.PI / 180); }
function hr2hm(x) {
  x = branchcut(24, 24)(x);
  var hr = Math.floor(x).toFixed(0);
  var m = ((x % 1) * 60).toFixed(0);
  if (m == "60") {
    hr = Math.floor(x + 1).toFixed(0);
    m = "00";
  }
    
  hr = '0'.repeat(2 - hr.length) + hr;
  m = '0'.repeat(2 - m.length) + m;
  return hr + ':' + m;
}
function deg2dm(x, size) {
  var s = (x < 0)?'-':'+';
  var deg = Math.floor(Math.abs(x)).toFixed(0);
  var m = ((Math.abs(x) % 1) * 60).toFixed(0);
  if (m == "60") {
    deg = Math.floor(Math.abs(x) + 1).toFixed(0);
    m = "00";
  }

  deg = s + '0'.repeat(size - deg.length) + deg;
  m = '0'.repeat(2 - m.length) + m;
  return deg + ':' + m;
}
function hr2rad(x) { return (x * Math.PI / 12); }
function branchcut(cut, period) {
  return function(x) {
    y = x % period;
    y = (y < 0)?(y + period):(y);
    return (y < cut)?(y):(y - period);
  };
}

function findRise(thresh) {
  // Return a fuction that will find the time an object rises above
  // the given altitude
  return function(this_alt, i, alt) {
    return ((alt[i-1] < thresh) && (this_alt >= thresh));
  };
};

function findSet(thresh) {
  // Return a fuction that will find the time an object rises above
  // the given altitude
  return function(this_alt, i, alt) {
    return ((alt[i-1] > thresh) && (this_alt <= thresh));
  };
};

function atStart(this_alt, i, alt) {
  // Function to find astronomical twilight start via Array.findIndex
  return ((alt[i-1] > -18) && (this_alt <= -18));
}

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
    r = Math.sqrt(Math.pow(x[i], 2) + Math.pow(y[i], 2));
    alt.push(Math.atan2(z[i], r));
    az.push(Math.atan2(y[i], x[i]) % (2 * Math.PI));
  }
  
  return {alt: alt, az: az};
}

function ct2lst(date0, lon) {
/*  Convert civil time to local sidereal time.

    Timezone is not considered.

    See Meeus, Astronomical Algorithms.

    Parameters
    ----------
    date0 : moment
      The requested date (midnight civil time).
    lon : float
      The East longitude of the observer. [rad]

    Returns
    -------
    lst : float
      The local sidereal time.  [rad]

*/
  var tzoff = hr2rad(date0.utcOffset() / 60);
  var j2000 = moment.utc("2000-01-01 12:00");
  var d = (date0 - j2000) / 86400 / 1000 - tzoff / 24;  // days
  d = Math.round(d - 1.0) + 0.5; // UT date?
  var y = d / 36525;  // years
  var th0 = 280.46061837 + 360.98564736629 * d
      + 0.000387933 * Math.pow(y, 2) - Math.pow(y, 3) / 38710000.0;
  th0 = deg2rad(th0 % 360);
  var lst = (th0 + lon - tzoff) % (2 * Math.PI);
  return lst;
}

