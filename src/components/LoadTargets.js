import React from 'react';
import { animateScroll as scroll } from 'react-scroll/modules';
import Angle from '../model/Angle';

function textToTargets(text) {
  const targets = text.split("\n")
    .map((row) => row.trim())
    .filter((row) => row[0] !== "#")
    .filter((row) => row !== "")
    .map((row) => {
      const cols = row.split(',').map((col) => col.trim());
      return {
        name: cols[0],
        moving: cols[1] === 'm',
        ra: (!cols[2] || cols[2] === "") ? "" : new Angle(cols[2], 'hr'),
        dec: (!cols[3] || cols[3] === "") ? "" : new Angle(cols[3], 'deg'),
        mV: cols[4] || "",
        notes: cols[5] || "",
        selected: false,
        plot: true,
        refresh: true,
      }
    })
  return targets;
}

export default function LoadTargets({ targets, targetDispatch, addMessage }) {
  const [targetTextArea, setTargetTextArea] = React.useState(`
# Target,        Type, RA,       Dec,       mV, Notes
2P/Encke,        m,    ,         ,          ,   classic
C/2021 E3 (ZTF), m
16 Cyg B,        f,    19 41 52, +50 31 03, 6,  G3V
`.trim());

  const readFile = (event) => {
    event.preventDefault();
    const reader = new FileReader();
    reader.onload = (f) => {
      setTargetTextArea(f.target.result);
    };
    reader.readAsText(event.target.files[0]);
  };

  const addTargets = () => {
    let error = false;
    const newTargets = textToTargets(targetTextArea);
    const targetNames = targets.map((target) => target.name);

    const repeatedTargets = newTargets.filter((target) =>
      newTargets.filter((t) => target.name === t.name).length > 1
    );
    if (repeatedTargets.length) {
      addMessage({
        severity: 'error',
        text: 'Error, text area has duplicate target names: '
          + repeatedTargets.map((target) => target.name).join(', ')
      });
      error = true;
    }

    const duplicateTargets = newTargets.filter((target) => targetNames.includes(target.name));
    if (duplicateTargets.length) {
      addMessage({
        severity: 'error',
        text: 'Error, text area and table must have unique target names: '
          + duplicateTargets.map((target) => target.name).join(', ')
      });
      error = true;
    }

    if (!error && newTargets.length) {
      targetDispatch({ type: 'append targets', targets: newTargets });
      addMessage({
        severity: 'info',
        text: `Added: ${newTargets.map((target) => target.name).join(', ')}.`
      });
    }

    const position = error
      ? document.getElementById('elevation-console').offsetTop
      : document.getElementById('elevation-plot-area').offsetTop;
    scroll.scrollTo(position, {
      duration: 1000,
      delay: 50,
      smooth: 'easeInOutQuint'
    });
  }

  return <div className="box elevation-ui">
    <h2>Load targets</h2>
    <ul>
      <li>Columns: Target, Type, RA, Dec, mV, Notes.</li>
      <li>Type: m for a moving target.</li>
      <li>RA and Dec may be any sensible format, e.g., -12, -12d 34m,
        12h34m56s, 12:34:56.78.</li>
      <li>RA and Dec is ignored for Solar System targets.</li>
    </ul>

    <div id='elevation-load-target-control'>
      <textarea
        rows="20"
        cols="72"
        value={targetTextArea}
        onChange={(event) => setTargetTextArea(event.target.value)}
      />
      <br />
      <input id="elevation-open-file" type="file" onChange={readFile} /><br />
      <button onClick={addTargets}>Add targets</button>
    </div>
  </div>;
}