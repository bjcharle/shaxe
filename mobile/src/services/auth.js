import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = 'shaxe_token';
const USER_KEY = 'shaxe_user';

const auth = {
  async setToken(token) {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async setUser(user) {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  },

  async getUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    const { token, user } = res.data;
    if (token) await this.setToken(token);
    if (user) await this.setUser(user);
    return res.data;
  },

  async signup(payload) {
    const res = await api.post('/auth/signup', payload);
    const { token, user } = res.data;
    if (token) await this.setToken(token);
    if (user) await this.setUser(user);
    return res.data;
  },

  async initiateKYC(data) {
    // data could be form data with files; backend should accept multipart/form-data
    const res = await api.post('/auth/verify-kyc', data);
    return res.data;
  }
};

export default auth;
