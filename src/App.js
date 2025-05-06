import React from 'react';
import AudioUploader from '../client/src/components/AudioUploader';
import EQVisualizer from '../client/src/components/EQVisualizer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Music EQ Optimizer</h1>
      </header>
      <main>
        <AudioUploader />
        <EQVisualizer />
      </main>
    </div>
  );
}

export default App;