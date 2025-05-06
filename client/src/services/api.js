// client/src/services/api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000' });

export const uploadAudio = (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    return API.post('/api/upload', formData);
};

export const analyzeAudio = (fileId) => API.get(`/api/analyze/${fileId}`);