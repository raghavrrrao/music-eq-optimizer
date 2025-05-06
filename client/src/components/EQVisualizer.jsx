// client/src/components/EQVisualizer.jsx
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const EQVisualizer = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!data) return;

        const ctx = chartRef.current.getContext('2d');

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.frequencies.map(f => `${(f / 1000).toFixed(1)}k`),
                datasets: [
                    {
                        label: 'Original Spectrum',
                        data: data.spectrum,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Recommended EQ',
                        data: data.eqRecommendation,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Frequency (Hz)' },
                        type: 'logarithmic'
                    },
                    y: {
                        title: { display: true, text: 'Amplitude (dB)' },
                        min: -50,
                        max: 0
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return <canvas ref={chartRef} />;
};

export default EQVisualizer;