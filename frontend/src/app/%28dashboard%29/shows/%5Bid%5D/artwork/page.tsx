/**
 * Artwork Management Page - manage podcast cover art
 * T055: Show-level artwork management
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArtworkUpload, { ArtworkResponse } from '@/components/forms/ArtworkUpload';
import ArtworkPreview from '@/components/podcast/ArtworkPreview';
import ValidationWarning from '@/components/ui/ValidationWarning';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';

export default function ArtworkPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params.id as string;

  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Fetch current artwork
  const fetchArtwork = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      const response = await fetch(`/api/shows/${showId}/artwork`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 404) {
        setArtwork(null);
        setShowUploadForm(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch artwork');
      }

      const data: ArtworkResponse = await response.json();
      setArtwork(data);
      setShowUploadForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowUploadForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtwork();
  }, [showId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this artwork? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      const response = await fetch(`/api/shows/${showId}/artwork`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setArtwork(null);
      setShowUploadForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artwork');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadComplete = (newArtwork: ArtworkResponse) => {
    setArtwork(newArtwork);
    setShowUploadForm(false);
    setError(null);
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Podcast Artwork</h1>
        <p className="mt-2 text-gray-600">
          Upload and manage your podcast cover art. Ensure your artwork meets platform requirements
          for the best appearance on Apple Podcasts, Spotify, and other podcast directories.
        </p>
      </div>

      {/* Error Messages */}
      {error && (
        <ValidationWarning
          message={error}
          type="error"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : artwork && !showUploadForm ? (
        // Current Artwork Display
        <div className="space-y-6">
          <ArtworkPreview artwork={artwork} />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => setShowUploadForm(true)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Replace Artwork
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
        // Upload Form
        <div className="space-y-6">
          <ArtworkUpload
            showId={showId}
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </div>
      )}

      {/* Requirements Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Artwork Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-2">Dimensions</p>
            <ul className="space-y-1">
              <li>✓ Recommended: 3000 × 3000 pixels</li>
              <li>✓ Minimum: 1000 × 1000 pixels</li>
              <li>✓ Aspect ratio: Square (1:1)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">File Details</p>
            <ul className="space-y-1">
              <li>✓ Formats: JPEG, PNG, WebP</li>
              <li>✓ Maximum size: 10 MB</li>
              <li>✓ Quality: RGB color mode</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Platform Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-900">Apple Podcasts</p>
            <p>Requires minimum 3000 × 3000 pixels for best quality display</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Spotify</p>
            <p>Recommends 3000 × 3000 pixels for optimal appearance on all devices</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Other Platforms</p>
            <p>Most podcast directories support artwork of 1400 × 1400 pixels and above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
