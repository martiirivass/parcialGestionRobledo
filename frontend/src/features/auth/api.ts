/**
 * Auth API - Axios functions for authentication endpoints
 */
import axios from 'axios';
import { User, Tokens } from './store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

/**
 * Register a new user account
 * @throws Error if registration fails
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/api/v1/auth/register`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Email is already registered');
    }
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
}

/**
 * Login with email and password
 * @throws Error if login fails
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/api/v1/auth/login`,
      credentials
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    }
    if (error.response?.status === 429) {
      throw new Error('Too many login attempts. Please try again later.');
    }
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
}

/**
 * Refresh access token using refresh token
 * @throws Error if refresh fails
 */
export async function refreshToken(refreshToken: string): Promise<Tokens> {
  try {
    const response = await axios.post<Tokens>(
      `${API_URL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(error.response?.data?.detail || 'Token refresh failed');
  }
}

/**
 * Logout and revoke refresh token
 * @throws Error if logout fails
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await axios.post(
      `${API_URL}/api/v1/auth/logout`,
      { refresh_token: refreshToken }
    );
  } catch (error: any) {
    // Logout still succeeds even if endpoint fails
    console.error('Logout error:', error);
  }
}

/**
 * Get current user profile
 * @throws Error if request fails
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  try {
    const response = await axios.get<User>(
      `${API_URL}/api/v1/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to fetch user');
  }
}
