// Song list
const songs = [
    { title: "Futuristic Dreams", artist: "Neon Wave", file: "song1.mp3" },
    { title: "Digital Sunrise", artist: "Cyber Synth", file: "song2.mp3" },
    { title: "Quantum Leap", artist: "Electro Void", file: "song3.mp3" }
];

// Player elements
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const equalizer = document.getElementById('equalizer');
const visualizer = document.getElementById('visualizer');

// Player state
let currentSongIndex = 0;
let isPlaying = false;
let audioContext;
let analyser;
let dataArray;
let animationId;

// Initialize equalizer bands (10 bands as in your image)
const eqBands = [31, 62, 125, 240, 800, 1000, 2000, 4000, 8000, 10000];
const eqValues = [0.5, 1.0, -0.5, -0.0, 0, 0, 0, 0, 0, 0]; // Initial values

// Create equalizer
function createEqualizer() {
    equalizer.innerHTML = '';
    eqBands.forEach((band, index) => {
        const bandElement = document.createElement('div');
        bandElement.className = 'equalizer-band';
        bandElement.dataset.freq = band;
        bandElement.dataset.value = eqValues[index];
        bandElement.style.height = `${(eqValues[index] + 1) * 30}px`;
        equalizer.appendChild(bandElement);
    });
}

// Create visualizer bars
function createVisualizer() {
    visualizer.innerHTML = '';
    for (let i = 0; i < 64; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizer.appendChild(bar);
    }
}

// Setup audio context and analyzer
function setupAudioAnalyzer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Update visualizer
function updateVisualizer() {
    if (!analyser) return;
    
    analyser.getByteFrequencyData(dataArray);
    const bars = document.querySelectorAll('.visualizer-bar');
    
    bars.forEach((bar, i) => {
        const value = dataArray[i] / 255;
        const height = value * 100;
        bar.style.height = `${height}px`;
        bar.style.opacity = 0.5 + value * 0.5;
    });
    
    animationId = requestAnimationFrame(updateVisualizer);
}

// Load song
function loadSong(index) {
    const song = songs[index];
    audioPlayer.src = `assets/${song.file}`;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    
    if (isPlaying) {
        audioPlayer.play();
    }
}

// Play/pause toggle
function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        cancelAnimationFrame(animationId);
    } else {
        audioPlayer.play();
        if (!audioContext) {
            setupAudioAnalyzer();
        }
        updateVisualizer();
    }
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '⏵';
}

// Next song
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
}

// Previous song
function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
}

// Set volume
function setVolume() {
    audioPlayer.volume = volumeSlider.value;
}

// Initialize player
function initPlayer() {
    createEqualizer();
    createVisualizer();
    loadSong(currentSongIndex);
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    volumeSlider.addEventListener('input', setVolume);
    
    audioPlayer.addEventListener('ended', nextSong);
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        playBtn.textContent = '⏸';
    });
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        playBtn.textContent = '⏵';
    });
}

// Start the player
window.addEventListener('load', initPlayer);