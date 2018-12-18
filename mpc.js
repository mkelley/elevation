/**********************************************************************/
class MPC {
  constructor() {
    this.MPC_URL = 'https://cgi.minorplanetcenter.net/cgi-bin/mpeph2.cgi';
    Util.msg("Using MPC's ephemeris service.")
  }
  
  checkAvailability() {
    // Returns a promise
    let payload = this._prepare_payload('Ceres');
    delete payload['long'];
    delete payload.lat;
    delete payload.alt;
    payload.d = '2018-12-01';
    payload.c = '500';
    return this._request(payload)
      .then((data) => {
	console.log(data);
	Util.msg('MPES is online.');
      }).catch((data) => {
	console.log(data);
	Util.msg('MPES request failed.', true);
      });
  }

  _request(payload) {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open('POST', this.MPC_URL, true);
      request.setRequestHeader(
	'Content-Type', 'application/x-www-form-urlencoded');
      request.responseType = 'document';
      request.onload = (() => {
	if (request.status === 200) {
	  resolve(request.response);
	} else {
	  reject(new Error(request.statusText));
	}
      });
      request.send($.param(payload));
    });
  }
  
  get(name, meta) {
    var date = Util.date();
    if (isNaN(date)) {
      Util.msg(date + ': Invalid date.', true);
      return;
    }

    let payload = this._prepare_payload(name);

    return this._request(payload, meta)
      .then((data) => this._parse(name, data, meta))
      .catch((data) => {
	console.log(data);
	Util.msg('Error retrieving ephemeris for ' + name + '.', true);
      });
  }

  _prepare_payload(name) {
    let date = observatory.date
	.toISOString()
	.replace('T', ' ')
	.substring(0, 13);
    
    let payload = {
      ty: 'e',         // ephemeris
      TextArea: name,  // target name
      uto: '0',        // UT offset for daily ephemerides
      igd: 'n',        // suppress daytime
      ibh: 'n',        // suppress set
      fp: 'y',         // use perturbed elements
      adir: 'N',       // azimuth is east of north
      tit: '',         // no page title
      bu: '',          // no base url
      'long': observatory.lon.deg, // longitude, decimal degrees
      lat: observatory.lat.deg,    // latitude, decimal degrees
      alt: observatory.alt,        // altitude, meters
      d: date,         // date
      l: 1,            // number of dates to output
      i: '1',          // interval size
      u: 'd',          // interval unit
      raty: 'a',       // ephemeris type: equatorial, max precision
      s: 't',          // proper motion: total motion and PA
      m: 'h'           // proper motion: arcsec/hr
    };
    return payload;
  }

  _parse(name, data, meta) {
    let text = data.body.getElementsByTagName('pre')[0].innerText;
    let lines = text.split('\n');
    
    let eph = lines[lines.length - 2];
    let ra = new Angle(eph.substring(18, 28), 'hr');
    let dec = new Angle(eph.substring(29, 38), 'deg');

    meta.mpc_name = lines[0].replace(/^0+/, '');
    meta.delta = parseFloat(eph.substring(39, 46));
    meta.rh = parseFloat(eph.substring(47, 54));
    meta.mv = parseFloat(eph.substring(69, 73));
    if (Util.isComet(name)) {
      meta.FoM = Util.figureOfMerit(meta.rh, meta.delta, meta.mv);
    }
    meta.phase = parseFloat(eph.substring(62, 67));
    meta.selong = parseFloat(eph.substring(56, 61));
    meta.mu  = parseFloat(eph.substring(74, 81));
    meta.lelong = parseFloat(eph.substring(118, 121));

    return new Target(name, ra, dec, 'm', meta);
  }
}
