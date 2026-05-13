/**
 * Authentication Store - Zustand with persistence
 * Manages auth state, tokens, and user information
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logout as logoutApi } from "../api";

export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  creado_en: string;
  roles: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  updateTokens: (tokens: Tokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: Tokens) => {
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      logout: async () => {
        // Get current refresh token before clearing state
        const refreshToken = get().refreshToken;
        
        // Try to revoke token on server (ignore errors - always clear local)
        if (refreshToken) {
          try {
            await logoutApi(refreshToken);
          } catch (error) {
            // Log error but continue with local logout
            console.warn("Failed to revoke refresh token on server:", error);
          }
        }
        
        // Clear local state regardless of API result
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      hasRole: (role: string): boolean => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some((r) => r.nombre === role);
      },

      updateTokens: (tokens: Tokens) => {
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
      },
    }),
    {
      name: "auth-storage",
      // Only persist tokens and basic user info, not transient state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
