/**
 * Artwork Upload Component - handles podcast and episode cover art uploads
 * Features: Drag & drop, file validation, progress tracking, signed URL support
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import ArtworkPreview from '@/components/podcast/ArtworkPreview';
import ValidationWarning from '@/components/ui/ValidationWarning';

interface ArtworkUploadProps {
  showId: string;
  episodeId?: string;
  onUploadComplete?: (artwork: ArtworkResponse) => void;
  onError?: (error: string) => void;
}

export interface ArtworkResponse {
  id: string;
  url: string;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  validation_status: 'PASSED' | 'PASSED_WITH_WARNING' | 'FAILED';
  validation_warnings: string[];
  is_valid: boolean;
}

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ArtworkUpload({
  showId,
  episodeId,
  onUploadComplete,
  onError,
}: ArtworkUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedArtwork, setUploadedArtwork] = useState<ArtworkResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file format. Please use JPEG, PNG, or WebP.`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum of 10MB.`,
      };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid file';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Build endpoint URL
      const endpoint = episodeId
        ? `/api/shows/${showId}/episodes/${episodeId}/artwork`
        : `/api/shows/${showId}/artwork`;

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const artwork = JSON.parse(xhr.responseText) as ArtworkResponse;
          setUploadedArtwork(artwork);
          setUploadProgress(0);
          onUploadComplete?.(artwork);
        } else {
          const errorData = JSON.parse(xhr.responseText);
          const errorMsg = errorData.detail || 'Failed to upload artwork';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      });

      xhr.addEventListener('error', () => {
        const errorMsg = 'Network error during upload';
        setError(errorMsg);
        onError?.(errorMsg);
      });

      const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
      xhr.open('POST', endpoint);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
          dragOverRef.current
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        <div className="space-y-2">
          {/* Upload Icon */}
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

          {/* Upload Instructions */}
          <div>
            <p className="text-sm text-gray-700">
              {isUploading ? (
                <span>Uploading... {Math.round(uploadProgress)}%</span>
              ) : (
                <>
                  <span className="font-semibold text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  {' or drag and drop'}
                </>
              )}
            </p>
          </div>

          {/* File Requirements */}
          <p className="text-xs text-gray-500">JPEG, PNG, or WebP (Max 10MB)</p>
          <p className="text-xs text-gray-400">Recommended: 3000x3000px or larger</p>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-semibold">Error: </span>
            {error}
          </p>
        </div>
      )}

      {/* Preview with Validation Status */}
      {uploadedArtwork && (
        <div className="space-y-3">
          <ArtworkPreview artwork={uploadedArtwork} />
          {uploadedArtwork.validation_warnings.length > 0 && (
            <ValidationWarning warnings={uploadedArtwork.validation_warnings} />
          )}
        </div>
      )}
    </div>
  );
}
