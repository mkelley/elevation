import React from "react";
import Angle from "../model/Angle";

export default function EditableTarget({ add, cancel, allTargetNames }) {
  const [name, setName] = React.useState("");
  const [moving, setMoving] = React.useState(true);
  const [plot, setPlot] = React.useState(true);
  const [ra, setRA] = React.useState("");
  const [dec, setDec] = React.useState("");
  const [mV, setMV] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const nameError = allTargetNames.includes(name);

  const handleAdd = () => {
    const target = {
      name: name,
      plot: plot,
      moving: moving,
      ra: moving ? null : new Angle(ra || 0, 'hr'),
      dec: moving ? null : new Angle(dec || 0, 'deg'),
      mV: moving ? null : mV,
      notes: notes,
      refresh: true,
      selected: false
    }
    add(target);
  };

  return (
    <tr>
      <td>
        <button onClick={handleAdd} disabled={name === ""}>Add</button><br />
        <button onClick={cancel}>Cancel</button>
      </td>
      <td>
        <input
          type="checkbox"
          checked={plot}
          onChange={() => setPlot(!plot)} />
      </td>
      <td>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ background: nameError ? '#faa' : null }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={moving}
          onChange={() => setMoving(!moving)} />
      </td>
      <td>
        {!moving &&
          <input
            type="text"
            value={ra}
            onChange={(event) => setRA(event.target.value)}
            style={{ width: "5em" }}
          />
        }
      </td>
      <td>
        {!moving &&
          <input
            type="text"
            value={dec}
            onChange={(event) => setDec(event.target.value)}
            style={{ width: "5em" }}
          />
        }
      </td>
      <td></td>
      <td></td>
      <td>
        {!moving &&
          <input
            type="number"
            value={mV}
            onChange={(event) => setMV(event.target.value)}
            style={{ width: "3em" }}
          />
        }
      </td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td>
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </td>
    </tr>
  );
}