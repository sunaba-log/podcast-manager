/**
 * Episode Management Page - manage podcast episodes
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import CreateEpisodeForm from '@/components/forms/CreateEpisodeForm';
import EditEpisodeForm from '@/components/forms/EditEpisodeForm';
import EpisodeList from '@/components/podcast/EpisodeList';

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

export default function EpisodesPage() {
  const params = useParams();
  const showId = params.id as string;

  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setEditingEpisode(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Episodes</h1>
        <p className="mt-2 text-gray-600">Manage episodes for your podcast</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">All Episodes</h2>
            <EpisodeList showId={showId} onEdit={setEditingEpisode} refreshTrigger={refreshKey} />
          </div>
        </div>

        <div className="space-y-4">
          {editingEpisode ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Episode</h2>
                <button
                  onClick={() => setEditingEpisode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <EditEpisodeForm
                showId={showId}
                episode={editingEpisode}
                onSuccess={handleEditSuccess}
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Episode</h2>
              <CreateEpisodeForm showId={showId} onSuccess={handleCreateSuccess} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
