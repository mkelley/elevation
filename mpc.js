/**********************************************************************/
class MPC {
  constructor() {
    Util.msg("Using MPC's ephemeris service.")
  }

  checkAvailability() {
    
  }
  
  get(name, type, success, opts) {
    var date = Util.date();
    if (isNaN(date)) {
      Util.msg(Date() + ': Invalid date.', true);
      return;
    }

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
      lat: observatory.lat.deg,     // latitude, decimal degrees
      alt: observatory.alt,         // altitude, meters
      d: observatory.date,  // date
      l: 1,            // number of dates to output
      i: '1',          // interval size
      u: 'd',          // interval unit
      raty: 'a',       // ephemeris type: equatorial, max precision
      s: 't',          // proper motion: total motion and PA
      m: 'h'           // proper motion: arcsec/hr
    };

    $.post('https://cgi.minorplanetcenter.net/cgi-bin/mpeph2.cgi', payload)
      .done((data) => parseMPES(data))
      .done((target) => success(target, opts));
  }

  parseMPES(data) {
    let html = $.parseHTML(data);
    let tags = [];
    $.each(html, function(i, el) {
      tags[i] = "<li>" + el.nodeName + "</li>";
    });
    let text = html[tags.indexOf('pre')].textContent;
    let lines = text.split('\n');
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

    return new Target(name, ra, dec, type, attr);
  }
}
