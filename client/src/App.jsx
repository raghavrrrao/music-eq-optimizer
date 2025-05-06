// client/src/App.jsx
import React from 'react';
import AudioUploader from './components/AudioUploader';
import EQVisualizer from './components/EQVisualizer';

function App() {
    return (
        <div className="App">
            <h1>Music EQ Optimizer</h1>
            <AudioUploader />
            <EQVisualizer />
        </div>
    );
}

export default App;