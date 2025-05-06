import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);
  const [filters, setFilters] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAudioSrc(objectUrl);
      setupAudioGraph(objectUrl);
    }
  };

  const setupAudioGraph = async (url) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    // Equalizer bands: Low, Mid, High
    const bands = [
      { type: 'lowshelf', frequency: 60 },
      { type: 'peaking', frequency: 1000 },
      { type: 'highshelf', frequency: 10000 },
    ];

    const createdFilters = bands.map(band => {
      const filter = audioContext.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = 0; // Default gain; will be adjusted later
      return filter;
    });

    // Connect the nodes in series
    source.connect(createdFilters[0]);
    for (let i = 0; i < createdFilters.length - 1; i++) {
      createdFilters[i].connect(createdFilters[i + 1]);
    }

    createdFilters[createdFilters.length - 1].connect(analyser);
    analyser.connect(audioContext.destination);

    // Start playback
    source.start(0);

    // Set up visualization/auto-adjustment (simulate EQ tuning here)
    autoAdjustEqualizer(analyser, createdFilters);

    setFilters(createdFilters); // Save filters if needed later
  };

  const autoAdjustEqualizer = (analyser, filters) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Simple logic: boost low if lows are weak, same for mid and high
    const low = average(dataArray.slice(0, 64));
    const mid = average(dataArray.slice(64, 512));
    const high = average(dataArray.slice(512));

    filters[0].gain.value = low < 80 ? 6 : 0;
    filters[1].gain.value = mid < 80 ? 4 : 0;
    filters[2].gain.value = high < 80 ? 5 : 0;
  };

  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return (
    <div className="App">
      <h1>Music EQ Optimizer</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      {audioSrc && (
        <audio
          ref={audioRef}
          id="audio-player"
          controls
          src={audioSrc}
          autoPlay
        />
      )}
    </div>
  );
}

export default App;
