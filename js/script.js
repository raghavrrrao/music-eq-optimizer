/// Define onSpotifyWebPlaybackSDKReady globally first (before DOMContentLoaded)
// window.onSpotifyWebPlaybackSDKReady = () => {
//     console.log('Spotify Web Playback SDK Ready');
//     if (window.initializeSpotifyPlayerCallback) {
//         window.initializeSpotifyPlayerCallback();
//     }
// };

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

    // Check if elements exist before adding event listeners
    const applyFreqBtn = document.getElementById('applyFreqBtn');
    const resetEqBtn = document.getElementById('resetEqBtn');
    const loginBtn = document.getElementById('loginBtn');
    const authContainer = document.getElementById('authContainer');

    // These elements might not exist in the HTML yet
    const localSourceBtn = document.getElementById('localSourceBtn');
    // const spotifySourceBtn = document.getElementById('spotifySourceBtn');
    // const spotifyTrackList = document.getElementById('spotifyTrackList');

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
    // let spotifyPlayer;
    // let spotifyTracks = [];
    let currentSpotifyTrackIndex = 0;
    let isSpotifyActive = false;
    let deviceId;
    // let spotifyPlayerState = null;
    // let spotifyAccessToken;

    // Default EQ bands (8 bands)
    const defaultFreqBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
    let freqBands = [...defaultFreqBands];

    // Spotify Configuration (Updated)
    // Update your Spotify config at the top of your script
    // Update these constants at the top of your script.js
    // const SPOTIFY_CLIENT_ID = 'c69d532509044ad28773383b514fe85a'; // Your actual client ID
    // const SPOTIFY_REDIRECT_URI = 'https://music-eq-optimizer.vercel.app/'; // No encodeURIComponent
    // const SPOTIFY_SCOPES = [
    //     'streaming',
    //     'user-read-email',
    //     'user-read-private',
    //     'user-library-read',
    //     'user-read-playback-state',
    //     'user-modify-playback-state'
    // ].join(' ');
    // Load saved settings
    loadSettings();

    // Add event listeners only if elements exist
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (prevBtn) prevBtn.addEventListener('click', playPrevious);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (loopBtn) loopBtn.addEventListener('click', toggleLoop);
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (progressBar) progressBar.addEventListener('input', seekTrack);
    if (volumeSlider) volumeSlider.addEventListener('input', adjustVolume);
    if (volumeIcon) volumeIcon.addEventListener('click', toggleMute);
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', handleTrackEnd);
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
    }
    if (applyFreqBtn) applyFreqBtn.addEventListener('click', applyCustomFrequencies);
    if (resetEqBtn) resetEqBtn.addEventListener('click', resetEqualizer);
    if (loginBtn) loginBtn.addEventListener('click', handleSpotifyLogin);
    if (localSourceBtn) localSourceBtn.addEventListener('click', () => switchSource(false));
    // if (spotifySourceBtn) spotifySourceBtn.addEventListener('click', () => switchSource(true));

    // Check for Spotify access token in URL (callback from login)
    // checkSpotifyAuthCallback();

    // Initialize Spotify Web Playback SDK if token exists
    // if (localStorage.getItem('spotifyAccessToken')) {
    //     spotifyAccessToken = localStorage.getItem('spotifyAccessToken');

        // Store the initialization function for when the SDK is ready
        // window.initializeSpotifyPlayerCallback = initializeSpotifyPlayer;

        // If Spotify SDK is already loaded, initialize now 
        // if (window.Spotify) {
        //     initializeSpotifyPlayer();
        // }

    //     fetchSpotifyTracks();
    // } else if (authContainer) {
    //     authContainer.style.display = 'block';
    // }

    // Settings Management
    function saveSettings() {
        const settings = {
            volume: audioPlayer ? audioPlayer.volume : 0.5,
            isMuted: isMuted,
            isLooping: isLooping,
            isShuffling: isShuffling,
            eqSettings: equalizer.map(filter => filter ? filter.gain.value : 0),
            freqBands: freqBands,
            isSpotifyActive: isSpotifyActive
        };
        localStorage.setItem('audioPlayerSettings', JSON.stringify(settings));
    }

    // function generateRandomString(length) {
    //     let text = '';
    //     const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     for (let i = 0; i < length; i++) {
    //         text += possible.charAt(Math.floor(Math.random() * possible.length));
    //     }
    //     return text;
    // }

    // function base64urlencode(str) {
    //     return btoa(String.fromCharCode(...new Uint8Array(str)))
    //         .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // }

    // async function generateCodeChallenge(codeVerifier) {
    //     const encoder = new TextEncoder();
    //     const data = encoder.encode(codeVerifier);
    //     const digest = await crypto.subtle.digest('SHA-256', data);
    //     return base64urlencode(digest);
    // }

    // document.getElementById("loginBtn").addEventListener("click", async () => {
    //     const codeVerifier = generateRandomString(128);
    //     const codeChallenge = await generateCodeChallenge(codeVerifier);
    //     localStorage.setItem("code_verifier", codeVerifier);

    //     const args = new URLSearchParams({
    //         response_type: 'code',
    //         client_id: SPOTIFY_CLIENT_ID,
    //         scope: SPOTIFY_SCOPES,
    //         redirect_uri: SPOTIFY_REDIRECT_URI,
    //         code_challenge_method: 'S256',
    //         code_challenge: codeChallenge
    //     });

    //     window.location = `https://accounts.spotify.com/authorize?${args.toString()}`;
    // });


    function loadSettings() {
        const savedSettings = localStorage.getItem('audioPlayerSettings');
        if (savedSettings && audioPlayer) {
            const settings = JSON.parse(savedSettings);

            // Restore volume
            if (volumeSlider) volumeSlider.value = settings.volume;
            audioPlayer.volume = settings.volume;

            // Restore mute state
            isMuted = settings.isMuted;
            if (isMuted) {
                lastVolume = settings.volume;
                audioPlayer.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                updateVolumeIcon(0);
            } else {
                updateVolumeIcon(settings.volume);
            }

            // Restore loop state
            isLooping = settings.isLooping;
            audioPlayer.loop = isLooping;
            if (loopBtn) loopBtn.classList.toggle('active', isLooping);

            // Restore shuffle state
            isShuffling = settings.isShuffling;
            if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffling);

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

    // Spotify Auth Helper Functions
    // function generateRandomString(length) {
    //     const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     let text = '';

    //     for (let i = 0; i < length; i++) {
    //         text += possible.charAt(Math.floor(Math.random() * possible.length));
    //     }
    //     return text;
    // }

    // Spotify Functions
    // function handleSpotifyLogin() {
    //     const state = generateRandomString(16);
    //     localStorage.setItem('spotify_auth_state', state);

    //     const authUrl = new URL('https://accounts.spotify.com/authorize');
    //     authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
    //     authUrl.searchParams.append('response_type', 'code');
    //     authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    //     authUrl.searchParams.append('state', state);
    //     authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
    //     authUrl.searchParams.append('show_dialog', 'true');

    //     window.location.href = authUrl.toString();
    // }

    // function checkSpotifyAuthCallback() {
    //     // Check for Implicit flow response (in URL hash)
    //     const hash = window.location.hash.substring(1);
    //     const params = new URLSearchParams(hash);
    //     const accessToken = params.get('access_token');
    //     const expiresIn = params.get('expires_in');
    //     const tokenType = params.get('token_type');
    //     const state = params.get('state');
    //     const storedState = localStorage.getItem('spotify_auth_state');

    //     // Validate state if present
    //     if (accessToken && (!state || state === storedState)) {
    //         if (storedState) {
    //             localStorage.removeItem('spotify_auth_state');
    //         }

    //         // Store the token
    //         spotifyAccessToken = accessToken;
    //         localStorage.setItem('spotifyAccessToken', accessToken);
    //         localStorage.setItem('spotifyTokenExpiry', Date.now() + (expiresIn * 1000));

    //         // Clear the hash from URL
    //         window.history.pushState({}, document.title, window.location.pathname);

    //         // Initialize player
    //         window.initializeSpotifyPlayerCallback = initializeSpotifyPlayer;
    //         if (window.Spotify) {
    //             initializeSpotifyPlayer();
    //         }

    //         fetchSpotifyTracks();

    //         // Hide login button
    //         if (authContainer) authContainer.style.display = 'none';
    //     }
    // }

    // function initializeSpotifyPlayer() {
    //     // Check if Spotify SDK is loaded
    //     if (!window.Spotify) {
    //         console.error('Spotify SDK not loaded');
    //         return;
    //     }

    //     // Create new player instance
    //     spotifyPlayer = new Spotify.Player({
    //         name: 'Music EQ Optimizer',
    //         getOAuthToken: cb => { cb(spotifyAccessToken); },
    //         volume: volumeSlider ? volumeSlider.value : 0.5
    //     });

    //     // Ready event
    //     spotifyPlayer.addListener('ready', ({ device_id }) => {
    //         console.log('Spotify Player Ready with Device ID', device_id);
    //         deviceId = device_id;
    //         enableSpotifyControls(true);
    //         startPlayerStateMonitor();
    //     });

    //     // Not Ready event
    //     spotifyPlayer.addListener('not_ready', ({ device_id }) => {
    //         console.log('Device ID has gone offline', device_id);
    //         enableSpotifyControls(false);
    //     });

    //     // Player state changed
    //     spotifyPlayer.addListener('player_state_changed', state => {
    //         console.log('Player state changed:', state);
    //         spotifyPlayerState = state;
    //         updatePlayerUIFromSpotifyState(state);
    //     });

    //     // Error handling
    //     spotifyPlayer.addListener('initialization_error', ({ message }) => {
    //         console.error('Initialization Error:', message);
    //     });

    //     spotifyPlayer.addListener('authentication_error', ({ message }) => {
    //         console.error('Authentication Error:', message);
    //         handleSpotifyAuthError();
    //     });

    //     spotifyPlayer.addListener('account_error', ({ message }) => {
    //         console.error('Account Error:', message);
    //     });

    //     spotifyPlayer.addListener('playback_error', ({ message }) => {
    //         console.error('Playback Error:', message);
    //     });

    //     // Connect to the player
    //     spotifyPlayer.connect().then(success => {
    //         console.log('Spotify Player connection:', success ? 'successful' : 'failed');
    //         if (!success) {
    //             console.error('Failed to connect to Spotify Player');
    //         }
    //     });

    //     // Initialize equalizer with default settings
    //     spotifyPlayer.setEqualizer({
    //         bands: [
    //             { band: 0, gain: 0 }, // 60Hz
    //             { band: 1, gain: 0 }, // 170Hz
    //             { band: 2, gain: 0 }, // 310Hz
    //             { band: 3, gain: 0 }, // 600Hz
    //             { band: 4, gain: 0 }, // 1kHz
    //             { band: 5, gain: 0 }, // 3kHz
    //             { band: 6, gain: 0 }, // 6kHz
    //             { band: 7, gain: 0 }  // 12kHz
    //         ]
    //     });
    // }

    // function enableSpotifyControls(enabled) {
    //     const controls = [playBtn, prevBtn, nextBtn];
    //     controls.forEach(btn => {
    //         if (btn) {
    //             btn.disabled = !enabled;
    //             btn.style.opacity = enabled ? 1 : 0.5;
    //         }
    //     });
    // }

    // function handleSpotifyAuthError() {
    //     localStorage.removeItem('spotifyAccessToken');
    //     localStorage.removeItem('spotifyTokenExpiry');
    //     if (authContainer) authContainer.style.display = 'block';
    //     alert('Spotify authentication failed. Please login again.');
    // }

    function startPlayerStateMonitor() {
        // Check state every second
        const monitorInterval = setInterval(() => {
            if (spotifyPlayer && isSpotifyActive) {
                spotifyPlayer.getCurrentState().then(state => {
                    console.debug('Current player state:', state);
                    if (state) {
                        updatePlayerUIFromSpotifyState(state);
                    }
                });
            } else {
                clearInterval(monitorInterval);
            }
        }, 1000);
    }

    // Update your fetchSpotifyTracks function
    // async function fetchSpotifyTracks() {
    //     if (!spotifyAccessToken) {
    //         console.error('No access token available');
    //         return;
    //     }

    //     try {
    //         const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
    //             headers: {
    //                 'Authorization': `Bearer ${spotifyAccessToken}`
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         spotifyTracks = data.items.map(item => item.track);
    //         console.log('Fetched tracks:', spotifyTracks.length);

    //         // Make sure the track list container exists and is visible
    //         if (spotifyTrackList) {
    //             spotifyTrackList.style.display = 'block';
    //             populateSpotifyTrackList();
    //         } else {
    //             console.error('Spotify track list element not found');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching Spotify tracks:', error);
    //         // Handle token expiration
    //         if (error.message.includes('401')) {
    //             handleSpotifyAuthError();
    //         }
    //     }
    // }

    // function populateSpotifyTrackList() {
    //     if (!spotifyTrackList) return;

    //     spotifyTrackList.innerHTML = '';

    //     spotifyTracks.forEach((track, index) => {
    //         const trackItem = document.createElement('div');
    //         trackItem.className = 'spotify-track-item';
    //         trackItem.dataset.index = index;

    //         const trackImage = document.createElement('img');
    //         trackImage.className = 'spotify-track-image';
    //         trackImage.src = track.album.images[0]?.url || '';
    //         trackImage.alt = track.name;

    //         const trackInfo = document.createElement('div');
    //         trackInfo.className = 'spotify-track-info';

    //         const trackName = document.createElement('div');
    //         trackName.className = 'spotify-track-name';
    //         trackName.textContent = track.name;

    //         const trackArtist = document.createElement('div');
    //         trackArtist.className = 'spotify-track-artist';
    //         trackArtist.textContent = track.artists.map(artist => artist.name).join(', ');

    //         trackInfo.appendChild(trackName);
    //         trackInfo.appendChild(trackArtist);
    //         trackItem.appendChild(trackImage);
    //         trackItem.appendChild(trackInfo);

    //         trackItem.addEventListener('click', () => {
    //             playSpotifyTrack(index);
    //         });

    //         spotifyTrackList.appendChild(trackItem);
    //     });
    // }

    // function playSpotifyTrack(index) {
    //     if (!spotifyPlayer || !deviceId || index < 0 || index >= spotifyTracks.length) {
    //         console.error('Invalid playback conditions');
    //         return;
    //     }

    //     currentSpotifyTrackIndex = index;
    //     const trackUri = spotifyTracks[index].uri;

    //     fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    //         method: 'PUT',
    //         headers: {
    //             'Authorization': `Bearer ${spotifyAccessToken}`,
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             uris: [trackUri],
    //             position_ms: 0 // Start from beginning
    //         })
    //     })
    //         .then(response => {
    //             if (!response.ok) {
    //                 return response.json().then(err => {
    //                     throw new Error(err.error.message || 'Playback failed');
    //                 });
    //             }
    //             isPlaying = true;
    //             updatePlayButton();
    //             updateActiveSpotifyTrack(index);
    //             if (currentTrackTitle) {
    //                 currentTrackTitle.textContent = `${spotifyTracks[index].name} - ${spotifyTracks[index].artists.map(artist => artist.name).join(', ')}`;
    //             }
    //             console.log('Playing Spotify track:', spotifyTracks[index].name);
    //         })
    //         .catch(error => {
    //             console.error('Error playing Spotify track:', error);
    //             alert('Failed to play track: ' + error.message);
    //         });
    // }

    // function updateActiveSpotifyTrack(index) {
    //     if (!spotifyTrackList) return;

    //     const spotifyTrackItems = spotifyTrackList.querySelectorAll('.spotify-track-item');
    //     spotifyTrackItems.forEach((item, i) => {
    //         if (i === index) {
    //             item.classList.add('active');
    //         } else {
    //             item.classList.remove('active');
    //         }
    //     });
    // }

    // function updatePlayerUIFromSpotifyState(state) {
    //     if (!state) return;

    //     // Update play/pause button
    //     isPlaying = !state.paused;
    //     updatePlayButton();

    //     // Update progress bar
    //     if (state.position && state.duration && progressBar && currentTime && totalTime) {
    //         const progress = (state.position / state.duration) * 100;
    //         progressBar.value = progress;
    //         currentTime.textContent = formatTime(state.position / 1000);
    //         totalTime.textContent = formatTime(state.duration / 1000);
    //     }

    //     // Update current track info
    //     if (state.track_window?.current_track && currentTrackTitle) {
    //         const track = state.track_window.current_track;
    //         currentTrackTitle.textContent = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;

    //         // Find and update the active track in the list
    //         const trackIndex = spotifyTracks.findIndex(t => t.id === track.id);
    //         if (trackIndex !== -1) {
    //             currentSpotifyTrackIndex = trackIndex;
    //             updateActiveSpotifyTrack(trackIndex);
    //         }
    //     }
    // }

    // function switchSource(useSpotify) {
    //     if (useSpotify && !spotifyAccessToken) {
    //         if (authContainer) authContainer.style.display = 'block';
    //         return;
    //     }

    //     isSpotifyActive = useSpotify;
    //     saveSettings();

    //     // Update EQ controls UI
    //     const eqControls = document.querySelector('.custom-frequencies');
    //     if (useSpotify) {
    //         eqControls.classList.add('spotify-eq');
    //         // Add a tooltip or indicator
    //         const indicator = document.createElement('div');
    //         indicator.className = 'eq-mode-indicator';
    //         indicator.textContent = 'EQ: Spotify Mode';
    //         eqControls.appendChild(indicator);
    //     } else {
    //         eqControls.classList.remove('spotify-eq');
    //         const indicator = document.querySelector('.eq-mode-indicator');
    //         if (indicator) indicator.remove();
    //     }

    //     if (useSpotify) {
    //         if (localSourceBtn) localSourceBtn.classList.remove('active');
    //         if (spotifySourceBtn) spotifySourceBtn.classList.add('active');
    //         if (trackList) trackList.style.display = 'none';
    //         if (spotifyTrackList) spotifyTrackList.style.display = 'block';

    //         // Pause local player if playing
    //         if (isPlaying && !isSpotifyActive) {
    //             pauseTrack();
    //         }
    //     } else {
    //         if (localSourceBtn) localSourceBtn.classList.add('active');
    //         if (spotifySourceBtn) spotifySourceBtn.classList.remove('active');
    //         if (trackList) trackList.style.display = 'block';
    //         if (spotifyTrackList) spotifyTrackList.style.display = 'none';

    //         // Pause Spotify player if playing
    //         if (isPlaying && isSpotifyActive && spotifyPlayer) {
    //             spotifyPlayer.pause();
    //         }
    //     }
    // }

    // Audio Player Functions
    async function togglePlay() {
        if (isSpotifyActive) {
            // Check if player is ready
            if (!spotifyPlayer || !deviceId) {
                console.error('Spotify player not ready');
                alert('Spotify player not ready. Please try again.');
                return;
            }

            try {
                // Get current playback state
                const state = await spotifyPlayer.getCurrentState();

                if (!state) {
                    console.log('No active playback - starting first track');
                    if (spotifyTracks.length > 0) {
                        // Try to play first track if we have tracks
                        await playSpotifyTrack(0);
                    } else {
                        // If no tracks, try to resume playback (might work if there was previous playback)
                        await spotifyPlayer.resume();
                    }
                    return;
                }

                // Toggle play/pause based on current state
                if (state.paused) {
                    await spotifyPlayer.resume();
                    console.log('Playback resumed');
                    isPlaying = true;
                } else {
                    await spotifyPlayer.pause();
                    console.log('Playback paused');
                    isPlaying = false;
                }

                updatePlayButton();

                // Update UI with current state
                updatePlayerUIFromSpotifyState(state);

            } catch (error) {
                console.error('Playback control error:', error);

                // Handle specific error cases
                if (error.message.includes('NO_ACTIVE_DEVICE')) {
                    alert('Please open Spotify on another device and select this app as playback device');
                } else if (error.message.includes('PREMIUM_REQUIRED')) {
                    alert('Spotify Premium account required for playback');
                } else {
                    alert('Playback error: ' + error.message);
                }
            }
        } else {
            // Local file playback logic
            if (tracks.length === 0) {
                console.log('No tracks available');
                return;
            }

            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack();
            }
        }
    }

    async function playPrevious() {
        if (isSpotifyActive) {
            // Validate player readiness
            if (!spotifyPlayer || !deviceId) {
                console.error('Spotify player not ready');
                alert('Player not ready. Please try again.');
                return;
            }

            try {
                const state = await spotifyPlayer.getCurrentState();

                if (!state) {
                    console.error('No playback state available');
                    // If no state but we have tracks, play the last one
                    if (spotifyTracks.length > 0) {
                        const newIndex = (currentSpotifyTrackIndex - 1 + spotifyTracks.length) % spotifyTracks.length;
                        await playSpotifyTrack(newIndex);
                    }
                    return;
                }

                // If >3 seconds into song, restart current track
                if (state.position > 3000) {
                    await spotifyPlayer.seek(0);
                    console.log('Restarted current track');
                    return;
                }

                // Go to previous track with boundary checking
                let newIndex = currentSpotifyTrackIndex - 1;
                if (newIndex < 0) {
                    if (isLooping) {
                        newIndex = spotifyTracks.length - 1; // Wrap around if looping
                    } else {
                        newIndex = 0; // Stay on first track
                        await spotifyPlayer.seek(0); // Restart first track
                        return;
                    }
                }

                await playSpotifyTrack(newIndex);

            } catch (error) {
                console.error('Previous track error:', error);

                // Handle specific error cases
                if (error.message.includes('NO_ACTIVE_DEVICE')) {
                    alert('Please open Spotify on another device and select this player');
                } else if (error.message.includes('PREMIUM_REQUIRED')) {
                    alert('Spotify Premium required for this feature');
                } else {
                    alert('Failed to go to previous track: ' + error.message);
                }
            }
        } else {
            // Local file playback logic
            if (tracks.length === 0) {
                console.log('No tracks available');
                return;
            }

            if (audioPlayer.currentTime > 3) {
                // Restart current track if >3 seconds in
                audioPlayer.currentTime = 0;
            } else {
                // Go to previous track with boundary checking
                currentTrackIndex--;
                if (currentTrackIndex < 0) {
                    if (isLooping) {
                        currentTrackIndex = tracks.length - 1; // Wrap around
                    } else {
                        currentTrackIndex = 0; // Stay on first track
                        audioPlayer.currentTime = 0; // Restart
                        return;
                    }
                }
                loadTrack(currentTrackIndex);
                playTrack();
            }
        }
    }

    async function playNext() {
        if (isSpotifyActive) {
            // Validate player readiness
            if (!spotifyPlayer || !deviceId) {
                console.error('Spotify player not ready');
                alert('Player not ready. Please try again.');
                return;
            }

            try {
                // Calculate next track index based on shuffle mode
                let newIndex;
                if (isShuffling) {
                    // Improved shuffle logic that prevents immediate repeats
                    if (spotifyTracks.length <= 1) {
                        newIndex = 0;
                    } else {
                        const previousIndex = currentSpotifyTrackIndex;
                        do {
                            newIndex = Math.floor(Math.random() * spotifyTracks.length);
                        } while (newIndex === previousIndex);
                    }
                } else {
                    // Sequential play with loop consideration
                    newIndex = (currentSpotifyTrackIndex + 1) % spotifyTracks.length;
                    if (newIndex === 0 && !isLooping) {
                        // Reached end of playlist and not looping
                        console.log('Reached end of playlist');
                        await spotifyPlayer.pause();
                        isPlaying = false;
                        updatePlayButton();
                        return;
                    }
                }

                // Play the selected track
                await playSpotifyTrack(newIndex);

            } catch (error) {
                console.error('Next track error:', error);

                // Handle specific error cases
                if (error.message.includes('NO_ACTIVE_DEVICE')) {
                    alert('Please open Spotify on another device and select this player');
                } else if (error.message.includes('PREMIUM_REQUIRED')) {
                    alert('Spotify Premium required for this feature');
                } else {
                    alert('Failed to go to next track: ' + error.message);
                }
            }
        } else {
            // Local file playback logic
            if (tracks.length === 0) {
                console.log('No tracks available');
                return;
            }

            try {
                // Calculate next track index
                let newIndex;
                if (isShuffling) {
                    // Shuffle logic for local files
                    if (tracks.length <= 1) {
                        newIndex = 0;
                    } else {
                        const previousIndex = currentTrackIndex;
                        do {
                            newIndex = Math.floor(Math.random() * tracks.length);
                        } while (newIndex === previousIndex);
                    }
                } else {
                    // Sequential play for local files
                    newIndex = (currentTrackIndex + 1) % tracks.length;
                    if (newIndex === 0 && !isLooping) {
                        // Reached end of playlist and not looping
                        console.log('Reached end of playlist');
                        pauseTrack();
                        return;
                    }
                }

                // Update and play the track
                currentTrackIndex = newIndex;
                loadTrack(currentTrackIndex);
                playTrack();

            } catch (error) {
                console.error('Local playback error:', error);
                alert('Failed to play next track: ' + error.message);
            }
        }
    }

    function toggleMute() {
        isMuted = !isMuted;

        if (audioPlayer) {
            if (isMuted) {
                // Store current volume before muting
                lastVolume = audioPlayer.volume > 0 ? audioPlayer.volume : 0.5;
                audioPlayer.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                if (gainNode) {
                    gainNode.gain.value = 0;
                }
            } else {
                // Restore volume
                audioPlayer.volume = lastVolume;
                if (volumeSlider) volumeSlider.value = lastVolume;
                if (gainNode) {
                    gainNode.gain.value = lastVolume;
                }
            }
        }

        updateVolumeIcon(isMuted ? 0 : lastVolume);
        saveSettings();
    }

    function updateVolumeIcon(volume) {
        if (!volumeIcon) return;

        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute volume-icon';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down volume-icon';
        } else {
            volumeIcon.className = 'fas fa-volume-up volume-icon';
        }
    }

    function setupAudioContext() {
        if (!audioContext && window.AudioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            gainNode = audioContext.createGain();

            // Configure analyser
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;

            // Create EQ bands
            setupEqualizer();

            if (audioPlayer) {
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
            }

            // Start visualizations
            drawVisualizations();
        }
    }

    function setupEqualizer() {
        // Clear existing equalizer
        equalizer = [];

        if (!audioContext) return;

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
            // Check if we have the custom-frequencies container
            const customFreqContainer = document.querySelector('.custom-frequencies');
            if (!customFreqContainer) return;

            // Create a container for EQ sliders
            eqSliders = document.createElement('div');
            eqSliders.id = 'eqSliders';
            eqSliders.className = 'eq-sliders';

            // Add the EQ sliders to the custom frequencies section
            customFreqContainer.insertBefore(eqSliders, document.querySelector('.eq-button-group'));

            // Add a heading
            const heading = document.createElement('h4');
            heading.textContent = 'Adjust EQ';
            heading.style.margin = '40px 10px';
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

                    // If Spotify is active, update Spotify's equalizer
                    if (isSpotifyActive && spotifyPlayer) {
                        const bands = [];
                        for (let j = 0; j < freqBands.length; j++) {
                            const slider = document.getElementById(`eq-slider-${j}`);
                            if (slider) {
                                bands.push({
                                    band: j,
                                    gain: parseFloat(slider.value)
                                });
                            }
                        }
                        spotifyPlayer.setEqualizer({ bands });
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
        if (!analyser) {
            // Show simulated visualization for Spotify
            if (isSpotifyActive) {
                drawSimulatedVisualization();
            }
            return;
        }

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

    function drawSimulatedVisualization() {
        // Create simulated data that moves with the music
        const waveformCtx = waveformCanvas.getContext('2d');
        const equalizerCtx = equalizerCanvas.getContext('2d');

        function draw() {
            animationFrameId = requestAnimationFrame(draw);

            // Create simulated data based on time
            const time = Date.now() / 1000;
            const simulatedData = new Array(256).fill(0).map((_, i) => {
                return 128 + Math.sin(time * 2 + i / 20) * 50 * Math.random();
            });

            drawWaveform(waveformCtx, simulatedData);
            drawFrequencyBars(equalizerCtx, simulatedData);
        }

        draw();
    }

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

        // If Spotify is active, reset Spotify's equalizer too
        if (isSpotifyActive && spotifyPlayer) {
            const bands = [];
            for (let i = 0; i < freqBands.length; i++) {
                bands.push({
                    band: i,
                    gain: 0
                });
            }
            spotifyPlayer.setEqualizer({ bands });
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

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        const accessToken = await getAccessToken(code);
        localStorage.setItem('spotify_access_token', accessToken);
        initializeSpotifyPlayer(accessToken);
    } else {
        const token = localStorage.getItem('spotify_access_token');
        if (token) initializeSpotifyPlayer(token);
    }

    async function getAccessToken(code) {
        const codeVerifier = localStorage.getItem('code_verifier');

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: codeVerifier
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        const data = await response.json();
        return data.access_token;
    }

    function initializeSpotifyPlayer(token) {
        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(token); },
                volume: 0.8
            });

            // Error handling
            player.addListener('initialization_error', ({ message }) => console.error(message));
            player.addListener('authentication_error', ({ message }) => console.error(message));
            player.addListener('account_error', ({ message }) => console.error(message));
            player.addListener('playback_error', ({ message }) => console.error(message));

            // Ready
            player.addListener('ready', ({ device_id }) => {
                document.getElementById("spotifyStatus").textContent = `Spotify Player ready: ${device_id}`;
                transferPlaybackHere(device_id, token);
            });

            player.connect();
        };
    }

    function transferPlaybackHere(deviceId, token) {
        fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            body: JSON.stringify({
                device_ids: [deviceId],
                play: false
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    }


};
