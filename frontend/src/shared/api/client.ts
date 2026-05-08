/**
 * Axios instance with interceptors for authentication
 * Automatically adds Authorization header and handles token refresh
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../features/auth/store/authStore';
import { refreshToken as refreshTokenAPI } from '../features/auth/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request interceptor: Add Authorization header
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 and refresh token
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken, logout, updateTokens } = useAuthStore.getState();

      if (!refreshToken) {
        // No refresh token, logout
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If we're already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (error: Error) => reject(error),
          });
        });
      }

      // Start refresh
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newTokens = await refreshTokenAPI(refreshToken);
        updateTokens(newTokens);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        processQueue(null, newTokens.access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        logout();
        window.location.href = '/login';
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
