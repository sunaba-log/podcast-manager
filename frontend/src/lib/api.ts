import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Type definitions for API responses
export interface ApiErrorResponse {
  detail: string | { msg: string; type: string }[];
  status_code?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface PodcastResponse {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  cover_art_url: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodeResponse {
  id: string;
  podcast_id: string;
  title: string;
  description: string;
  audio_url: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string | null;
}

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Add authorization header
    this.instance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor: Handle errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth token management
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.token = token;
      }
    }
  }

  clearAuth(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  // Multipart form data upload (for file uploads)
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  }

  // Error handling utility
  static handleError(error: AxiosError<ApiErrorResponse>): string {
    if (error.response?.data) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map((e: any) => e.msg).join(', ');
      }
    }
    return error.message || 'An error occurred';
  }
}

export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  // Podcasts
  PODCASTS: {
    LIST: '/api/shows',
    CREATE: '/api/shows',
    GET: (id: string) => `/api/shows/${id}`,
    UPDATE: (id: string) => `/api/shows/${id}`,
    DELETE: (id: string) => `/api/shows/${id}`,
    FEED_URL: (id: string) => `/api/shows/${id}/feed-url`,
  },
  // Episodes
  EPISODES: {
    LIST: (podcastId: string) => `/api/shows/${podcastId}/episodes`,
    CREATE: (podcastId: string) => `/api/shows/${podcastId}/episodes`,
    GET: (podcastId: string, episodeId: string) => `/api/shows/${podcastId}/episodes/${episodeId}`,
    UPDATE: (podcastId: string, episodeId: string) =>
      `/api/shows/${podcastId}/episodes/${episodeId}`,
    DELETE: (podcastId: string, episodeId: string) =>
      `/api/shows/${podcastId}/episodes/${episodeId}`,
    PUBLISH: (podcastId: string, episodeId: string) =>
      `/api/shows/${podcastId}/episodes/${episodeId}/publish`,
  },
  // Audio files
  AUDIO: {
    SIGNED_URL: '/api/audio/signed-url',
    METADATA: (podcastId: string, episodeId: string) =>
      `/api/shows/${podcastId}/episodes/${episodeId}/audio`,
    UPLOAD_SIGNED_URL: '/api/audio/upload-signed-url',
  },
  // Artwork
  ARTWORK: {
    GET: (podcastId: string) => `/api/shows/${podcastId}/artwork`,
    UPLOAD: (podcastId: string) => `/api/shows/${podcastId}/artwork`,
    DELETE: (podcastId: string) => `/api/shows/${podcastId}/artwork`,
  },
  // Team
  TEAM: {
    MEMBERS: (podcastId: string) => `/api/shows/${podcastId}/members`,
    INVITE: (podcastId: string) => `/api/shows/${podcastId}/members/invite`,
    UPDATE_ROLE: (podcastId: string, userId: string) =>
      `/api/shows/${podcastId}/members/${userId}/role`,
    REMOVE: (podcastId: string, userId: string) => `/api/shows/${podcastId}/members/${userId}`,
  },
  // RSS Feeds
  FEEDS: {
    GET: (feedUrl: string) => `/feeds/shows/${feedUrl}/rss.xml`,
    PREVIEW: (podcastId: string) => `/api/shows/${podcastId}/feed-preview`,
  },
};

export default apiClient;
