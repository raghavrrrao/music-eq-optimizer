import React from 'react';

export const AudioUploader = () => {
    return (
        <div>
            <h2>Audio Uploader</h2>
            <input
                type="file"
                accept="audio/*"
                onChange={(e) => console.log('File selected:', e.target.files[0])}
            />
        </div>
    );
};

export default AudioUploader;