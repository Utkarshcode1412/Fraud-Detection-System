/**
 * client.js
 * ---------
 * Single Axios instance for all API calls to the Node backend. The
 * frontend NEVER calls Flask directly (per the architecture) -- this
 * baseURL always points at Node.
 *
 * A request interceptor attaches the JWT automatically so individual
 * page components never touch tokens directly, and a response
 * interceptor centrally handles 401s (expired/invalid token) by
 * logging the analyst out -- one place instead of every fetch call.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentry_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentry_token');
      localStorage.removeItem('sentry_admin');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
