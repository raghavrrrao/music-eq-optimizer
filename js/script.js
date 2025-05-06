document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const loopBtn = document.getElementById('loopBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTime = document.getElementById('currentTime');
    const totalTime = document.getElementById('totalTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.querySelector('.volume-icon');
    const trackList = document.getElementById('trackList');
    const currentTrackTitle = document.getElementById('currentTrack');
    const waveformCanvas = document.getElementById('waveformCanvas');
    const equalizerCanvas = document.getElementById('equalizerCanvas');
    const applyFreqBtn = document.getElementById('applyFreqBtn');
    const resetEqBtn = document.getElementById('resetEqBtn');
    const loginBtn = document.getElementById('loginBtn');
    const authContainer = document.getElementById('authContainer');
    const localSourceBtn = document.getElementById('localSourceBtn');
    const spotifySourceBtn = document.getElementById('spotifySourceBtn');
    const spotifyTrackList = document.getElementById('spotifyTrackList');

    // Audio Context and Nodes
    let audioContext;
    let source;
    let analyser;
    let gainNode;
    let equalizer = [];

    // Variables
    let tracks = [];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isShuffling = false;
    let isLooping = false;
    let isMuted = false;
    let lastVolume = 0.5;
    let animationFrameId;
    let spotifyPlayer;
    let spotifyTracks = [];
    let currentSpotifyTrackIndex = 0;
    let isSpotifyActive = false;
    let deviceId;
    let spotifyAccessToken = 'BQD6LWzMg6k_jPFh3Ot2vZqW_2TYQUjJQ9zm9vjllK3aAE8BNegKJhXlnf9DlfQJaPYyAMRvvf9lrXKVLSmRIaHlZVIKM3SCUzIjDFGzh_W_1GJWsLAVHXFAsNSYdqo9fPfiH2aTazty-vkoX3yr_Gy40vm2oeFYuhMO-SlrlLYnwcqE2ELJ1tmvz7juBVyQGfsHoBAhGOOgEtO8l6V94ys1OjwgcigN35eDb2jTma4BRoIJ9-RpqKyWF4ndvYIW82h-';
    let spotifyPlayerState = null;

    // Default EQ bands (8 bands)
    const defaultFreqBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
    let freqBands = [...defaultFreqBands];

    // Spotify Configuration
    const SPOTIFY_CLIENT_ID = 'c69d532509044ad28773383b514fe85a';
    const SPOTIFY_REDIRECT_URI = 'https://music-eq-optimizer.vercel.app/';
    const SPOTIFY_SCOPES = "user-read-playback-state user-read-currently-playing";

    // Load saved settings
    loadSettings();

    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    loopBtn.addEventListener('click', toggleLoop);
    shuffleBtn.addEventListener('click', toggleShuffle);
    progressBar.addEventListener('input', seekTrack);
    volumeSlider.addEventListener('input', adjustVolume);
    volumeIcon.addEventListener('click', toggleMute);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
    applyFreqBtn.addEventListener('click', applyCustomFrequencies);
    resetEqBtn.addEventListener('click', resetEqualizer);
    loginBtn.addEventListener('click', handleSpotifyLogin);
    localSourceBtn.addEventListener('click', () => switchSource(false));
    spotifySourceBtn.addEventListener('click', () => switchSource(true));

    // Check for Spotify access token in URL (callback from login)
    checkSpotifyAuthCallback();

    // Initialize Spotify Web Playback SDK if token exists
    if (localStorage.getItem('spotifyAccessToken')) {
        spotifyAccessToken = localStorage.getItem('spotifyAccessToken');
        initializeSpotifyPlayer();
        fetchSpotifyTracks();
    } else {
        authContainer.style.display = 'block';
    }

    // Settings Management
    function saveSettings() {
        const settings = {
            volume: audioPlayer.volume,
            isMuted: isMuted,
            isLooping: isLooping,
            isShuffling: isShuffling,
            eqSettings: equalizer.map(filter => filter ? filter.gain.value : 0),
            freqBands: freqBands,
            isSpotifyActive: isSpotifyActive
        };
        localStorage.setItem('audioPlayerSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('audioPlayerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);

            // Restore volume
            volumeSlider.value = settings.volume;
            audioPlayer.volume = settings.volume;

            // Restore mute state
            isMuted = settings.isMuted;
            if (isMuted) {
                lastVolume = settings.volume;
                audioPlayer.volume = 0;
                volumeSlider.value = 0;
                updateVolumeIcon(0);
            } else {
                updateVolumeIcon(settings.volume);
            }

            // Restore loop state
            isLooping = settings.isLooping;
            audioPlayer.loop = isLooping;
            loopBtn.classList.toggle('active', isLooping);

            // Restore shuffle state
            isShuffling = settings.isShuffling;
            shuffleBtn.classList.toggle('active', isShuffling);

            // Restore frequency bands
            if (settings.freqBands && settings.freqBands.length) {
                freqBands = settings.freqBands;
            }

            // Restore source
            if (settings.isSpotifyActive && spotifyAccessToken) {
                switchSource(true);
            }
        }
    }

    // Spotify Functions
    function handleSpotifyLogin() {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&show_dialog=true`;
        window.location.href = authUrl;
    }

    function checkSpotifyAuthCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
            // Store the token and expiration
            spotifyAccessToken = accessToken;
            localStorage.setItem('spotifyAccessToken', accessToken);
            localStorage.setItem('spotifyTokenExpiry', Date.now() + (expiresIn * 1000));

            // Clear the hash from the URL
            window.history.pushState({}, document.title, window.location.pathname);

            // Initialize the player
            initializeSpotifyPlayer();
            fetchSpotifyTracks();

            // Hide login button
            authContainer.style.display = 'none';
        }
    }

    function initializeSpotifyPlayer() {
        // Check if Spotify SDK is loaded
        if (!window.Spotify) {
            console.error('Spotify SDK not loaded');
            return;
        }

        // Create new player instance
        spotifyPlayer = new Spotify.Player({
            name: 'Personal Audio Player',
            getOAuthToken: cb => { cb(spotifyAccessToken); },
            volume: volumeSlider.value
        });

        // Ready event
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Spotify Player Ready with Device ID', device_id);
            deviceId = device_id;
        });

        // Not Ready event
        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        // Player state changed
        spotifyPlayer.addListener('player_state_changed', state => {
            console.log('Player state changed:', state);
            spotifyPlayerState = state;
            updatePlayerUIFromSpotifyState(state);
        });

        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => {
            console.error('Initialization Error:', message);
        });

        spotifyPlayer.addListener('authentication_error', ({ message }) => {
            console.error('Authentication Error:', message);
            localStorage.removeItem('spotifyAccessToken');
            localStorage.removeItem('spotifyTokenExpiry');
            authContainer.style.display = 'block';
        });

        spotifyPlayer.addListener('account_error', ({ message }) => {
            console.error('Account Error:', message);
        });

        spotifyPlayer.addListener('playback_error', ({ message }) => {
            console.error('Playback Error:', message);
        });

        // Connect to the player
        spotifyPlayer.connect().then(success => {
            if (success) {
                console.log('Spotify Player connected successfully');
            }
        });
    }

    function fetchSpotifyTracks() {
        if (!spotifyAccessToken) return;

        // Example: Fetch user's saved tracks
        fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                spotifyTracks = data.items.map(item => item.track);
                populateSpotifyTrackList();
            })
            .catch(error => {
                console.error('Error fetching Spotify tracks:', error);
            });
    }

    function populateSpotifyTrackList() {
        spotifyTrackList.innerHTML = '';

        spotifyTracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'spotify-track-item';
            trackItem.dataset.index = index;

            const trackImage = document.createElement('img');
            trackImage.className = 'spotify-track-image';
            trackImage.src = track.album.images[0]?.url || '';
            trackImage.alt = track.name;

            const trackInfo = document.createElement('div');
            trackInfo.className = 'spotify-track-info';

            const trackName = document.createElement('div');
            trackName.className = 'spotify-track-name';
            trackName.textContent = track.name;

            const trackArtist = document.createElement('div');
            trackArtist.className = 'spotify-track-artist';
            trackArtist.textContent = track.artists.map(artist => artist.name).join(', ');

            trackInfo.appendChild(trackName);
            trackInfo.appendChild(trackArtist);
            trackItem.appendChild(trackImage);
            trackItem.appendChild(trackInfo);

            trackItem.addEventListener('click', () => {
                playSpotifyTrack(index);
            });

            spotifyTrackList.appendChild(trackItem);
        });
    }

    function playSpotifyTrack(index) {
        if (!spotifyPlayer || !deviceId || index < 0 || index >= spotifyTracks.length) return;

        currentSpotifyTrackIndex = index;
        const trackUri = spotifyTracks[index].uri;

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [trackUri]
            })
        })
            .then(() => {
                isPlaying = true;
                updatePlayButton();
                updateActiveSpotifyTrack(index);
                currentTrackTitle.textContent = `${spotifyTracks[index].name} - ${spotifyTracks[index].artists.map(artist => artist.name).join(', ')}`;
            })
            .catch(error => {
                console.error('Error playing Spotify track:', error);
            });
    }

    function updateActiveSpotifyTrack(index) {
        const spotifyTrackItems = spotifyTrackList.querySelectorAll('.spotify-track-item');
        spotifyTrackItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function updatePlayerUIFromSpotifyState(state) {
        if (!state) return;

        // Update play/pause button
        isPlaying = !state.paused;
        updatePlayButton();

        // Update progress bar
        if (state.position && state.duration) {
            const progress = (state.position / state.duration) * 100;
            progressBar.value = progress;
            currentTime.textContent = formatTime(state.position / 1000);
            totalTime.textContent = formatTime(state.duration / 1000);
        }

        // Update current track info
        if (state.track_window?.current_track) {
            const track = state.track_window.current_track;
            currentTrackTitle.textContent = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;

            // Find and update the active track in the list
            const trackIndex = spotifyTracks.findIndex(t => t.id === track.id);
            if (trackIndex !== -1) {
                currentSpotifyTrackIndex = trackIndex;
                updateActiveSpotifyTrack(trackIndex);
            }
        }
    }

    function switchSource(useSpotify) {
        if (useSpotify && !spotifyAccessToken) {
            authContainer.style.display = 'block';
            return;
        }

        isSpotifyActive = useSpotify;
        saveSettings();

        if (useSpotify) {
            localSourceBtn.classList.remove('active');
            spotifySourceBtn.classList.add('active');
            trackList.style.display = 'none';
            spotifyTrackList.style.display = 'block';

            // Pause local player if playing
            if (isPlaying && !isSpotifyActive) {
                pauseTrack();
            }
        } else {
            localSourceBtn.classList.add('active');
            spotifySourceBtn.classList.remove('active');
            trackList.style.display = 'block';
            spotifyTrackList.style.display = 'none';

            // Pause Spotify player if playing
            if (isPlaying && isSpotifyActive && spotifyPlayer) {
                spotifyPlayer.pause();
            }
        }
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = 'BQD6LWzMg6k_jPFh3Ot2vZqW_2TYQUjJQ9zm9vjllK3aAE8BNegKJhXlnf9DlfQJaPYyAMRvvf9lrXKVLSmRIaHlZVIKM3SCUzIjDFGzh_W_1GJWsLAVHXFAsNSYdqo9fPfiH2aTazty-vkoX3yr_Gy40vm2oeFYuhMO-SlrlLYnwcqE2ELJ1tmvz7juBVyQGfsHoBAhGOOgEtO8l6V94ys1OjwgcigN35eDb2jTma4BRoIJ9-RpqKyWF4ndvYIW82h-';
        const player = new Spotify.Player({
            name: 'Web Playback SDK Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Add event listeners and connect player
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        player.connect();
    };

    // Audio Player Functions
    function togglePlay() {
        if (isSpotifyActive) {
            if (spotifyPlayer) {
                if (isPlaying) {
                    spotifyPlayer.pause();
                } else {
                    // If no track is selected, play the first one
                    if (spotifyTracks.length > 0 && currentSpotifyTrackIndex === -1) {
                        playSpotifyTrack(0);
                    } else {
                        spotifyPlayer.resume();
                    }
                }
                isPlaying = !isPlaying;
                updatePlayButton();
            }
        } else {
            if (tracks.length === 0) return;

            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack();
            }
        }
    }

    function playPrevious() {
        if (isSpotifyActive) {
            if (spotifyPlayer) {
                if (spotifyPlayerState?.position > 3000) {
                    // If more than 3 seconds into the song, seek to start
                    spotifyPlayer.seek(0);
                } else {
                    // Go to previous track
                    const newIndex = (currentSpotifyTrackIndex - 1 + spotifyTracks.length) % spotifyTracks.length;
                    playSpotifyTrack(newIndex);
                }
            }
        } else {
            if (tracks.length === 0) return;

            if (audioPlayer.currentTime > 3) {
                // If more than 3 seconds into the song, restart current track
                audioPlayer.currentTime = 0;
            } else {
                // Go to previous track
                currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
                loadTrack(currentTrackIndex);
                playTrack();
            }
        }
    }

    function playNext() {
        if (isSpotifyActive) {
            if (spotifyPlayer) {
                if (isShuffling) {
                    // Random track
                    let newIndex;
                    do {
                        newIndex = Math.floor(Math.random() * spotifyTracks.length);
                    } while (newIndex === currentSpotifyTrackIndex && spotifyTracks.length > 1);

                    playSpotifyTrack(newIndex);
                } else {
                    // Next track in order
                    const newIndex = (currentSpotifyTrackIndex + 1) % spotifyTracks.length;
                    playSpotifyTrack(newIndex);
                }
            }
        } else {
            if (tracks.length === 0) return;

            if (isShuffling) {
                // Random track
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * tracks.length);
                } while (newIndex === currentTrackIndex && tracks.length > 1);

                currentTrackIndex = newIndex;
            } else {
                // Next track in order
                currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
            }

            loadTrack(currentTrackIndex);
            playTrack();
        }
    }

    function toggleMute() {
        isMuted = !isMuted;

        if (isMuted) {
            // Store current volume before muting
            lastVolume = audioPlayer.volume > 0 ? audioPlayer.volume : 0.5;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            if (gainNode) {
                gainNode.gain.value = 0;
            }
        } else {
            // Restore volume
            audioPlayer.volume = lastVolume;
            volumeSlider.value = lastVolume;
            if (gainNode) {
                gainNode.gain.value = lastVolume;
            }
        }

        updateVolumeIcon(isMuted ? 0 : lastVolume);
        saveSettings();
    }

    function updateVolumeIcon(volume) {
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute volume-icon';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down volume-icon';
        } else {
            volumeIcon.className = 'fas fa-volume-up volume-icon';
        }
    }

    function setupAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            gainNode = audioContext.createGain();

            // Configure analyser
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;

            // Create EQ bands
            setupEqualizer();

            // Connect nodes
            source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(equalizer[0]);

            for (let i = 0; i < equalizer.length - 1; i++) {
                equalizer[i].connect(equalizer[i + 1]);
            }

            equalizer[equalizer.length - 1].connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            // Restore saved EQ settings if available
            const savedSettings = localStorage.getItem('audioPlayerSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.eqSettings && settings.eqSettings.length === equalizer.length) {
                    settings.eqSettings.forEach((gain, i) => {
                        equalizer[i].gain.value = gain;
                        // Also update EQ sliders UI
                        const slider = document.getElementById(`eq-slider-${i}`);
                        if (slider) {
                            slider.value = gain;
                            const valueDisplay = document.getElementById(`eq-value-${i}`);
                            if (valueDisplay) {
                                valueDisplay.textContent = `${gain > 0 ? '+' : ''}${gain} dB`;
                            }
                        }
                    });
                }
            }

            // Start visualizations
            drawVisualizations();
        }
    }

    function setupEqualizer() {
        // Clear existing equalizer
        equalizer = [];

        // Create filters for each frequency band
        for (let i = 0; i < freqBands.length; i++) {
            const filter = audioContext.createBiquadFilter();

            // Set filter type based on position
            filter.type = i === 0 ? 'lowshelf' :
                i === freqBands.length - 1 ? 'highshelf' : 'peaking';

            // Set frequency value
            filter.frequency.value = freqBands[i];

            // Set initial gain values (can be adjusted later)
            filter.gain.value = 0; // Default to no gain

            // Set Q factor (controls bandwidth)
            // Lower Q = wider bandwidth, Higher Q = narrower bandwidth
            if (i === 0 || i === freqBands.length - 1) {
                filter.Q.value = 0.7; // Wider for shelf filters
            } else {
                // Adjust Q based on distance to adjacent bands
                const prevFreq = i > 0 ? freqBands[i - 1] : 20;
                const nextFreq = i < freqBands.length - 1 ? freqBands[i + 1] : 20000;

                // Calculate optimal Q based on adjacent frequencies
                // This helps prevent frequency gaps or overlaps
                const octavesToPrev = Math.log2(freqBands[i] / prevFreq);
                const octavesToNext = Math.log2(nextFreq / freqBands[i]);
                const avgOctaveWidth = (octavesToPrev + octavesToNext) / 2;

                // Q ≈ center_frequency / bandwidth
                // Use a reasonable Q factor based on band spacing
                filter.Q.value = Math.min(Math.max(1.4 / avgOctaveWidth, 0.7), 4.0);
            }

            equalizer.push(filter);
        }

        // Create EQ sliders if they don't exist yet
        createEQSliders();
    }

    function createEQSliders() {
        // Check if we have an EQ container already
        let eqSliders = document.getElementById('eqSliders');
        if (!eqSliders) {
            // Create a container for EQ sliders
            eqSliders = document.createElement('div');
            eqSliders.id = 'eqSliders';
            eqSliders.className = 'eq-sliders';

            // Add the EQ sliders to the custom frequencies section
            document.querySelector('.custom-frequencies').insertBefore(eqSliders, document.querySelector('.eq-button-group'));

            // Add a heading
            const heading = document.createElement('h4');
            heading.textContent = 'Adjust EQ';
            heading.style.margin = '15px 0';
            heading.style.fontSize = '0.9rem';
            heading.style.color = 'var(--text-secondary)';
            eqSliders.appendChild(heading);

            // Add the slider container
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'eq-slider-container';
            eqSliders.appendChild(sliderContainer);

            // Create sliders for each band
            for (let i = 0; i < freqBands.length; i++) {
                const sliderDiv = document.createElement('div');
                sliderDiv.className = 'eq-slider';

                // Create the slider
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '-12';
                slider.max = '12';
                slider.step = '0.5';
                slider.value = '0';
                slider.id = `eq-slider-${i}`;
                slider.className = 'eq-vert-slider';
                slider.setAttribute('orient', 'vertical');

                // Value display
                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'eq-value';
                valueDisplay.id = `eq-value-${i}`;
                valueDisplay.textContent = '0 dB';

                // Frequency label
                const freqLabel = document.createElement('div');
                freqLabel.className = 'eq-freq-label';
                freqLabel.textContent = getFrequencyLabel(freqBands[i]);

                // Add everything to the slider div
                sliderDiv.appendChild(valueDisplay);
                sliderDiv.appendChild(slider);
                sliderDiv.appendChild(freqLabel);

                // Add to container
                sliderContainer.appendChild(sliderDiv);

                // Add event listener
                slider.addEventListener('input', function () {
                    const value = parseFloat(this.value);
                    valueDisplay.textContent = `${value > 0 ? '+' : ''}${value} dB`;

                    // Apply gain to the filter
                    if (equalizer[i]) {
                        equalizer[i].gain.value = value;
                    }

                    // Save settings when EQ is adjusted
                    saveSettings();
                });
            }
        } else {
            // Update existing sliders with new frequency values
            for (let i = 0; i < freqBands.length; i++) {
                const freqLabel = document.querySelector(`#eq-slider-${i} + .eq-freq-label`);
                if (freqLabel) {
                    freqLabel.textContent = getFrequencyLabel(freqBands[i]);
                }
            }
        }
    }

    function getFrequencyLabel(freq) {
        if (freq >= 1000) {
            return `${(freq / 1000).toFixed(1)}kHz`;
        }
        return `${freq}Hz`;
    }

    function applyCustomFrequencies() {
        const newFreqBands = [];

        for (let i = 0; i < freqBands.length; i++) {
            const input = document.getElementById(`freq-${i}`);
            if (input) {
                const value = parseInt(input.value, 10);

                if (isNaN(value) || value < 20 || value > 20000) {
                    alert(`Invalid frequency value for Band ${i + 1}. Must be between 20Hz and 20kHz.`);
                    return;
                }

                newFreqBands.push(value);
            } else {
                newFreqBands.push(freqBands[i]);
            }
        }

        // Sort frequencies in ascending order
        newFreqBands.sort((a, b) => a - b);

        // Check for reasonable spacing between frequency bands
        for (let i = 1; i < newFreqBands.length; i++) {
            const ratio = newFreqBands[i] / newFreqBands[i - 1];

            // If bands are too close (less than 20% difference), adjust them slightly
            if (ratio < 1.2) {
                // Adjust the current band up a bit
                newFreqBands[i] = Math.min(Math.round(newFreqBands[i - 1] * 1.2), 20000);
            }
        }

        // Update frequency bands
        freqBands = newFreqBands;

        // Update inputs with sorted and adjusted values
        for (let i = 0; i < freqBands.length; i++) {
            const input = document.getElementById(`freq-${i}`);
            if (input) {
                input.value = freqBands[i];
            }

            // Also update the labels
            const label = document.querySelector(`label[for="freq-${i}"]`);
            if (label) {
                label.textContent = getFrequencyLabel(freqBands[i]);
            }
        }

        // If audio context exists, rebuild equalizer
        if (audioContext) {
            const wasPlaying = isPlaying;

            // Store current gain values to transfer to new filters
            const currentGains = equalizer.map(filter => filter.gain.value);

            // Disconnect existing connections
            source.disconnect();
            equalizer.forEach(filter => filter.disconnect());

            // Setup new equalizer
            setupEqualizer();

            // Transfer previous gain values where possible
            for (let i = 0; i < equalizer.length; i++) {
                if (i < currentGains.length) {
                    equalizer[i].gain.value = currentGains[i];

                    // Update the slider UI if it exists
                    const slider = document.getElementById(`eq-slider-${i}`);
                    if (slider) {
                        slider.value = currentGains[i];
                        const valueDisplay = document.getElementById(`eq-value-${i}`);
                        if (valueDisplay) {
                            valueDisplay.textContent = `${currentGains[i] > 0 ? '+' : ''}${currentGains[i]} dB`;
                        }
                    }
                }
            }

            // Reconnect nodes
            source.connect(equalizer[0]);
            for (let i = 0; i < equalizer.length - 1; i++) {
                equalizer[i].connect(equalizer[i + 1]);
            }
            equalizer[equalizer.length - 1].connect(gainNode);

            // Resume playback if it was playing
            if (wasPlaying) {
                audioPlayer.play();
            }

            // Visual feedback showing the audio path is being reconfigured
            const equalizerContainer = document.querySelector('.equalizer-container');
            equalizerContainer.classList.add('eq-updating');
            setTimeout(() => {
                equalizerContainer.classList.remove('eq-updating');
            }, 1000);
        }

        // Save settings
        saveSettings();

        // Show confirmation with animation
        applyFreqBtn.textContent = "Applied!";
        applyFreqBtn.style.background = "var(--success)";
        setTimeout(() => {
            applyFreqBtn.textContent = "Apply Changes";
            applyFreqBtn.style.background = "";
        }, 1500);
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));

        if (files.length === 0) {
            alert('No audio files found in the selected folder.');
            return;
        }

        tracks = files;
        populateTrackList();

        // Play the first track
        currentTrackIndex = 0;
        loadTrack(currentTrackIndex);
    }

    function populateTrackList() {
        trackList.innerHTML = '';

        tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = track.name;
            li.addEventListener('click', () => {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                playTrack();
            });
            trackList.appendChild(li);
        });
    }

    function loadTrack(index) {
        if (tracks.length === 0) return;

        const track = tracks[index];
        const trackURL = URL.createObjectURL(track);

        audioPlayer.src = trackURL;
        currentTrackTitle.textContent = track.name;

        // Update active track in list
        const trackItems = trackList.querySelectorAll('li');
        trackItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Setup audio context on first track load
        if (!audioContext) {
            audioPlayer.addEventListener('play', () => {
                setupAudioContext();
            }, { once: true });
        }
    }

    function playTrack() {
        if (!audioPlayer.src) return;

        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayButton();

                // Resume audio context if it's suspended
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            })
            .catch(error => {
                console.error('Error playing audio:', error);
            });
    }

    function pauseTrack() {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayButton();
    }

    function updatePlayButton() {
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function toggleLoop() {
        isLooping = !isLooping;
        audioPlayer.loop = isLooping;
        loopBtn.classList.toggle('active', isLooping);
        saveSettings();
    }

    function toggleShuffle() {
        isShuffling = !isShuffling;
        shuffleBtn.classList.toggle('active', isShuffling);
        saveSettings();
    }

    function handleTrackEnd() {
        if (!isLooping) {
            playNext();
        }
    }

    function seekTrack() {
        const seekTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
    }

    function updateProgress() {
        if (isNaN(audioPlayer.duration)) return;

        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;

        currentTime.textContent = formatTime(audioPlayer.currentTime);
    }

    function updateTotalTime() {
        totalTime.textContent = formatTime(audioPlayer.duration);
    }

    function adjustVolume() {
        const volume = parseFloat(volumeSlider.value);
        audioPlayer.volume = volume;

        if (gainNode) {
            gainNode.gain.value = volume;
        }

        // Update mute state based on volume
        isMuted = (volume === 0);

        // If volume is adjusted above zero, update lastVolume
        if (volume > 0) {
            lastVolume = volume;
        }

        updateVolumeIcon(volume);
        saveSettings();
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function drawVisualizations() {
        if (!analyser) return;

        const waveformCtx = waveformCanvas.getContext('2d');
        const equalizerCtx = equalizerCanvas.getContext('2d');

        // Set up data arrays
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const waveformArray = new Uint8Array(bufferLength);

        // Clear canvases
        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        equalizerCtx.clearRect(0, 0, equalizerCanvas.width, equalizerCanvas.height);

        function draw() {
            // Request next frame
            animationFrameId = requestAnimationFrame(draw);

            // Get data
            analyser.getByteFrequencyData(dataArray);
            analyser.getByteTimeDomainData(waveformArray);

            // Draw waveform
            drawWaveform(waveformCtx, waveformArray);

            // Draw frequency bars
            drawFrequencyBars(equalizerCtx, dataArray);
        }

        draw();
    }

    // Draw Waveform
    function drawWaveform(ctx, dataArray) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const bufferLength = dataArray.length;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#800000');   // Dark red
        gradient.addColorStop(0.5, '#ff0000'); // Bright red
        gradient.addColorStop(1, '#ff3333');   // Light red

        // Draw path
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff0000';
    }

    // Draw Frequency Bars
    function drawFrequencyBars(ctx, dataArray) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const bufferLength = dataArray.length;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set bar properties
        const barWidth = width / (bufferLength / 4);
        let x = 0;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#800000');   // Dark red
        gradient.addColorStop(0.5, '#ff0000'); // Bright red
        gradient.addColorStop(1, '#ff3333');   // Light red

        // Draw each bar
        for (let i = 0; i < bufferLength; i += 4) {
            const barHeight = (dataArray[i] / 255) * height;

            // Draw bar with gradient
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

            // Add glow effect
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#ff0000';

            x += barWidth;
        }
    }

    // Reset Equalizer
    function resetEqualizer() {
        // Reset all equalizer bands to 0 gain
        if (equalizer.length > 0) {
            equalizer.forEach((filter, index) => {
                filter.gain.value = 0;

                // Update slider UI
                const slider = document.getElementById(`eq-slider-${index}`);
                if (slider) {
                    slider.value = 0;
                    const valueDisplay = document.getElementById(`eq-value-${index}`);
                    if (valueDisplay) {
                        valueDisplay.textContent = '0 dB';
                    }
                }
            });
        }

        // Save settings
        saveSettings();

        // Visual feedback
        const equalizerContainer = document.querySelector('.equalizer-container');
        equalizerContainer.classList.add('eq-updating');
        setTimeout(() => {
            equalizerContainer.classList.remove('eq-updating');
        }, 1000);

        // Feedback on button click
        resetEqBtn.classList.add('active');
        setTimeout(() => {
            resetEqBtn.classList.remove('active');
        }, 1000);
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        if (audioContext) {
            audioContext.close();
        }
    });



    // Initialize volume display on load
    updateVolumeIcon(audioPlayer.volume);
});
