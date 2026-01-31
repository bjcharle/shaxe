import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const postsService = {
  async getFeed(page = 1, limit = 20) {
    const response = await axios.get(`${API_URL}/posts/feed`, {
      params: { page, limit }
    });
    return response.data;
  },

  async createPost(content) {
    const response = await axios.post(`${API_URL}/posts`, { content });
    return response.data;
  },

  async likePost(postId) {
    const response = await axios.post(`${API_URL}/engagement/like/${postId}`);
    return response.data;
  },

  async dislikePost(postId) {
    const response = await axios.post(`${API_URL}/engagement/dislike/${postId}`);
    return response.data;
  },

  async sharePost(postId) {
    const response = await axios.post(`${API_URL}/engagement/share/${postId}`);
    return response.data;
  },

  async bookmarkPost(postId) {
    const response = await axios.post(`${API_URL}/engagement/bookmark/${postId}`);
    return response.data;
  }
};
