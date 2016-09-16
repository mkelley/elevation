function rad2hr(x) { return (x * 12 / Math.PI); }
function rad2deg(x) { return (x * 180 / Math.PI); }
function deg2rad(x) { return (x * Math.PI / 180); }
function hr2rad(x) { return (x * Math.PI / 12); }
function branchcut(cut, period) { return function(x) { y = x % period; return (y<cut)?(y):(y - period);}; }

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

