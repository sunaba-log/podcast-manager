'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiClient.setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        username,
        password,
      });
      setUser(response);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail[0]?.msg || { msg: 'Registration failed' });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      setToken(response.access_token);
      setUser(response.user);

      // Store in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Set token in API client
      apiClient.setToken(response.access_token);

      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    apiClient.setToken(null);
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async () => {
    if (!token) {
      throw new Error('No token to refresh');
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {});
      setToken(response.access_token);
      localStorage.setItem('access_token', response.access_token);
      apiClient.setToken(response.access_token);
      return response;
    } catch (error: any) {
      logout();
      throw new Error(error.response?.data?.detail || 'Token refresh failed');
    }
  }, [token, logout]);

  const getMe = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error: any) {
      logout();
      throw new Error(error.response?.data?.detail || 'Failed to fetch user');
    }
  }, [logout]);

  return {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    refreshToken,
    getMe,
    isAuthenticated: !!token,
  };
}
