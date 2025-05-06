# backend/app.py
from flask import Flask, request, jsonify
import librosa
import numpy as np
import joblib

app = Flask(__name__)

# Load your pre-trained model
model = joblib.load('eq_model.pkl')

@app.route('/predict_eq', methods=['POST'])
def predict_eq():
    file = request.files['audio']
    y, sr = librosa.load(file, sr=None)
    # Extract features (e.g., spectral centroid, bandwidth)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr).mean()
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr).mean()
    # ... extract other features as needed
    features = np.array([[centroid, bandwidth]])
    # Predict EQ settings
    eq_settings = model.predict(features)
    return jsonify({'low': eq_settings[0][0], 'mid': eq_settings[0][1], 'high': eq_settings[0][2]})
