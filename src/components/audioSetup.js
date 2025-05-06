// frontend/src/audioSetup.js
export const setupAudioGraph = (audioElement, eqSettings) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioElement);

    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 320;
    lowShelf.gain.value = eqSettings.low;

    const peaking = audioContext.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 1000;
    peaking.Q.value = 1;
    peaking.gain.value = eqSettings.mid;

    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = eqSettings.high;

    source.connect(lowShelf);
    lowShelf.connect(peaking);
    peaking.connect(highShelf);
    highShelf.connect(audioContext.destination);
};
