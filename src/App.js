import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [filters, setFilters] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAudioSrc(objectUrl);
    }
  };

  useEffect(() => {
    if (!audioSrc) return;

    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    const source = context.createMediaElementSource(audio);

    // Create filters
    const lowShelf = context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 320;

    const peaking = context.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 1000;

    const highShelf = context.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;

    source.connect(lowShelf);
    lowShelf.connect(peaking);
    peaking.connect(highShelf);

    const analyser = context.createAnalyser();
    highShelf.connect(analyser);
    analyser.connect(context.destination);

    setFilters([lowShelf, peaking, highShelf]);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const draw = () => {
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = '#000';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];

        canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }

      // Automatic Equalization
      const lowAvg = average(dataArray.slice(0, bufferLength / 3));
      const midAvg = average(dataArray.slice(bufferLength / 3, (2 * bufferLength) / 3));
      const highAvg = average(dataArray.slice((2 * bufferLength) / 3));

      lowShelf.gain.value = adjustGain(lowAvg);
      peaking.gain.value = adjustGain(midAvg);
      highShelf.gain.value = adjustGain(highAvg);
    };

    draw();

    // Clean up
    return () => {
      context.close();
    };
  }, [audioSrc]);

  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const adjustGain = (avg) => {
    // Adjust gain based on average frequency value
    if (avg < 50) return 10;
    if (avg < 100) return 5;
    return 0;
  };

  return (
    <div className="App">
      <h1>Music EQ Optimizer</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <div>
        <audio ref={audioRef} id="audio-player" controls src={audioSrc} autoPlay />
        <canvas ref={canvasRef} width="600" height="300" />
      </div>
    </div>
  );
}

export default App;
