import React from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import Console from './components/Console';
import Observer from './components/Observer';
import LoadTargets from './components/LoadTargets';
import Plot from './components/Plot';
import Targets from './components/Targets';
import './App.css';
import { useCookieState, useTargets } from './services/cookies';
import { VERSION } from './version';

const queryClient = new QueryClient()

function App() {
  const [isUTC, setIsUTC] = useCookieState("local", "isUTC", false);
  const [messages, setMessages] = React.useState([
    {
      severity: "info",
      date: new Date(),
      text: <span>Using the Minor Planet Center's <a href="https://minorplanetcenter.net/iau/MPEph/MPEph.html">Ephemeris Service</a>.</span>
    },
    {
      severity: "info",
      date: new Date(),
      text: `Elevation build ${VERSION}.`
    }
  ]);
  const [observer, setObserverState] = React.useState(null);
  const [targets, targetDispatch] = useTargets();

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
