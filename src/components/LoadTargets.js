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

const lookTargets = `
# Target, Type, RA, Dec, mV, Notes
2005 QN173,m,,,,LOOK
2060,m,,,,LOOK
7P,m,,,,LOOK
29P,m,,,,LOOK
57P,m,,,,LOOK
67P,m,,,,LOOK
97P,m,,,,LOOK
108P,m,,,,LOOK
141P,m,,,,LOOK
156P,m,,,,LOOK
191P,m,,,,LOOK
382P,m,,,,LOOK
C/2014 UN271,m,,,,LOOK
C/2017 K2,m,,,,LOOK
C/2018 F4-A,m,,,,LOOK
C/2019 F1,m,,,,LOOK
C/2019 L3,m,,,,LOOK
C/2019 U5,m,,,,LOOK
C/2020 O2,m,,,,LOOK
C/2020 R4,m,,,,LOOK
C/2020 R7,m,,,,LOOK
C/2020 T2,m,,,,LOOK
C/2020 U4,m,,,,LOOK
C/2021 A1,m,,,,LOOK
C/2021 C4,m,,,,LOOK
C/2021 C5,m,,,,LOOK
C/2021 E3,m,,,,LOOK
C/2021 G2,m,,,,LOOK
C/2021 K2,m,,,,LOOK
C/2021 K3,m,,,,LOOK
C/2021 O3,m,,,,LOOK
C/2021 P4,m,,,,LOOK
C/2021 Q4,m,,,,LOOK
C/2021 R2,m,,,,LOOK
C/2021 S3,m,,,,LOOK
C/2021 T4,m,,,,LOOK
C/2021 Y1,m,,,,LOOK
C/2022 A2,m,,,,LOOK
C/2022 A3,m,,,,LOOK
C/2022 E2,m,,,,LOOK
C/2022 E3,m,,,,LOOK
C/2022 F1,m,,,,LOOK
`.trim();

const ldtTargets = `
# Target, Type, RA, Dec, mV, Notes
12P,m,,,,2022B
73P,m,,,,2022B
81P,m,,,,2022B
169P,m,,,,2022B
238P,m,,,,2022B
C/2017 K2,m,,,,2022B
C/2019 O3,m,,,,2022B
C/2020 K1,m,,,,2022B
C/2020 U5,m,,,,2022B
C/2021 T4,m,,,,2022B
C/2022 A2,m,,,,2022B
C/2022 E3,m,,,,2022B
`.trim();

const cometaryOrbitalTrends = `
# Target, Type, RA, Dec, mV, Notes
2P,m,,,,Orbital Trends
6P,m,,,,Orbital Trends
9P,m,,,,Orbital Trends
10P,m,,,,Orbital Trends
15P,m,,,,Orbital Trends
19P,m,,,,Orbital Trends
22P,m,,,,Orbital Trends
46P,m,,,,Orbital Trends
67P,m,,,,Orbital Trends
71P,m,,,,Orbital Trends
73P,m,,,,Orbital Trends
81P,m,,,,Orbital Trends
88P,m,,,,Orbital Trends
103P,m,,,,Orbital Trends
C/2012 K1,m,,,,Orbital Trends
C/2013 A1,m,,,,Orbital Trends
C/2013 US10,m,,,,Orbital Trends
C/2013 X1,m,,,,Orbital Trends
C/2014 Q2,m,,,,Orbital Trends
C/2014 Q3,m,,,,Orbital Trends
C/2015 V2,m,,,,Orbital Trends
C/2015 VL62,m,,,,Orbital Trends
C/2016 M1,m,,,,Orbital Trends
C/2017 K2,m,,,,Orbital Trends
`.trim();

const jwstCycle1 = `
# Target, Type, RA, Dec, mV, Notes
9P,m,,,,Organics
22P,m,,,,GTO
238P,m,,,,GTO
29P,m,,,,Centaurs
39P,m,,,,Centaurs
423P,m,,,,Centaurs (nee P/2008 CL94)
C/2014 OG392,m,,,,Centaurs
P/2019 LD2,m,,,,Centaurs
C/2004 A1,m,,,,Centaurs
C/2017 K2,m,,,,Organics
`.trim();

