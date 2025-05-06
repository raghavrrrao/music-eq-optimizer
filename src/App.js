import React, { useState, useEffect, useRef } from 'react';
import PlayerControls from './components/PlayerControls';
import SongLibrary from './components/SongLibrary';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [songs, setSongs] = useState([]);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load songs with actual filenames
  useEffect(() => {
    const songFilenames = [
  "Ariana Grande ft. Nicki Minaj - Side To Side.mp3",
  "Bruno Mars - Finesse (Remix) (feat. Cardi B) (Official Music Video) 4.mp3",
  "Bruno Mars, Anderson .Paak, Silk Sonic - Leave the Door Open [Official Video] 4.mp3",
  "Calvin Harris - Feels (Official Video) ft. Pharrell Williams, Katy Perry, Big Sean 4.mp3",
  "Calvin Harris, Rihanna - This Is What You Came For (Official Video) 4.mp3",
  "Cardi B & Bruno Mars - Please Me (Official Video) 4.mp3",
  "Charlie Puth - Attention [Official Video] 4.mp3",
  "Charlie Puth - Cheating on You [Official Video] 4.mp3",
  "Charlie Puth - Girlfriend [Official Video] 4.mp3",
  "Cheat Codes x Kris Kross Amsterdam - SEX (Official Music Video) 4.mp3",
  "Conan Gray - Maniac (Official Video) 4.mp3",
  "David Guetta ft Justin Bieber - 2U (The Victoria's Secret Angels Lip Sync) 4.mp3",
  "DJ Khaled - Wild Thoughts (Official Video) ft. Rihanna, Bryson Tiller 4.mp3",
  "DNCE - Cake By The Ocean 4.mp3",
  "DNCE - Toothbrush (Official Video) 4.mp3",
  "Doja Cat - Kiss Me More (Official Video) ft. SZA 4.mp3",
  "Eminem - Love The Way You Lie ft. Rihanna 4.mp3",
  "Fifth Harmony - Work from Home (Official Video) ft. Ty Dolla Sign 4.mp3",
  "Jason Derulo - Swalla (feat. Nicki Minaj & Ty Dolla Sign) [Official Music Video] 4.mp3",
  "Justin Bieber - Beauty And A Beat (Official Music Video) ft. Nicki Minaj 4.mp3",
  "Katy Perry - Bon Appétit (Official) ft. Migos 4.mp3",
  "Katy Perry - Harleys In Hawaii (Official) 4.mp3",
  "Katy Perry - Hot N Cold (Official Music Video) 4.mp3",
  "Kygo - Firestone ft. Conrad Sewell (Official Video) 4.mp3",
  "LSD - Genius ft. Sia, Diplo, Labrinth 4.mp3",
  "Madison Beer - Make You Mine (Official Music Video) 4.mp3",
  "Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars 4.mp3",
  "Maroon 5 - Girls Like You ft. Cardi B (Official Music Video) 4.mp3",
  "Mike Posner - I Took A Pill In Ibiza (Seeb Remix) (Explicit) 4.mp3",
  "Money Trees 4.mp3",
  "OneRepublic - Counting Stars 4.mp3",
  "Shakira - Can't Remember to Forget You (Official Video) ft. Rihanna 4.mp3",
  "The Weeknd, JENNIE & Lily Rose Depp - One Of The Girls (Official Audio) 4.mp3",
  "Zayn - Bed Peace (Iliene Alko Cover) 4.mp3"
];

    const loadedSongs = songFilenames.map((filename, index) => ({
      id: index,
      name: cleanSongName(filename), // Clean up the display name
      path: process.env.PUBLIC_URL + `/music/${filename}`
    }));

    setSongs(loadedSongs);
  }, []);

  // Helper function to clean up song names for display
  const cleanSongName = (filename) => {
    // Remove trailing '...' and file extension
    return filename
      .replace(/\.\.\.$/, '')
      .replace(/\.mp3$/i, '')
      .replace(/ 4$/, ''); // Removes the ' 4' at the end of some filenames
  };

  // Rest of your component code remains the same...
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    
    const nextIndex = (currentSong.id + 1) % songs.length;
    handleSelectSong(songs[nextIndex]);
  };

  const handleSelectSong = (song) => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.src = song.path;
    
    audioRef.current.load();
    audioRef.current.play()
      .then(() => {
        setCurrentSong(song);
        setIsPlaying(true);
      })
      .catch(error => {
        console.error("Error playing song:", error);
        setIsPlaying(false);
      });
  };

  return (
    <div className="app">
      <h1>Music EQ Optimizer</h1>
      
      <div className="main-content">
        <SongLibrary songs={songs} onSelectSong={handleSelectSong} />
        
        <div className="player-section">
          <div className="eq-visualization">
            <h3>Now Playing: {currentSong?.name || 'None'}</h3>
          </div>
          <PlayerControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
}

export default App;