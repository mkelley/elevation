/**********************************************************************/
class Horizons {
  constructor() {
    Util.msg("Using JPL Horizons ephemerides.")
  }

  checkAvailability() {
    // Returns a promise
    return $.get('https://ssd.jpl.nasa.gov/horizons.cgi#top')
      .then(() => { Util.msg('JPL Horizons is online.', true); })
      .reject(() => { Util.msg('No response from JPL Horizons.'); });
  }
  
  get(name, type) {
    // Returns a promise
    var date = Util.date();
    if (isNaN(date)) {
      Util.msg(Date() + ': Invalid date.', true);
      return;
    }

    let command;
    if (name.startsWith(('P/', 'C/', 'D/')) || name.endsWith('P')) {
      command = 'DES=' + name + '; CAP; NOFRAG;';
    } else {
      command = name;
    }

    let coords = (observatory.lon.deg + ',' + observatory.lat.deg + ','
		  + (observatory.alt / 1000));

    let payload = {
      'batch': 1,
      'COMMAND': command,
      'MAKE_EPHEM': 'YES',
      'TABLE_TYPE': 'OBSERVER',
      'CENTER': 'coord@399',
      'COORD_TYPE': 'GEODETIC',
      'SITE_COORD': coords,
      'TLIST': Util.jd(observatory.midnight),
      'QUANTITIES': '1,2,9,19,20,22,23,24,25',
      'CSV_FORMAT': 'YES'
    };

    payload = {
      'batch': 1,
      'COMMAND': "'499'",
      'MAKE_EPHEM': "'YES'",
      'TABLE_TYPE': "'OBSERVER'",
      'START_TIME': "'2000-01-01'",
      'STOP_TIME': "'2000-12-31'",
      'STEP_SIZE': "'15 d'",
      'QUANTITIES': "'1,9,20,23,24'",
      'CSV_FORMAT': "'YES'"
    };

    return $.ajax({
      type: 'GET',
      url: 'https://ssd.jpl.nasa.gov/horizons_batch.cgi',
      contentType: 'text/plain',
      xhrFields: {
	withCredentials: false
      },
      data: payload
    })
      .then((data) => this._parse(name, type, data))
      .reject(() => Util.msg('Error retrieving ephemeris for ' + name));
  }

  _parse(name, type, data) {
    // returns a Target
    let lines = data.split('\n');
    let eph = [];
    $.each(lines, (i, line) => {
      if (line.startsWith('$$SOE')) {
	eph = lines[i + 1].split(',');
      }
    });

    console.log(data);
    console.log(eph);

    if (eph.length == 0) {
      console.log(data);
      throw "Ephemeris parsing error.";
    }
    /*
    let name = lines[0];
    let eph = lines[lines.length - 2];
    let ra = new Angle(eph.substring(18, 28), 'hr');
    let dec = new Angle(eph.substring(29, 38), 'deg');

    let attr = {};
    attr.delta = parseFloat(eph.substring(39, 46));
    attr.rh = parseFloat(eph.substring(47, 54));
    attr.mv = parseFloat(eph.substring(69, 73));
    if (type == "c") {
      attr.FoM = Util.figureOfMerit(attr.rh, attr.delta, attr.mv);
    }
    attr.phase = parseFloat(eph.substring(62, 67));
    attr.elong = parseFloat(eph.substring(56, 61));
    attr.mu  = parseFloat(eph.substring(74, 81));
    attr.lelong = parseFloat(eph.substring(118, 121));

    return new Target(name, ra, dec, type, attr);*/
    return true;
  }
}
