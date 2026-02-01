'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditShowForm } from '@/components/forms/EditShowForm';

interface PodcastDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PodcastDetailsPage({ params }: PodcastDetailsPageProps) {
  const router = useRouter();
  const [podcast, setPodcast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.PODCASTS.GET(params.id));
        setPodcast(response);
      } catch (err) {
        setError(apiClient.handleError(err as any) || 'Failed to load podcast');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcast();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this podcast?')) {
      return;
    }

    try {
      await apiClient.delete(API_ENDPOINTS.PODCASTS.DELETE(params.id));
      router.push('/dashboard/shows');
    } catch (err) {
      setError(apiClient.handleError(err as any) || 'Failed to delete podcast');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error && !podcast) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Podcast not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">{error}</div>}

      {isEditing ? (
        <EditShowForm
          podcastId={params.id}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{podcast.title}</h1>
              <p className="mt-2 text-slate-600">{podcast.description}</p>
            </div>
            <Link href="/dashboard/shows" className="text-slate-600 hover:text-slate-900">
              ← Back
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-slate-600">Author</div>
                  <div className="text-slate-900">{podcast.author || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Category</div>
                  <div className="text-slate-900">{podcast.category || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Language</div>
                  <div className="text-slate-900">{podcast.language}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Feed URL</div>
                  <div className="break-all text-sm text-blue-600 hover:text-blue-800">
                    <a
                      href={`/feeds/${podcast.feed_url}/rss.xml`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {`/feeds/${podcast.feed_url}/rss.xml`}
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Status</div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        podcast.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {podcast.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Podcast
                </Button>
                <Link href={`/dashboard/shows/${params.id}/episodes`} className="block">
                  <Button variant="outline" className="w-full">
                    Manage Episodes
                  </Button>
                </Link>
                <Link href={`/dashboard/shows/${params.id}/artwork`} className="block">
                  <Button variant="outline" className="w-full">
                    Manage Artwork
                  </Button>
                </Link>
                <Button onClick={handleDelete} variant="destructive" className="w-full">
                  Delete Podcast
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm">
                  <div>
                    <div className="font-medium text-slate-600">Created</div>
                    <div className="text-slate-900">
                      {new Date(podcast.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-600">Last Updated</div>
                    <div className="text-slate-900">
                      {new Date(podcast.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