const hbStandards = `
# HB filter B-type flux standards, Farnham et al. 2000
# Target, Type, RA, Dec, mV, Notes
  3379, f, 00:36:47.24, +15:13:54.5, 5.89, variable (Δm<0.05)
  6815, f, 01:08:55.72, +09:43:49.4, 7.30,
 14951, f, 02:24:48.92, +10:36:38.9, 5.46,
 19712, f, 03:10:18.03, -01:41:40.7, 7.35,
 26912, f, 04:15:31.93, +08:53:33.5, 4.27,
 31331, f, 04:54:50.63, +00:28:02.6, 5.99,
 37112, f, 05:36:03.50, -00:46:48.6, 8.02, nearby bright star: 1.7 mag | 142'' E / 1518'' S
 52266, f, 07:00:21.05, -05:49:36.7, 7.23,
 68099, f, 08:11:16.56, +09:49:16.9, 6.07,
 72526, f, 08:33:25.29, -00:18:29.1, 7.93,
 74280, f, 08:43:13.48, +03:23:55.2, 4.30, variable (Δm<0.05)
 89688, f, 10:21:01.97, +02:17:23.1, 6.68, variable (Δm<0.05) | nearby star: 8.9 mag | 200'' W / 220'' N
 97991, f, 11:16:11.55, -03:28:19.6, 7.41, nearby bright star: 4.6 mag | 420'' E / 645'' S
120086, f, 13:47:19.13, -02:26:36.8, 7.90, variable (Δm<0.05)
129956, f, 14:45:30.26, +00:43:02.8, 5.70,
149363, f, 16:34:28.22, -06:08:09.4, 7.80,
154445, f, 17:05:32.14, -00:53:31.6, 5.64,
164852, f, 18:02:22.98, +20:50:01.3, 5.27,
170783, f, 18:31:04.35, +04:37:37.4, 7.73,
187350, f, 19:49:33.40, -01:06:03.1, 8.14, emission line star
191263, f, 20:08:38.16, +10:43:32.5, 6.33,
205130, f, 21:33:35.23, -09:39:38.1, 7.88, nearby star: 9.2 mag | 325'' W / 156.5'' N
209008, f, 22:00:07.78, +06:43:02.1, 6.00,
219188, f, 23:14:00.48, +04:59:49.6, 7.05,
`.trim();

