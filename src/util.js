import React from "react";
import moment from "moment-timezone";
import Angle from "./model/Angle";
import AngleArray from "./model/AngleArray";

export function airmassToElevation(am) {
  return new Angle(Math.PI / 2 - Math.acos(1 / am));
}

export function elevationToAirmass(el) {
  return 1 / Math.cos(Math.PI / 2 - el);
}

export function eq2gal(ra, dec) {
  // equatorial to Galactic coordinates
  // ra, dec as angles
  // Practical Astronomy with your Calculator or Spreadsheet
  // Duffett-Smith & Zwart
  const sinLat = Math.cos(dec) * 0.88781539 * Math.cos(ra - 3.3553954869590985)
    + Math.sin(dec) * 0.46019978;
  const lat = Math.asin(sinLat);
  const lon = Math.atan2(
    Math.sin(dec) - sinLat * 0.46019978,
    Math.cos(dec) * 0.88781539 * Math.sin(ra - 3.3553954869590985)
  ) + 0.5759586531581288;
  return { b: new Angle(lat, 'rad'), l: new Angle(lon, 'rad') };
}

export function figureOfMerit(rh, delta, mV) {
  if (!(rh && delta && mV)) {
    return null;
  }
  const mH = mV - 5 * Math.log10(delta);
  const Q = Math.pow(10, 30.675 - 0.2453 * mH);
  const FoM = Math.pow(rh, -1.5) / delta * Q / 2.3e26;
  return FoM;
}

export function isComet(name) {
  const n = name.trim().toUpperCase();
  const provisional = (
    ['P/', 'C/', 'X/', 'D/'].indexOf(n.substring(0, 2)) > -1);
  const permanent = n.endsWith('P');
  return (permanent || provisional);
}

export function julianDate(date) {
  // Moment to Julian Date
  const utc = date.clone().tz('UTC');
  let Y = utc.year();
  const M = utc.month() + 1;
  if (M < 3) {
    Y -= 1;
    //M + 12; ???
  }
  const D = (utc.date()
    + (utc.hour()
      + (utc.minute()
        + utc.second() / 60)
      / 60)
    / 24);

  const A = parseInt(Y / 100);
  const B = 2 - A + parseInt(A / 4);
  const jd = (parseInt(365.25 * (Y + 4716)) + parseInt(30.6001 * (M + 1))
    + D + B - 1524.5);
  return jd;
}

function lst0(observer) {
  /*  Convert civil time to local sidereal time at midnight.

  Timezone is not considered(?)

  See Meeus, Astronomical Algorithms.

  Returns
  -------
  lst : Angle
    The local sidereal time.

  */

  const tzoff = new Angle(observer.date.utcOffset() / 60, 'hr');
  const d = Math.round(observer.date / 86400 / 1000);  // seconds to days
  const j2000 = moment.utc("2000-01-01 12:00");  // J2000 epoch
  const d0 = (d - j2000 / 86400 / 1000);  // days since J2000 epoch
  const T0 = d0 / 365.25;  // years since J2000 epoch
  let th0 = 280.46061837
    + 360.98564736629 * d0
    + 0.000387933 * Math.pow(T0, 2)
    - Math.pow(T0, 3) / 38710000.0;
  th0 = new Angle(th0 % 360.0, 'deg');
  return th0.add(observer.longitude).sub(tzoff).mod(new Angle(2 * Math.PI));
}

/**
 * Compute ct, ha, alt, az, and am arrays.
 * Based, in part, on the IDL Astron hadec2altaz procedure by Chris O'Dell (UW-Maddison).
 * 
 * @param {Object} target 
 * @param {Object} observer 
 */
export function elevation(target, observer) {
  const steps = 360;
  const _ct = Array.apply(null, Array(steps))
    .map((x, i) => -Math.PI + i * 2 * Math.PI / steps);
  const ct = new AngleArray(_ct)
    .branchcut(new Angle(12, 'hr'), new Angle(24, 'hr'));

  const ha = new AngleArray(
    ct.rad.map((a) => (a + lst0(observer).rad - target.ra.rad) % (2 * Math.PI))
  );

  let sha = ha.rad.map(Math.sin);
  let cha = ha.rad.map(Math.cos);
  let sdec = Math.sin(target.dec.rad);
  let cdec = Math.cos(target.dec.rad);
  let slat = Math.sin(observer.latitude.rad);
  let clat = Math.cos(observer.latitude.rad);

  let x, y, z, r;
  let _el = [];
  let _az = [];
  for (let i = 0; i < steps; i += 1) {
    x = -cha[i] * cdec * slat + sdec * clat;
    y = -sha[i] * cdec;
    z = cha[i] * cdec * clat + sdec * slat;
    r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

    _el.push(Math.atan2(z, r));
    _az.push(Math.atan2(y, x) % (2 * Math.PI));
  }
  const el = new AngleArray(_el);
  const az = new AngleArray(_az);
  const am = el.rad.map(elevationToAirmass);

  const transitTime = ct.get(el.transit());

  const timeAboveElevationLimit = new Angle(
    el.filter((e) => e > observer.elevationLimit).length * 24 / steps,
    'hr');

  // -18 deg === -0.3141592653589793
  // requires the Sun
  const timeAboveElevationLimitAndDark = observer.sun &&
    new Angle(
      el.filter((e, index) =>
        (e > observer.elevationLimit) && (observer.sun.elevation.get(index) < -0.3141592653589793)
      ).length * 24 / steps,
      'hr');

  const twilight = {};
  if (target.name === 'Sun') {
    twilight.sunrise = ct.get(el.rise(new Angle(-0.83, 'deg')));
    twilight.sunset = ct.get(el.set(new Angle(-0.83, 'deg')));
    twilight.astronomicalStart = ct.get(el.rise(new Angle(-18, 'deg')));
    twilight.astronomicalEnd = ct.get(el.set(new Angle(-18, 'deg')));
    twilight.nauticalStart = ct.get(el.rise(new Angle(-12, 'deg')));
    twilight.nauticalEnd = ct.get(el.set(new Angle(-12, 'deg')));
    twilight.civilStart = ct.get(el.rise(new Angle(-6, 'deg')));
    twilight.civilEnd = ct.get(el.set(new Angle(-6, 'deg')));
  }

  return {
    civilTime: ct, hourAngle: ha, elevation: el, azimuth: az, airmass: am,
    transitTime, timeAboveElevationLimit, timeAboveElevationLimitAndDark,
    twilight
  }
}

