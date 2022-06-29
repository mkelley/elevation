import React from "react";
import Angle from "../model/Angle";
import { elevation } from '../util';

function readCookie(scope, key, defaultValue) {
  const storage = (scope === 'session') ? window.sessionStorage : window.localStorage;

  let decode;
  if (typeof defaultValue === 'boolean') {
    decode = (s) => s === 'true';
  } else if (typeof defaultValue === 'number') {
    decode = (s) => Number(s);
  } else if (typeof defaultValue === 'object') {
    // save as JSON
    decode = JSON.parse;
  } else {
    decode = (s) => s;
  }

  const stored = storage.getItem(`elevation-${key}`);
  const value = stored ? decode(stored) : defaultValue;

  return value;
}

function storeCookie(scope, key, value) {
  const storage = (scope === 'session') ? window.sessionStorage : window.localStorage;

  let encode;
  if (typeof value === 'boolean') {
    encode = String;
  } else if (typeof value === 'number') {
    encode = String;
  } else if (typeof value === 'object') {
    // save as JSON
    encode = JSON.stringify;
  } else {
    encode = (value) => value;
  }

  storage.setItem(`elevation-${key}`, encode(value));
}

export function useCookieState(scope, key, defaultValue) {
  const [state, _setState] = React.useState(readCookie(scope, key, defaultValue));

  const setState = (value) => {
    storeCookie(scope, key, value);
    _setState(value);
  }

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

  storeCookie(
    "local",
    "targets",
    updatedTargets
      .filter((target) => target !== 'new')
      .map((target) => ({
        name: target.name,
        moving: target.moving,
        notes: target.notes,
        selected: target.selected,
        plot: target.plot,
        ra: target.ra ? target.ra.rad : null,
        dec: target.dec ? target.dec.rad : null,
        mV: target.mV || null
      }))
  );
  return updatedTargets;
}

export function useTargets() {
  // example targets
  // { name: '2P', moving: true, notes: "", refresh: true, selected: false, plot: true },
  // { name: '16 Cyg', moving: false, ra: new Angle(0), dec: new Angle(0), mV: 7, notes: "", refresh: true, selected: false, plot: true }

  const savedTargets = readCookie("local", "targets", [])
    .map(
      (target) => ({
        ...target,
        ra: new Angle(target.ra),
        dec: new Angle(target.dec),
        refresh: true
      })
    );

  const [targets, targetDispatch] = React.useReducer(targetsReducer, savedTargets);
  return [targets, targetDispatch];
}