const delsantiAnalogs = `
# Collected solar analogs by Audrey Delsanti

# Binzel and Bus, used at IRTF and Palomar
SA 93-101,   f, 01:53:18.0, +00:22:25,  9.7
Hyades 64,   f, 04:26:40.1, +16:44:49,  8.1, used by VLT LP; HD 28099
SA 98-978,   f, 06:51:34.0, -00:11:33, 10.5
SA 102-1081, f, 10:57:04.4, -00:13:12,  9.9
BS 4486,     f, 11:38:44.8, +45:06:31,  6.4
SA 107-684,  f, 15:37:18.1, -00:09:50,  8.4
SA 107-998,  f, 15:38:16.4, +00:15:23, 10.4
SA 110-361,  f, 18:42:45.0, +00:08:04, 12.4
16 Cyg B,    f, 19:41:52.0, +50:31:03,  6.2, HD 186427		       
SA 112-1333, f, 20:43:11.8, +00:26:15, 10.0
SA 115-271,  f, 23:42:41.8, +00:45:14,  9.7


# From Hardop, solar analog stars
HD 1835,   f, 00:22:51.7, -12:12:34, 6.4,
HD 28099 (H),  f, 04:26:40.1, +16:44:49, 8.1, Hya 64
HD 44594,  f, 06:20:06.1, -48:44:28, 6.6,
HD 76151 (H),  f, 08:54:17.9, -05:26:04, 6.0,
HD 89010,  f, 10:16:32.3, +23:30:11, 5.9,
HD 144585, f, 16:07:03.3, -14:04:17, 6.3,
HD 159222, f, 17:32:00.9, +34:16:16, 6.6,
HD 181655, f, 19:19:38.9, +37:19:50, 6.3,
HD 186427 (H), f, 19:41:51.9, +50:31:03, 6.2, 16 Cyg B
HD 191854 (H), f, 20:10:13.3, +43:56:44, 7.4,

# Other very good and no so bright stars
Hyades 142, f, 04:46:30.0, +15:28:20.7, 8.3, HD 30246; used by VLT LP
HD44594,    f, 06:20:04.9, -48:44:14.6, 6.6,
HD144873,   f, 16:06:41.1, +34:06:01.6, 8.5,

# From James 'Gerbs' Bauer:
HD 2966  , f, 00 32 50.1, -13 15 27.5,  8.8, G5V; used by Hainaut
HD 1368	 , f, 00 17 54.6, +00 22 40.2,  8.9, F9V; well calibrated
HD 2141	 , f, 00 25 32.7, -16 08 00.0,  8.9, G3V
HD 147284, f, 16 21 55.4, -24 59 28.7,  8.8, G3V; confirmed
HD 148642, f, 16 30 34.0, -25 28 14.2,  8.7, F7V; no ext. according
HD 147935, f, 16 25 49.1, -27 49 09.2,  9.2, G5V
HD 218251, f, 23 06 39.2, -14 51 49.6,  9.2, G5V; companion 30 arcsec south
HD 210990, f, 22 14 24.2, -16 36 33.7,  9.5, G1V
HD 210078, f, 22 08 06.4, -11 53 00.3, 10.2, G3V; star 2.5 arcmin east
HD 209847, f, 22 06 41.4, -14 44 14.0,  9.8, G2V; used by Dotto/Barucci

# From Farnham et al. stars
HD 11131,  f, 01 49 23.4, -10 42 13, 6.8, G1V; nearby V=5 176´´E, 62´´N
HD 25680,  f, 04 05 20.3, +22 00 32, 5.9, G5V; (39 Tau); IHW; nearby V=9 1.2´´E 173´´N
HD 28099 (F),  f, 04 26 40.1, +16 44 49, 8.1, G2V; vB 64; IHW
HD 29461,  f, 04 38 57.3, +14 06 20, 8.0, G5V; vB 106; IHW
HD 30246,  f, 04 46 30.4, +15 28 19, 8.3, G5V; vB 142; IHW
HD 76151 (F),  f, 08 54 18.0, -05 26 05, 6.0, G3V; IHW
HD 81809,  f, 09 27 46.8, -06 04 17, 5.4, G2V
HD 146233, f, 16 15 36.4, -08 21 45, 5.5, G1V; 18 Sco
HD 186408, f, 19 41 48.9, +50 31 31, 6.0, G1.5V; 16 Cyg A; IHW; double system
HD 186427 (F), f, 19 41 52.0, +50 31 03, 6.2, G2.5V; 16 Cyg B; IHW; double system
HD 191854 (F), f, 20 10 13.3, +43 56 45, 7.4, G5V; IHW
HD 217014, f, 22 57 23.0, +20 46 07, 5.5, G2.5V; 51 Peg
`.trim();

export default function LoadTargets({ targets, targetDispatch, addMessage }) {
  const [targetTextArea, setTargetTextArea] = React.useState(`
# Target,        Type, RA,       Dec,       mV, Notes
2P/Encke,        m,    ,         ,          ,   classic
C/2022 E3 (ZTF), m
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
      <button onClick={addTargets}>Add targets</button>
      <input id="elevation-open-file" type="file" onChange={readFile} />
      <hr />
      <button onClick={() => setTargetTextArea(ldtTargets)}>LDT comets</button>
      <button onClick={() => setTargetTextArea(lookTargets)}>LOOK targets</button>
      <button onClick={() => setTargetTextArea(jwstCycle1)}>JWST Cycle 1 comets</button>
      <button onClick={() => setTargetTextArea(cometaryOrbitalTrends)}>Orbital Trends</button>
      <br />
      <button onClick={() => setTargetTextArea(hbStandards)}>HB filter standards</button>
      <button onClick={() => setTargetTextArea(delsantiAnalogs)}>Delsanti solar analog list</button>
    </div>

  </div>;
}