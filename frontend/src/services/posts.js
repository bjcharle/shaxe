import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const postsService = {
  async getFeed(page = 1, limit = 20) {
    const response = await api.get('/posts/feed', {
      params: { page, limit }
    });
    return response.data;
  },

  async createPost(content) {
    const response = await api.post('/posts', { content });
    return response.data;
  },

  async likePost(postId) {
    const response = await api.post(`/engagement/like/${postId}`);
    return response.data;
  },

  async dislikePost(postId) {
    const response = await api.post(`/engagement/dislike/${postId}`);
    return response.data;
  },

  async sharePost(postId) {
    const response = await api.post(`/engagement/share/${postId}`);
    return response.data;
  },

  async bookmarkPost(postId) {
    const response = await api.post(`/engagement/bookmark/${postId}`);
    return response.data;
  }
};
