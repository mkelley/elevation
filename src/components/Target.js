import React from "react";
import Angle from "../model/Angle";
import { eq2gal, figureOfMerit, elevation } from "../util";
import useMpcEphemerisService from "../services/mpc";

/**
 * Targets render themselves as table rows
 */
export default function Target({ index, target, observer, onChangeSelect, onChangePlot, onTargetUpdate, isUTC }) {
  const timeOffset = isUTC
    ? new Angle(-observer.date.utcOffset() / 60, 'hr')
    : new Angle(0);

  const onEphemerisSuccess = (ephemeris) => {
    if (ephemeris)
      onTargetUpdate({
        ...target,
        ...ephemeris,
        ...elevation(ephemeris, observer),
        refresh: false
      }, index);
  };
  useMpcEphemerisService(target, observer, onEphemerisSuccess, true);

  React.useEffect(() => {
    if (target.ra && observer) {
      onTargetUpdate({
        ...target,
        ...elevation(target, observer),
        refresh: false
      }, index);
    }
  }, [observer]);

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={target.selected}
          onChange={() => onChangeSelect(!target.selected, index)} />
      </td>
      <td>
        <input
          type="checkbox"
          checked={target.plot}
          onChange={() => onChangePlot(!target.plot, index)} />
      </td>
      <td>{target.name}</td>
      <td>
        <input
          type="checkbox"
          checked={target.moving}
          readOnly
        />
      </td>
      <td>{target.ra && target.ra.hms()}</td>
      <td>{target.dec && target.dec.dms()}</td>
      <td>{target.properMotion && target.properMotion.toFixed(0)}</td>
      <td>{target.ra && target.dec && eq2gal(target.ra, target.dec).b.deg.toFixed(0)}</td>
      <td>{target.mV}</td>
      <td>{target.rh && target.delta && target.mV && figureOfMerit(target.rh, target.delta, target.mV).toFixed(2)}</td>
      <td>{target.rh}</td>
      <td>{target.delta}</td>
      <td>{target.phase}</td>
      <td>{target.solarElongation}</td>
      <td>{target.lunarElongation}</td>
      <td>{target.transitTime && target.transitTime.add(timeOffset).clock()}</td>
      <td>{target.timeAboveElevationLimit && target.timeAboveElevationLimit.hm(2)}</td>
      <td>{target.timeAboveElevationLimitAndDark && target.timeAboveElevationLimitAndDark.hm(2)}</td>
      <td>{target.notes}</td>
    </tr>
  );
}
