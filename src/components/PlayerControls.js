import React from 'react';

const PlayerControls = ({ isPlaying, onPlayPause, onNext }) => {
    return (
        <div className="player-controls">
            <button onClick={onPlayPause}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={onNext}>
                Next
            </button>
        </div>
    );
};

export default PlayerControls;