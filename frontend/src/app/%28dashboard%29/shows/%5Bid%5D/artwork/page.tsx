/**
 * Artwork Management Page - manage podcast cover art
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArtworkUpload from '@/components/forms/ArtworkUpload';
import ArtworkPreview from '@/components/podcast/ArtworkPreview';
import ValidationWarning from '@/components/ui/ValidationWarning';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Artwork {
  id: string;
  url: string;
  width: number;
  height: number;
  file_size: number;
  is_valid: boolean;
  warnings?: string[];
}

export default function ArtworkPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params.id as string;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current artwork
  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await fetch(`/api/shows/${showId}/artwork`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.status === 404) {
          setArtwork(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch artwork');
        }

        const data = await response.json();
        setArtwork(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [showId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this artwork?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/shows/${showId}/artwork`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setArtwork(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artwork');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Podcast Artwork</h1>
        <p className="mt-2 text-gray-600">Upload and manage your podcast cover art</p>
      </div>

      {error && <ValidationWarning message={error} type="error" title="Error" />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : artwork ? (
        <div className="space-y-6">
          <ArtworkPreview artwork={artwork} />

          <div className="flex gap-3">
            <Button onClick={() => setArtwork(null)} variant="outline">
              Upload New
            </Button>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <ArtworkUpload
          showId={showId}
          onUploadComplete={(newArtwork) => {
            setArtwork(newArtwork);
          }}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Artwork Requirements</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Minimum dimensions: 3000 × 3000 pixels</li>
          <li>✓ Supported formats: JPEG, PNG</li>
          <li>✓ Maximum file size: 5 MB</li>
          <li>✓ Square aspect ratio recommended</li>
        </ul>
      </div>
    </div>
  );
}
