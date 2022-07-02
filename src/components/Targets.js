import React from "react";
import EditableTarget from "./EditableTarget";
import Target from "./Target";
import { eq2gal, figureOfMerit } from "../util";
import { useCookieState } from "../services/cookies";

// Targets are rendered as a table
export default function Targets({ observer, targets, targetDispatch, addMessage, isUTC }) {
  const [ephemerisSource, setEphemerisSource] = useCookieState("session", "ephemerisSource", "mpc");
  const [sortBy, setSortBy] = React.useState(null);

  const updateTarget = (newTarget, index) => {
    targetDispatch({
      type: 'update',
      target: newTarget,
      index
    })
  };

  const updateSelected = (selected, index) => {
    targetDispatch({
      type: 'update',
      target: {
        ...targets[index],
        selected
      },
      index
    });
  };

  const updatePlot = (plot, index) => {
    targetDispatch({
      type: 'update',
      target: {
        ...targets[index],
        plot
      },
      index
    });
  };

  const addTarget = (newTarget, index) => {
    if (targets.map((target) => target.name).includes(newTarget.name)) {
      addMessage({ severity: 'error', text: `${newTarget.name} is already defined.` });
      targetDispatch({
        type: 'update',
        target: { ...newTarget, error: true },
        index
      });
    } else {
      targetDispatch({
        type: 'update',
        target: newTarget,
        index
      });
    }
  };

  const cancelAddTarget = (index) => {
    targetDispatch({
      type: 'delete',
      index
    });
  };

  const changeSelection = (event) => {
    switch (event.target.value) {
      case "all":
      case "none":
      case "inverted":
      case "less-than-airmass-limit":
      case "greater-than-airmass-limit":
      case "dark":
      case "not-dark":
        targetDispatch({ type: 'select-' + event.target.value, })
        break;
      default:
    }
  };

  const changeEphemerisSource = (event) => {
    setEphemerisSource(event.target.value);
    targetDispatch({ type: 'refresh' });
  };

  const changeSort = (event) => {
    const sortKey = event.target.dataset.sortKey;
    if (sortBy === null)
      setSortBy({ key: sortKey, direction: 'asc' });
    else if (sortBy.key !== sortKey)
      setSortBy({ key: sortKey, direction: 'asc' });
    else if (sortBy.direction === 'asc')
      setSortBy({ key: sortKey, direction: 'desc' });
    else
      setSortBy(null);
  };

  const sortTargets = (a, b) => {
    if (sortBy === null) {
      return null;
    }

    const direction = (sortBy.direction === 'asc') ? 1 : -1;

    let A, B;
    if (["name", "notes"].includes(sortBy.key)) {
      // string comparison
      return direction * a[sortBy.key].localeCompare(b[sortBy.key], 'en', { numeric: true, sensitivity: 'base' })
    } else if (sortBy.key === "b") {
      A = eq2gal(a.ra, a.dec).b.rad;
      B = eq2gal(b.ra, b.dec).b.rad;
    } else if (sortBy.key === "fom") {
      A = a.rh && a.delta && a.mV && figureOfMerit(a.rh, a.delta, a.mV);
      B = b.rh && b.delta && b.mV && figureOfMerit(b.rh, b.delta, b.mV);
    } else if (["ra", "dec", "transitTime", "timeAboveElevationLimit", "timeAboveElevationLimitAndDark"]
      .includes(sortBy.key)) {
      A = a[sortBy.key] && a[sortBy.key].rad;
      B = b[sortBy.key] && b[sortBy.key].rad;
    } else {
      A = a[sortBy.key];
      B = b[sortBy.key];
    }
    return direction * (A - B);
  }

  const sortedTargets = [...targets]
    .map((target, index) => ({ ...target, index }))
    .sort(sortTargets);

  return (
    <div className="box overflowx" id="elevation-target-table-box">
      <h2>Target table</h2>

      <div className="elevation-ui" id="elevation-target-table-control">
        <select id="elevation-row-selection" value="select" onChange={changeSelection}>
          <option value="select">Select...</option>
          <option value="all">All</option>
          <option value="none">None</option>
          <option value="inverted">Inverted</option>
          <option value="less-than-airmass-limit">Airmass &lt; limit</option>
          <option value="greater-than-airmass-limit">Airmass &gt; limit</option>
          <option value="dark">Night time &gt; 0</option>
          <option value="not-dark">Night time == 0</option>
        </select>
        <button onClick={() =>
          targetDispatch({
            type: 'delete targets',
            targets: targets.filter((target) => target.selected)
          })}>
          Delete selected
        </button>
        <button onClick={() => targetDispatch({ type: 'plot selected' })}>Plot selected</button>
        <button onClick={() => targetDispatch({ type: 'do not plot selected' })}>Do not plot selected</button>
        <button onClick={() => targetDispatch({ type: 'clear plot' })}>Clear plot</button>
      </div>

      <table id="elevation-target-table">
        <thead>
          <tr>
            <th style={{ width: "1em" }}></th>
            <th data-sort-key="plot" onClick={changeSort}>Plot</th>
            <th data-sort-key="name" onClick={changeSort} style={{ width: "12em" }}>Target</th>
            <th data-sort-key="moving" onClick={changeSort}>Moving</th>
            <th data-sort-key="ra" onClick={changeSort}>RA (hr)</th>
            <th data-sort-key="dec" onClick={changeSort}>Dec (&deg;)</th>
            <th data-sort-key="properMotion" onClick={changeSort}>&mu; (''/hr)</th>
            <th data-sort-key="b" onClick={changeSort}>b (&deg;)</th>
            <th data-sort-key="mV" onClick={changeSort}>m<sub>V</sub></th>
            <th data-sort-key="fom" onClick={changeSort}>FoM</th>
            <th data-sort-key="rh" onClick={changeSort}>r<sub>h</sub> (au)</th>
            <th data-sort-key="delta" onClick={changeSort}>&Delta; (au)</th>
            <th data-sort-key="phase" onClick={changeSort}>Phase (&deg;)</th>
            <th data-sort-key="solarElongation" onClick={changeSort}>Sol. Elong. (&deg;)</th>
            <th data-sort-key="lunarElongation" onClick={changeSort}>Lun. Elong. (&deg;)</th>
            <th data-sort-key="transitTime" onClick={changeSort}>Transit ({isUTC ? "UTC" : "CT"})</th>
            <th data-sort-key="timeAboveElevationLimit" onClick={changeSort}>&lt;AM limit (hr)</th>
            <th data-sort-key="timeAboveElevationLimitAndDark" onClick={changeSort}>and dark (hr)</th>
            <th data-sort-key="notes" onClick={changeSort} style={{ width: "10em" }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {observer && sortedTargets.map((target) => {
            if (target.name === '__new__') {
              return <EditableTarget
                key={target.index}
                index={target.index}
                add={(newTarget) => addTarget(newTarget, target.index)}
                cancel={() => cancelAddTarget(target.index)}
                allTargetNames={targets.map((target) => target.name)}
              />;
            } else {
              return (
                <Target
                  key={target.index}
                  index={target.index}
                  observer={observer}
                  onTargetUpdate={updateTarget}
                  onChangeSelect={updateSelected}
                  onChangePlot={updatePlot}
                  target={target}
                  isUTC={isUTC}
                  ephemerisSource={ephemerisSource}
                  addMessage={addMessage}
                />);
            }
          })}
        </tbody>
      </table>

      <div className="elevation-ui">
        <p>
          <button onClick={() => targetDispatch({ type: 'append', target: { name: '__new__' } })}>New target</button>
        </p>
        <p>
          {"Ephemerides from: "}
          <select value={ephemerisSource} onChange={changeEphemerisSource}>
            <option value='mpc'>Minor Planet Center</option>
            <option value='debug'>None (debug mode)</option>
          </select>
        </p>
      </div>
    </div >
  );
}