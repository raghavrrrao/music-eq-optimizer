# backend/train_model.py
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

# X: extracted features, y: corresponding EQ settings
X = np.load('features.npy')
y = np.load('eq_settings.npy')

model = RandomForestRegressor()
model.fit(X, y)

joblib.dump(model, 'eq_model.pkl')
