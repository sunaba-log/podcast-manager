import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.instance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          this.token = null;
          // Redirect logic can be added here
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

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
}

export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
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
  },
  // Audio files
  AUDIO: {
    SIGNED_URL: '/api/audio/signed-url',
    METADATA: (podcastId: string, episodeId: string) =>
      `/api/shows/${podcastId}/episodes/${episodeId}/audio`,
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
  },
};

export default apiClient;
