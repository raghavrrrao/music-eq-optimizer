import React from 'react';

const SongLibrary = ({ songs, onSelectSong }) => {
    return (
        <div className="song-library">
            <h3>Your Library</h3>
            <ul>
                {songs.map((song, index) => (
                    <li key={index} onClick={() => onSelectSong(song)}>
                        {song.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SongLibrary;