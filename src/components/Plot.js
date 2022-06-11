import moment from 'moment-timezone';
import React from 'react';
import Plot from 'react-plotly.js';
import Angle from '../model/Angle';
import AngleArray from '../model/AngleArray';

function guides(observer) {
  // if the number of guides is updated, then update the time marker useEffect
  const shapes = [];
  Array.prototype.push.apply(shapes, sunGuides(observer));
  Array.prototype.push.apply(shapes, airmassGuides());
  return shapes;
}

function sunGuides(observer) {
  const shade = {
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    y0: 0,
    y1: 1,
    fillcolor: '#87cefa',
    opacity: 0.2,
    line: { width: 0 }
  };

  const shapes = [
    ...[
      observer.sun.twilight.sunset,
      observer.sun.twilight.civilEnd,
      observer.sun.twilight.nauticalEnd,
      observer.sun.twilight.astronomicalEnd,
    ].map((t) => ({
      ...shade,
      x0: -12,
      x1: t.hr
    })),
    ...[
      observer.sun.twilight.sunrise,
      observer.sun.twilight.civilStart,
      observer.sun.twilight.nauticalStart,
      observer.sun.twilight.astronomicalStart,
    ].map((t) => ({
      ...shade,
      x0: t.hr,
      x1: 12
    }))
  ];

  return shapes;
}


function airmassGuides() {
  const shade = {
    type: 'rect',
    xref: 'paper',
    x0: 0,
    x1: 1,
    yref: 'y',
    y0: -90,
    fillcolor: '#e5a839',
    opacity: 0.15,
    line: { width: 0 }
  };
  // 19, 30, 50, 65 = 3, 2, 1.3, 1.1
  const shapes = [
    ...[19, 30, 50].map((alt) => ({
      ...shade,
      y1: alt
    }))
  ];
  return shapes;
}

function xticks(observer, isUTC) {
  if (!observer) {
    return {};
  }

  const tickvals = [];
  const ticklabels = [];

  for (let i = -12; i <= 12; i++) {
    tickvals.push(i);
    if (i < 0) {
      ticklabels.push(i + 24);
    } else {
      ticklabels.push(i);
    }
  }

  let t = new AngleArray(ticklabels, 'hr');
  if (isUTC) {
    t = t.add(new Angle(-observer.date.utcOffset() / 60, 'hr'));
  }
  const ticktext = t.clock();

  return { tickvals, ticktext };
}

function plotTarget(target) {
  return {
    name: target.name,
    x: target.civilTime.hr,
    y: target.elevation.deg,
    type: 'scatter',
    mode: 'lines',
    hoverinfo: 'text',
    text: target.airmass.map((a) => (target.name + ', ' + a.toFixed(2)))
  };
}

export default function ElevationPlot({ observer, targets, isUTC }) {
  const [shapes, setShapes] = React.useState([]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      if (shapes.length < 10) {
        // guides are not yet added
        setShapes(shapes);
        return;
      }

      const time = new Angle(
        moment().tz(observer.date ? observer.date.format('z') : '').format('hh:mm:ss'), 'hr');
      const x = (time.hr > 12) ? (time.hr - 24) : time.hr;
      const newShapes = [...shapes];

      if (newShapes.length > 11) {
        newShapes.splice(11);
      }
      newShapes.push({
        type: 'line',
        xref: 'x',
        x0: x,
        x1: x,
        yref: 'paper',
        y0: 0,
        y1: 1,
        opacity: 0.33,
        line: {
          width: 1,
          color: 'red'
        }
      });
      setShapes(newShapes);
    }, 3000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
    // add shapes as a dependency to re-rerun the effect
    // when we update it
  }, [shapes, observer]);

  React.useEffect(() => {
    if (observer && observer.sun) {
      setShapes(guides(observer));
    }
  }, [observer])

  const data = targets.filter((target) => target.plot && target.civilTime)
    .map((target) => plotTarget(target));

  const layout = {
    title: {
      text: observer && observer.observatory + ' / '
        + observer.date.toISOString().substring(0, 10)
    },
    xaxis: {
      title: isUTC ? 'Time (UTC)' : 'Time (CT)',
      range: [-7, 7],
      tickmode: "array",
      ...xticks(observer, isUTC)
    },
    yaxis: {
      title: 'Elevation (°)',
      range: [10, 90],
    },
    margin: {
      t: 50,
      b: 60,
      l: 50,
      r: 50,
    },
    hovermode: 'closest',
    showlegend: true,
    shapes: shapes,
    uirevision: true,
    autosize: true,
  };

  return (
    <div id="elevation-plot-area">
      <div style={{ margin: "5px 5px 0 0", height: "65vh" }}>
        <Plot
          useResizeHandler={true}
          style={{ width: 'clac(100% - 10px)', height: '100%' }}
          layout={layout}
          data={data}
        />
      </div>
      <p className="small">
        Airmass guides at 1.3, 2, and 3; Sky brightness
        guides at astronomical twilight, nautical twilight, civil
        twilight, and daylight.
      </p>
    </div >
  );
}