// src/App.js
import React, { useEffect, useState } from 'react';
import Visualizer from './components/Visualizer';

function App() {
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    if (audioFile) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const audio = new Audio(URL.createObjectURL(audioFile));
      audio.crossOrigin = 'anonymous';
      const source = context.createMediaElementSource(audio);
      setAudioSource(source);

      audio.play();
    }
  }, [audioFile]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      {audioContext && audioSource && <Visualizer audioContext={audioContext} audioSource={audioSource} />}
    </div>
  );
}

export default App;
