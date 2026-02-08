/**
 * Edit Episode Form Component
 * T056: Integrated with artwork management
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import ArtworkUpload, { ArtworkResponse } from './ArtworkUpload';
import ArtworkPreview from '@/components/podcast/ArtworkPreview';
import ValidationWarning from '@/components/ui/ValidationWarning';

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
  const [showArtworkSection, setShowArtworkSection] = useState(false);
  const [episodeArtwork, setEpisodeArtwork] = useState<ArtworkResponse | null>(null);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(false);
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

    // Fetch episode artwork if available
    fetchEpisodeArtwork();
  }, [episode]);

  const fetchEpisodeArtwork = async () => {
    setIsLoadingArtwork(true);
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      const response = await fetch(`/api/shows/${showId}/episodes/${episode.id}/artwork`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 404) {
        setEpisodeArtwork(null);
        return;
      }

      if (response.ok) {
        const artwork = await response.json();
        setEpisodeArtwork(artwork);
      }
    } catch (err) {
      // Silently fail - artwork is optional
      console.error('Failed to fetch episode artwork:', err);
    } finally {
      setIsLoadingArtwork(false);
    }
  };

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

      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      const response = await fetch(`/api/shows/${showId}/episodes/${episode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
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

  const handleArtworkUploadComplete = (artwork: ArtworkResponse) => {
    setEpisodeArtwork(artwork);
  };

  const handleDeleteArtwork = async () => {
    if (!confirm('Delete this episode artwork?')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      const response = await fetch(`/api/shows/${showId}/episodes/${episode.id}/artwork`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        setEpisodeArtwork(null);
      }
    } catch (err) {
      console.error('Failed to delete artwork:', err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg border border-gray-200"
    >
      {/* Error Message */}
      {error && (
        <ValidationWarning
          message={error}
          type="error"
          title="Error updating episode"
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Episode Metadata Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Episode Information</h3>

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
            placeholder="Episode description / Show Notes"
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
      </div>

      {/* Artwork Section */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowArtworkSection(!showArtworkSection)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Episode Artwork (Optional)</h3>
          {showArtworkSection ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <p className="mt-2 text-sm text-gray-600">
          Optionally upload custom artwork for this episode. If not provided, the podcast's cover
          art will be used.
        </p>

        {showArtworkSection && (
          <div className="mt-6 space-y-6">
            {isLoadingArtwork ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : episodeArtwork ? (
              <div className="space-y-4">
                <ArtworkPreview artwork={episodeArtwork} />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setEpisodeArtwork(null);
                    }}
                    variant="outline"
                  >
                    Replace Artwork
                  </Button>
                  <Button type="button" onClick={handleDeleteArtwork} variant="destructive">
                    Delete Artwork
                  </Button>
                </div>
              </div>
            ) : (
              <ArtworkUpload
                showId={showId}
                episodeId={episode.id}
                onUploadComplete={handleArtworkUploadComplete}
              />
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
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
