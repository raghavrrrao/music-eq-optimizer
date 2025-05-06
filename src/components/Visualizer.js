// frontend/src/visualizer.js
export const setupVisualizer = (audioContext, source) => {
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');

    const draw = () => {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        dataArray.forEach((value, i) => {
            const barHeight = value;
            const x = i * 3;
            canvasCtx.fillStyle = 'rgb(' + (value + 100) + ',50,50)';
            canvasCtx.fillRect(x, canvas.height - barHeight / 2, 2, barHeight / 2);
        });
    };

    draw();
};
