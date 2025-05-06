# audio_analysis/analyzer.py
import librosa
import numpy as np
from scipy import signal
import matplotlib.pyplot as plt

def analyze_audio(file_path):
    # Load audio file
    y, sr = librosa.load(file_path, sr=None)
    
    # Compute frequency spectrum
    n_fft = 2048
    S = librosa.stft(y, n_fft=n_fft)
    S_db = librosa.amplitude_to_db(np.abs(S), ref=np.max)
    
    # Compute mean spectrum
    mean_spectrum = np.mean(S_db, axis=1)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    
    return {
        'frequencies': freqs.tolist(),
        'spectrum': mean_spectrum.tolist(),
        'sample_rate': sr,
        'duration': librosa.get_duration(y=y, sr=sr)
    }

def recommend_eq(spectrum, freqs):
    # Basic EQ recommendation logic
    target_curve = np.ones_like(spectrum) * -5  # Flat curve
    eq_gains = target_curve - np.array(spectrum)
    
    # Smooth the EQ curve
    b, a = signal.butter(4, 0.1)
    eq_gains_smoothed = signal.filtfilt(b, a, eq_gains)
    
    return eq_gains_smoothed.tolist()