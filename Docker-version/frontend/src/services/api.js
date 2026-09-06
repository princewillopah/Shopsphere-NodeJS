import axios from 'axios';
import { API_URL } from '../config';

// Single axios instance. baseURL is the backend origin + /api, supplied at
// build time via VITE_API_URL — nothing is hardcoded to localhost.
const api = axios.create({
  baseURL: API_URL,
});

// Attach the JWT (if present) as a Bearer token on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server rejects the token, drop it so the app returns to a logged-out state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;