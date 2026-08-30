import axios from 'axios';
import { ENV } from './env.config';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ndear_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const mapApiError = (error: any): string => {
  if (!error.response) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested record could not be found.';
    case 409:
      return message || 'This record has already been modified or exists.';
    case 422:
      return message || 'Please review the information entered.';
    case 429:
      return 'Too many requests. Please try again shortly.';
    case 500:
      return 'The service is temporarily unavailable.';
    default:
      return message || 'An unexpected system error occurred.';
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ndear_token');
      localStorage.removeItem('ndear_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
