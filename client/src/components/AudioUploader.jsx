// client/src/components/AudioUploader.jsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAudio } from '../services/api';

const AudioUploader = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        setIsProcessing(true);

        try {
            const response = await uploadAudio(acceptedFiles[0]);
            console.log('Upload success:', response.data);
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'audio/*',
        maxFiles: 1
    });

    return (
        <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            {isProcessing ? (
                <p>Processing audio...</p>
            ) : (
                <p>Drag & drop an audio file here, or click to select</p>
            )}
        </div>
    );
};

export default AudioUploader;