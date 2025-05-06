// src/components/Visualizer.js
import React, { useEffect, useRef } from 'react';

const Visualizer = ({ audioContext, audioSource }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!audioContext || !audioSource) return;

        const analyser = audioContext.createAnalyser();
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
                ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

                x += barWidth + 1;
            }

            requestAnimationFrame(draw);
        };

        draw();
    }, [audioContext, audioSource]);

    return <canvas ref={canvasRef} width="500" height="200" />;
};

export default Visualizer;
