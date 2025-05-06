// frontend/src/App.js
import React, { useRef } from 'react';
import axios from 'axios';

function App() {
  const audioRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      const audioElement = audioRef.current;
      audioElement.src = objectUrl;
      audioElement.play();

      const formData = new FormData();
      formData.append('audio', file);

      try {
        const response = await axios.post('http://localhost:5000/predict_eq', formData);
        const { low, mid, high } = response.data;
        // Apply EQ settings using Web Audio API
        setupAudioGraph(audioElement, { low, mid, high });
      } catch (error) {
        console.error('Error predicting EQ settings:', error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Music EQ Optimizer</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <audio ref={audioRef} controls />
    </div>
  );
}

export default App;
