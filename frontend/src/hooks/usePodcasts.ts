import { useState, useCallback } from 'react';
import apiClient, { API_ENDPOINTS } from '@/lib/api';

interface Podcast {
  id: string;
  title: string;
  description?: string;
  author?: string;
  category?: string;
  language: string;
  feedUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const usePodcasts = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPodcasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Podcast[]>(API_ENDPOINTS.PODCASTS.LIST);
      setPodcasts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch podcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPodcast = useCallback(async (podcastData: Partial<Podcast>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<Podcast>(API_ENDPOINTS.PODCASTS.CREATE, podcastData);
      setPodcasts((prev) => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create podcast');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePodcast = useCallback(async (id: string, podcastData: Partial<Podcast>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.put<Podcast>(API_ENDPOINTS.PODCASTS.UPDATE(id), podcastData);
      setPodcasts((prev) => prev.map((p) => (p.id === id ? data : p)));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update podcast');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePodcast = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(API_ENDPOINTS.PODCASTS.DELETE(id));
      setPodcasts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete podcast');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    podcasts,
    loading,
    error,
    fetchPodcasts,
    createPodcast,
    updatePodcast,
    deletePodcast,
  };
};
