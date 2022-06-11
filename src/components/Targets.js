import React from "react";
import EditableTarget from "./EditableTarget";
import Target from "./Target";


// Targets are rendered as a table
export default function Targets({ observer, targets, targetDispatch, addMessage, isUTC }) {
  const updateTarget = (newTarget, index) => {
    targetDispatch({
      type: 'update',
      target: newTarget,
      index
    })
  }

  const updateSelected = (selected, index) => {
    targetDispatch({
      type: 'update',
      target: {
        ...targets[index],
        selected
      },
      index
    });
  }

  const updatePlot = (plot, index) => {
    targetDispatch({
      type: 'update',
      target: {
        ...targets[index],
        plot
      },
      index
    });
  }

  const addTarget = (newTarget, index) => {
    if (targets.map((target) => target.name).includes(newTarget.name))
      addMessage({ severity: 'error', text: `${newTarget.name} is already defined.` });
    else
      targetDispatch({
        type: 'update',
        target: newTarget,
        index
      });
  }

  const cancelAddTarget = (index) => {
    targetDispatch({
      type: 'delete',
      index
    });
  }

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
            <th>Plot</th>
            <th style={{ width: "12em" }}>Target</th>
            <th>Moving</th>
            <th>RA (hr)</th>
            <th>Dec (&deg;)</th>
            <th>&mu; (''/hr)</th>
            <th>b (&deg;)</th>
            <th>m<sub>V</sub></th>
            <th>FoM</th>
            <th>r<sub>h</sub> (au)</th>
            <th>&Delta; (au)</th>
            <th>Phase (&deg;)</th>
            <th>Sol. Elong. (&deg;)</th>
            <th>Lun. Elong. (&deg;)</th>
            <th>Transit ({isUTC ? "UTC" : "CT"})</th>
            <th>&lt;AM limit (hr)</th>
            <th>and dark (hr)</th>
            <th style={{ width: "10em" }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {observer && targets.map((target, index) => {
            if (target === 'new') {
              return <EditableTarget
                key={index}
                index={index}
                add={(newTarget) => addTarget(newTarget, index)}
                cancel={() => cancelAddTarget(index)}
              />;
            } else {
              return (
                <Target
                  key={index}
                  index={index}
                  observer={observer}
                  onTargetUpdate={updateTarget}
                  onChangeSelect={updateSelected}
                  onChangePlot={updatePlot}
                  target={target}
                  isUTC={isUTC}
                />);
            }
          })}
        </tbody>
      </table>

      <div className="elevation-ui">
        <p><button onClick={() => targetDispatch({ type: 'append', target: 'new' })}>New target</button></p>
      </div>
    </div >
  );
}