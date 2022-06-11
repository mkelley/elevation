import React from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import Console from './components/Console';
import Observer from './components/Observer';
import LoadTargets from './components/LoadTargets';
import Plot from './components/Plot';
import Targets from './components/Targets';
import './App.css';
import Angle from './model/Angle';
import { elevation } from './util';

const queryClient = new QueryClient()

function targetsReducer(targets, action) {
  switch (action.type) {
    case 'append': {
      return [...targets, action.target];
    }
    case 'update': {
      const updatedTargets = [...targets];
      updatedTargets[action.index] = action.target;
      return updatedTargets;
    }
    case 'delete': {
      const updatedTargets = [...targets];
      updatedTargets.splice(action.index, 1);
      return updatedTargets;
    }
    case 'delete targets': {
      const names = action.targets.map((target) => target.name);
      return targets.filter((target) => !names.includes(target.name));
    }
    case 'delete all': {
      return [];
    }
    case 'clear plot': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: false }
      );
    }
    case 'plot selected': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: target.selected || target.plot }
      );
    }
    case 'do not plot selected': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, plot: target.selected ? false : target.plot }
      );
    }
    case 'refresh': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, refresh: true }
      );
    }
    case 'select-all': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: true }
      );
    }
    case 'select-none': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: false }
      );
    }
    case 'select-inverted': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: !target.selected }
      );
    }
    case 'select-less-than-airmass-limit': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimit > 0 }
      );
    }
    case 'select-greater-than-airmass-limit': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimit.rad === 0 }
      );
    }
    case 'select-dark': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimitAndDark > 0 }
      );
    }
    case 'select-not-dark': {
      return targets.map((target) =>
        (target === 'new') ? target : { ...target, selected: target.timeAboveElevationLimitAndDark.rad === 0 }
      );
    }
    case 'refresh-observer': {
      return targets.map((target) => {
        if (target === 'new') {
          return target;
        } else if (target.moving) {
          // ephemeris service update may be needed, let Target manage that
          return { ...target, refresh: true };
        } else {
          // fixed targets just need to update elevation properties
          return { ...target, ...elevation(target, action.observer) }
        }
      })
    }
    default:
      throw new Error();
  }
}

function App() {
  const [isUTC, setIsUTC] = React.useState(false);
  const [messages, setMessages] = React.useState([{
    severity: "info",
    date: new Date(),
    text: <span>Using the Minor Planet Center's <a href="https://minorplanetcenter.net/iau/MPEph/MPEph.html">Ephemeris Service</a>.</span>
  }]);
  const [observer, setObserverState] = React.useState(null);
  const [targets, targetDispatch] = React.useReducer(targetsReducer, [
    { name: '2P', moving: true, notes: "", refresh: true, selected: false, plot: true },
    { name: '16 Cyg', moving: false, ra: new Angle(0), dec: new Angle(0), mV: 7, notes: "", refresh: true, selected: false, plot: true }
  ]);

  const setObserver = (newObserver) => {
    setObserverState(newObserver);
    targetDispatch({ type: 'refresh-observer', observer: newObserver });
  };

  const addMessage = (message) => {
    setMessages([{ date: new Date(), ...message }, ...messages]);
    document.getElementById('elevation-console').scroll(0, 0);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <h1>Elevation</h1>
        <Plot observer={observer} targets={targets} isUTC={isUTC} />
        <Console messages={messages} />
        <Targets observer={observer} targets={targets} targetDispatch={targetDispatch} addMessage={addMessage} isUTC={isUTC} />
        <Observer observer={observer} setObserver={setObserver} isUTC={isUTC} setIsUTC={setIsUTC} />
        <LoadTargets targets={targets} targetDispatch={targetDispatch} addMessage={addMessage} />
      </div>
    </QueryClientProvider>
  );
}

export default App;
