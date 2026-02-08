/**
 * Episode List Component - displays episodes for a podcast
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Episode {
  id: string;
  title: string;
  description: string;
  episode_number: number | null;
  published_at: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  created_at: string;
}

interface EpisodeListProps {
  showId: string;
  onEdit?: (episode: Episode) => void;
  onDelete?: (episodeId: string) => void;
  refreshTrigger?: number;
}

export default function EpisodeList({
  showId,
  onEdit,
  onDelete,
  refreshTrigger,
}: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/shows/${showId}/episodes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }

      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, [showId, refreshTrigger]);

  const handleDelete = async (episodeId: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) {
      return;
    }

    try {
      // In Phase 4, we'll add a delete endpoint
      // For now, just call the callback
      onDelete?.(episodeId);
    } catch (err) {
      setError('Failed to delete episode');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No episodes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <div
          key={episode.id}
          className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {episode.episode_number && (
                    <span className="text-gray-500">#{episode.episode_number} — </span>
                  )}
                  {episode.title}
                </h3>
                {episode.is_published && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Published
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{episode.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>Published: {formatDate(episode.published_at)}</span>
                {episode.duration_seconds && (
                  <span>Duration: {formatDuration(episode.duration_seconds)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => onEdit?.(episode)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(episode.id)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
