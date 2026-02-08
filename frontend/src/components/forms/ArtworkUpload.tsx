/**
 * Artwork Upload Component - handles podcast cover art uploads
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import ArtworkPreview from './ArtworkPreview';

interface ArtworkUploadProps {
  showId: string;
  onUploadComplete?: (artwork: any) => void;
}

export default function ArtworkUpload({ showId, onUploadComplete }: ArtworkUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedArtwork, setUploadedArtwork] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/shows/${showId}/artwork`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload artwork');
      }

      const artwork = await response.json();
      setUploadedArtwork(artwork);
      onUploadComplete?.(artwork);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-8l-3.172-3.172a4 4 0 00-5.656 0L28 20M8 40v-8m24-12L15 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="flex text-sm text-gray-600">
            <label className="relative cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500">
                {isUploading ? 'Uploading...' : 'Upload an image'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-gray-500">PNG or JPG (minimum 3000x3000px, max 5MB)</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {uploadedArtwork && <ArtworkPreview artwork={uploadedArtwork} />}
    </div>
  );
}