/**
 * Meeus, Astronomical Algorithms.  Sun coordinates good to 0.01° between 1900 and 2100.
 * 
 * @param {moment} date 
 */
export function solarEphemeris(date) {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;

  const L0 = new Angle(280.46646 + 36000.76983 * T + 0.0003032 * T ** 2, 'deg');
  const M = new Angle(357.52911 + 35999.05029 * T - 0.0001537 * T ** 2, 'deg');
  //let e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T**2;

  const C = new Angle(
    (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * Math.sin(M.rad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M.rad)
    + 0.000289 * Math.sin(3 * M.rad), 'deg');

  const dlam = new Angle(1.297 * T, 'deg');
  const lambda = new Angle(L0.rad + C.rad - dlam.rad);

  const eps0 = new Angle(23.43929111111111, 'deg');
  const ra = new Angle(
    Math.atan2(
      Math.cos(eps0.rad) * Math.sin(lambda.rad),
      Math.cos(lambda.rad)));
  const dec = new Angle(
    Math.asin(Math.sin(eps0.rad) * Math.sin(lambda.rad)));

  return { name: "Sun", ra, dec };
}

export function useCookieState(key, defaultState) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(key + '='));

  let decode, encode;
  if (typeof defaultState === 'boolean') {
    decode = (s) => s === 'true';
    encode = String;
  } else {
    decode = decodeURIComponent;
    encode = encodeURIComponent;
  }

  const value = cookie ? decode(cookie.split('=', 2)[1]) : defaultState;

  const [state, _setState] = React.useState(value);

  const setState = (value) => {
    document.cookie = [key, encode(value)].join('=');
    _setState(value);
  };

  return [state, setState];
}

function targetsReducer(targets, action) {
  let updatedTargets;
  switch (action.type) {
    case 'append': {
      updatedTargets = [...targets, action.target];
      break;
    }
    case 'append targets': {
      updatedTargets = [...targets, ...action.targets];
      break;
    }
    case 'update': {
      updatedTargets = [...targets];
      updatedTargets[action.index] = action.target;
      break;
    }
    case 'delete': {
      updatedTargets = [...targets];
      updatedTargets.splice(action.index, 1);
      break;
    }
    case 'delete targets': {
      const names = action.targets.map((target) => target.name);
      updatedTargets = targets.filter((target) => !names.includes(target.name));
      break;
    }
    case 'delete all': {
      updatedTargets = [];
      break
    }
    case 'clear plot': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: false }
      );
      break;
    }
    case 'plot selected': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: target.selected || target.plot }
      );
      break;
    }
    case 'do not plot selected': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: target.selected ? false : target.plot }
      );
      break;
    }
    case 'refresh': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, refresh: true }
      );
      break;
    }
    case 'select-all': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: true }
      );
      break;
    }
    case 'select-none': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: false }
      );
      break
    }
    case 'select-inverted': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: !target.selected }
      );
      break;
    }
    case 'select-less-than-airmass-limit': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimit > 0 }
      );
      break;
    }
    case 'select-greater-than-airmass-limit': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimit.rad === 0 }
      );
      break;
    }
    case 'select-dark': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimitAndDark > 0 }
      );
      break;
    }
    case 'select-not-dark': {
      updatedTargets = targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimitAndDark.rad === 0 }
      );
      break;
    }
    case 'refresh-observer': {
      updatedTargets = targets.map((target) => {
        if (target === 'new') {
          return target;
        } else if (target.moving) {
          // ephemeris service update may be needed, let Target manage that
          return { ...target, refresh: true };
        } else {
          // fixed targets just need to update elevation properties
          return { ...target, ...elevation(target, action.observer) }
        }
      });
      break;
    }
    default:
      throw new Error();
  }
  document.cookie = 'targets=' + encodeURIComponent(JSON.stringify(updatedTargets.map((target) => ({
    name: target.name,
    moving: target.moving,
    notes: target.notes,
    selected: target.selected,
    plot: target.plot,
    ra: target.ra.rad,
    dec: target.dec.rad,
    mV: target.mV
  }))));
  return updatedTargets;
}

export function useTargets() {
  // example targets
  // { name: '2P', moving: true, notes: "", refresh: true, selected: false, plot: true },
  // { name: '16 Cyg', moving: false, ra: new Angle(0), dec: new Angle(0), mV: 7, notes: "", refresh: true, selected: false, plot: true }

  // check cookies for saved targets
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('targets='));

  let savedTargets = [];
  if (cookie) {
    // deserialize to a javascript object, taking care with ra and dec
    savedTargets = JSON.parse(
      decodeURIComponent(cookie.split('=', 2)[1]))
      .map((target) => ({
        ...target,
        ra: new Angle(target.ra),
        dec: new Angle(target.dec),
        refresh: true
      }));
  }

  const [targets, targetDispatch] = React.useReducer(targetsReducer, savedTargets);
  return [targets, targetDispatch];
}