'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelect } from '@/components/ui/LanguageSelect';

interface EditShowFormProps {
  podcastId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditShowForm({ podcastId, onSuccess, onCancel }: EditShowFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    category: '',
    language: 'ja',
  });

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        setIsFetching(true);
        const response = await apiClient.get(API_ENDPOINTS.PODCASTS.GET(podcastId));
        setFormData({
          title: response.title,
          description: response.description,
          author: response.author || '',
          category: response.category || '',
          language: response.language || 'ja',
        });
      } catch (err) {
        setError(apiClient.handleError(err as any) || 'Failed to load podcast');
      } finally {
        setIsFetching(false);
      }
    };

    fetchPodcast();
  }, [podcastId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.put(API_ENDPOINTS.PODCASTS.UPDATE(podcastId), formData);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(apiClient.handleError(err as any) || 'Failed to update podcast');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Podcast</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Podcast Title *
            </label>
            <Input
              id="title"
              name="title"
              placeholder="My Awesome Podcast"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={1}
              maxLength={255}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your podcast..."
              value={formData.description}
              onChange={handleChange}
              required
              minLength={1}
              rows={4}
              disabled={isLoading}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-slate-700">
                Author
              </label>
              <Input
                id="author"
                name="author"
                placeholder="Your name"
                value={formData.author}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                Category
              </label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Technology"
                value={formData.category}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-slate-700">
              Language *
            </label>
            <LanguageSelect
              id="language"
              name="language"
              value={formData.language}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
