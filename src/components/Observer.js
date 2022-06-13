import moment from "moment-timezone";
import React from "react";
import Angle from "../model/Angle";
import { elevation, solarEphemeris, airmassToElevation } from "../util";

const observatories = {
  DCT: {
    longitude: -111.4223,
    latitude: 34.7444,
    altitude: 2360,
    timezone: 'US/Arizona'
  },
  Oukaïmeden: {
    longitude: -7.85389,
    latitude: 31.1942,
    altitude: 2700,
    timezone: "Africa/Casablanca"
  },
  "La Palma": {
    longitude: -17.8925,
    latitude: 28.7569,
    altitude: 2396,
    timezone: "Atlantic/Canary"
  },
  UMD: {
    longitude: -76.9561,
    latitude: 39.0020,
    altitude: 53,
    timezone: "US/Eastern"
  },
  VLT: {
    longitude: -70.7394,
    latitude: -29.2547,
    altitude: 2400,
    timezone: "America/Santiago"
  },
  "La Silla": {
    longitude: -70.8009,
    latitude: -30.1716,
    altitude: 2200,
    timezone: "America/Santiago"
  },
  CTIO: {
    longitude: -70.8009,
    latitude: -30.1716,
    altitude: 2200,
    timezone: "America/Santiago"
  },
  McDonald: {
    longitude: -104.0248,
    latitude: 30.6797,
    altitude: 2070,
    timezone: "US/Central"
  },
  MKO: {
    longitude: -155.4681,
    latitude: 19.8208,
    altitude: 4205,
    timezone: "US/Hawaii"
  },
  Xingming: {
    longitude: 87.17767,
    latitude: 43.47083,
    altitude: 2080,
    timezone: "Asia/Shanghai"
  },
  "Mt. John": {
    longitude: 170.465,
    latitude: -43.98667,
    altitude: 1029,
    timezone: "Pacific/Auckland"
  },
  custom: null
};

export default function Observer({ observer, setObserver, isUTC, setIsUTC }) {
  const [observatory, setObservatory] = React.useState('DCT');
  const [airmassLimit, setAirmassLimit] = React.useState(2);
  const [editable, setEditable] = React.useState(false);

  // use a local state so that custom updates do not fetch ephemerides as users type
  const [customObserver, setCustomObserver] = React.useState({
    date: moment().toISOString().substring(0, 10),
    elevationLimit: airmassToElevation(airmassLimit),
    observatory: observatory,
    ...observatories['DCT']
  });

  const onChange = (event) => {
    let property = event.target.name;
    let value = event.target.value;

    if (property === 'airmassLimit') {
      property = 'elevationLimit';
      const am = parseFloat(event.target.value);
      setAirmassLimit(am);
      value = airmassToElevation(am);
    }

    const newObserver = {
      ...customObserver,
      [property]: value
    };
    setCustomObserver(newObserver);

    // defer propagating updates back up except for elevationLimit and date:
    if (['elevationLimit', 'date'].includes(property))
      updateObserver(newObserver);
  }

  const onObservatoryChange = (event) => {
    const name = event.target.value;
    setObservatory(name);
    setEditable(name === 'custom');
    if (name !== 'custom') {
      const updatedObserver = {
        ...customObserver,
        ...observatories[name]
      };
      setCustomObserver(updatedObserver);
      updateObserver(updatedObserver);
    }
  }

  const updateObserver = (updatedObserver) => {
    // propagate updates back up
    const newObserver = {
      date: moment.tz(updatedObserver.date, updatedObserver.timezone),
      latitude: new Angle(parseFloat(updatedObserver.latitude), 'deg'),
      longitude: new Angle(parseFloat(updatedObserver.longitude), 'deg'),
      altitude: parseInt(updatedObserver.altitude),
      elevationLimit: updatedObserver.elevationLimit,
      observatory: observatory
    };
    newObserver.sun = elevation(solarEphemeris(newObserver.date), newObserver);
    setObserver(newObserver);
  };

  React.useEffect(() => {
    // set the default observatory the first time this component is defined
    if (!observer)
      updateObserver(customObserver);
  });

  const timeOffset = observer && isUTC
    ? new Angle(-observer.date.utcOffset() / 60, 'hr')
    : new Angle(0);
  const sunset = observer && observer.sun.twilight.sunset.add(timeOffset).clock();
  const atSet = observer && observer.sun.twilight.astronomicalEnd.add(timeOffset).clock();
  const atRise = observer && observer.sun.twilight.astronomicalStart.add(timeOffset).clock();
  const sunrise = observer && observer.sun.twilight.sunrise.add(timeOffset).clock();

  return (
    <div className="box">
      <h2>Observer</h2>
      <div style={{ display: "flex" }}>
        <div>
          <p>
            Date:
            <input
              type="date"
              name="date"
              value={customObserver.date}
              onChange={onChange}
            />
          </p>
          <p>
            <label>Table airmass limit:
              <input
                type="number"
                name="airmassLimit"
                id="elevation-airmassLimit"
                min="1.0"
                max="10"
                step="0.1"
                value={airmassLimit}
                onChange={onChange}
              />
              {" = "} {customObserver.elevationLimit.deg.toFixed(0)}&deg; elevation.
            </label>
          </p>
          <p>
            Location:
            <select
              name="observatory"
              className="observatory"
              value={observatory}
              onChange={onObservatoryChange}
            >
              {Object.keys(observatories).map((name) =>
                <option key={name} value={name}>{name}</option>
              )}
            </select>
            <input
              name="latitude"
              className="latlon"
              type="number"
              min="-90"
              max="+90"
              value={customObserver.latitude}
              onChange={onChange}
              disabled={!editable}
              style={{ width: "6em" }}
            />&deg;N
            <input
              name="longitude"
              className="latlon"
              type="number"
              min="-360"
              max="+360"
              value={customObserver.longitude}
              onChange={onChange}
              disabled={!editable}
              style={{ width: "6em" }}
            />&deg;E
            <input
              name="altitude"
              className="alt"
              type="number"
              min="0"
              step="1"
              value={customObserver.altitude}
              onChange={onChange}
              disabled={!editable}
              style={{ width: "6em" }}
            />&nbsp;m
            <select
              name="timezone"
              className="timezone"
              value={customObserver.timezone}
              onChange={onChange}
              disabled={!editable}
            >
              {moment.tz.names().map((timezone) =>
                <option key={timezone} value={timezone}>{timezone}</option>)}
            </select>
            {(observatory === 'custom') &&
              <button style={{ margin: "5px" }} onClick={() => updateObserver(customObserver)}>
                Update
              </button>
            }
          </p>
          <p>
            <input
              type="checkbox"
              id="elevation-xaxis-ut"
              checked={isUTC}
              onChange={() => setIsUTC(!isUTC)} />
            Show times as UTC
          </p>
        </div>
        <div style={{ flexGrow: 1 }}>
          <table style={{ float: "right" }}>
            <tbody>
              <tr><td></td><td>{isUTC ? "(UTC)" : "(CT)"}</td></tr>
              <tr><td>Sunset</td><td>{sunset}</td></tr>
              <tr><td>Twilight end</td><td>{atSet}</td></tr>
              <tr><td>Twilight start</td><td>{atRise}</td></tr>
              <tr><td>Sunrise</td><td>{sunrise}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}