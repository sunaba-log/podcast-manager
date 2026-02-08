/**
 * Edit Episode Form Component
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  description: string;
  episode_number: number | null;
  published_at: string | null;
}

interface EditEpisodeFormProps {
  showId: string;
  episode: Episode;
  onSuccess?: (episode: any) => void;
}

export default function EditEpisodeForm({ showId, episode, onSuccess }: EditEpisodeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episode_number: '',
    published_at: '',
  });

  // Initialize form with episode data
  useEffect(() => {
    if (episode) {
      setFormData({
        title: episode.title,
        description: episode.description,
        episode_number: episode.episode_number?.toString() || '',
        published_at: episode.published_at
          ? new Date(episode.published_at).toISOString().slice(0, 16)
          : '',
      });
    }
  }, [episode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        episode_number: formData.episode_number ? parseInt(formData.episode_number) : null,
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
      };

      const response = await fetch(`/api/shows/${showId}/episodes/${episode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update episode');
      }

      const updatedEpisode = await response.json();
      onSuccess?.(updatedEpisode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg border border-gray-200"
    >
      {error && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Episode title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Episode description"
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Episode Number</label>
          <Input
            type="number"
            name="episode_number"
            value={formData.episode_number}
            onChange={handleChange}
            placeholder="1"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
          <Input
            type="datetime-local"
            name="published_at"
            value={formData.published_at}
            onChange={handleChange}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Episode'
        )}
      </Button>
    </form>
  );
}
