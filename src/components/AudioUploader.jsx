import React, { useState, useRef } from 'react';

const AudioUploader = () => {
    const [audioFile, setAudioFile] = useState(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAudioFile(file);

        // Create object URL for playback
        const audioUrl = URL.createObjectURL(file);
        audioRef.current.src = audioUrl;

        console.log('Audio file ready:', file.name);
    };

    const togglePlayback = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Audio Upload</h2>
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ marginBottom: '10px' }}
            />

            {audioFile && (
                <div>
                    <p>Selected: {audioFile.name}</p>
                    <button onClick={togglePlayback} style={{ padding: '8px 16px' }}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <audio
                        ref={audioRef}
                        onEnded={() => setIsPlaying(false)}
                        hidden
                    />
                </div>
            )}
        </div>
    );
};

export default AudioUploader;