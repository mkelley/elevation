export default class Angle {
  /**
   * 
   * @param {[Number, String, Angle]} a an angle to copy or angle magnitude.
   * @param {string} [unit] units for angle magnitude: 'deg', 'rad', or 'hr' (default 'rad')
   * 
   * Supported string formats for a:
   *   1.2
   *   01 23 45
   *   1 23 45.6
   *   1 2 3
   *   1 2
   *   12:34:56
   *   12d34m56s
   *   12d 34m 56s
   *   12h34m56s
   *   12h 34m 56s
   * The last four formats ignore the unit parameter.
   */
  constructor(a, unit) {
    let newAngle;
    if (typeof a === 'string') {
      if (isNaN(a))
        newAngle = Angle.sexagesimalToFloat(a);
      else
        newAngle = parseFloat(a);

      // if units are provided in the string, they override the unit parameter
      if (a.includes('d'))
        unit = 'deg'
      else if (a.includes('h'))
        unit = 'hr'
    } else if (a instanceof Angle) {
      newAngle = a.rad;
      unit = 'rad'
    } else {
      newAngle = a;
    }

    switch (unit) {
      case 'deg':
        newAngle = Angle.deg2rad(newAngle);
        break;
      case 'hr':
        newAngle = Angle.hr2rad(newAngle);
        break;
      default:
    }
    this._a = newAngle;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return this._a;
    } else if (hint === 'string') {
      return String(this._a) + ' rad';
    }
    return null;
  }

  /**
   * 
   * @param {number} angle the angle to convert
   * @param {integer} [secondsPrecision] decimals after the point (default 1)
   * @param {integer} [degreesWidth] zero-pad the degrees place to this width (default no padding)
   * @param {boolean} [alwaysSign] always show the +/- sign (default true)
   * @returns 
   */
  static floatToSexagesimal(angle, secondsPrecision, degreesWidth, alwaysSign) {
    if (isNaN(angle)) {
      return 'Nan';
    } else if (!isFinite(angle)) {
      return 'Infinite';
    }

    alwaysSign = alwaysSign === undefined ? true : alwaysSign;

    if (secondsPrecision === undefined) {
      secondsPrecision = 0;
    }

    const sign = (angle < 0) ? '-' : '+';
    let d = Math.floor(Math.abs(angle));
    let m = Math.floor((Math.abs(angle) - d) * 60);
    let s = ((Math.abs(angle) - d) * 60 - m) * 60;

    const factor = Math.pow(10, secondsPrecision);
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
    s = s.toFixed(secondsPrecision);

    if (degreesWidth !== undefined) {
      d = '0'.repeat(Math.max(degreesWidth - d.length, 0)) + d;
    }

    m = '0'.repeat(2 - m.length) + m;

    if (secondsPrecision === 0) {
      s = '0'.repeat(2 - s.length) + s;
    } else {
      s = '0'.repeat(2 - s.length + secondsPrecision + 1) + s;
    }

    return (alwaysSign ? sign : (sign === '-' ? sign : "")) + d + ':' + m + ':' + s;
  }


  /**
   * 
   * @param {string} s sexagesimal formatted angle, e.g., -12d34m56.7s, -12 34 56.7, -12:34:56.7.
   * @returns
   */
  static sexagesimalToFloat(s) {
    let _s = s.trim().match(/^([-+]?)(.+)/);
    const sign = (_s[1] === '-') ? -1 : 1;
    _s = _s[2];  // now just the magnitude

    if (_s.includes('d')) {
      _s = _s.replace('d', ' ').replace('m', ' ').replace('s', ' ');
    } else if (_s.includes('h')) {
      _s = _s.replace('h', ' ').replace('m', ' ').replace('s', ' ');
    }

    if (_s.includes(':')) {
      _s = _s.replace(/:/g, ' ');
    }

    const dms = _s.trim().split(/\s+/).map(parseFloat);
    let angle = 0;
    const scales = [1, 60, 3600];
    for (let i in dms) {
      if (i > 2) {
        break;
      }
      angle += dms[i] / scales[i];
    }

    return sign * angle;
  }

  static rad2deg(x) { return (x * 180 / Math.PI); }
  static rad2hr(x) { return (x * 12 / Math.PI); }

  static hr2rad(x) { return (x * Math.PI / 12); }
  static hr2deg(x) { return (x * 15); }

  static deg2hr(x) { return (x / 15); }
  static deg2rad(x) { return (x * Math.PI / 180); }

  static branchcut(x, cut, period) {
    let y = x.rad % period.rad;
    y = (y < 0) ? (y + period.rad) : (y);
    return new Angle((y < cut.rad) ? (y) : (y - period.rad));
  }

  get deg() { return Angle.rad2deg(this.rad); }
  get hr() { return Angle.rad2hr(this.rad); }
  get rad() { return this._a; }

  dms(secondsPrecision, degreesWidth, alwaysSign) {
    secondsPrecision = (secondsPrecision === undefined) ? 0 : secondsPrecision;
    degreesWidth = (degreesWidth === undefined) ? 2 : degreesWidth;
    alwaysSign = (alwaysSign === undefined) ? true : alwaysSign;
    return Angle.floatToSexagesimal(this.deg, secondsPrecision, degreesWidth, alwaysSign);
  }

  hms(secondsPrecision, hoursWidth) {
    secondsPrecision = (secondsPrecision === undefined) ? 1 : secondsPrecision;
    hoursWidth = (hoursWidth === undefined) ? 2 : hoursWidth;
    return Angle.floatToSexagesimal(this.hr, secondsPrecision, hoursWidth, false);
  }

  hm(hoursWidth) {
    const s = Angle.floatToSexagesimal(this.hr, 0, hoursWidth, false)
    return s.substring(0, s.length - 3);
  }

  clock() {
    return Angle.branchcut(
      this,
      new Angle(2 * Math.PI),
      new Angle(2 * Math.PI)
    ).hm(2);
  }

  add(a) { return new Angle(this.rad + a.rad); }
  mod(a) { return new Angle(this.rad % a.rad); }
  sub(a) { return new Angle(this.rad - a.rad); }
}
