"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, User, AuthResponse } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<User>;
  logout: () => void;
  loginWithGoogle: () => void;
  loginWithGithub: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const user = await authService.getProfile(token);
          dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          authService.removeToken();
          dispatch({ type: 'SET_USER', payload: null });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: AuthResponse = await authService.login({ email, password });
      authService.setToken(response.access_token);
      dispatch({ type: 'SET_USER', payload: response.user });
      return response.user;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: AuthResponse = await authService.register({ 
        email, 
        password, 
        firstName, 
        lastName 
      });
      authService.setToken(response.access_token);
      dispatch({ type: 'SET_USER', payload: response.user });
      return response.user;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const loginWithGoogle = () => {
    authService.initiateGoogleAuth();
  };

  const loginWithGithub = () => {
    authService.initiateGithubAuth();
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({ type: 'SET_USER', payload: userData });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGithub,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
