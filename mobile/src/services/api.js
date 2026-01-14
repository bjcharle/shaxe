import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mobile default API base - adjust as needed for emulator/device
const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// Attach token from AsyncStorage to each request if present
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('shaxe_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
