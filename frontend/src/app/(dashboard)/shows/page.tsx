'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateShowForm } from '@/components/forms/CreateShowForm';

export default function ShowsPage() {
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.PODCASTS.LIST);
      setPodcasts(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(apiClient.handleError(err as any) || 'Failed to load podcasts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (podcastId: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) {
      return;
    }

    try {
      await apiClient.delete(API_ENDPOINTS.PODCASTS.DELETE(podcastId));
      setPodcasts(podcasts.filter((p) => p.id !== podcastId));
    } catch (err) {
      setError(apiClient.handleError(err as any) || 'Failed to delete podcast');
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Podcasts</h1>
          <p className="mt-2 text-slate-600">Manage your podcast shows</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          Create New Podcast
        </Button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">{error}</div>}

      {showCreateForm && (
        <div className="mb-6">
          <CreateShowForm
            onSuccess={() => {
              setShowCreateForm(false);
              fetchPodcasts();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading podcasts...</div>
      ) : podcasts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">No podcasts yet.</p>
            <Button onClick={() => setShowCreateForm(true)} className="mt-4">
              Create your first podcast
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">{podcast.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="mb-4 flex-1 text-sm text-slate-600 line-clamp-2">
                  {podcast.description}
                </p>
                <div className="mb-4 space-y-2 text-xs text-slate-500">
                  <div>Author: {podcast.author || 'N/A'}</div>
                  <div>Language: {podcast.language}</div>
                  <div>
                    Status:{' '}
                    <span
                      className={`font-medium ${
                        podcast.is_published ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {podcast.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/shows/${podcast.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleDelete(podcast.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
