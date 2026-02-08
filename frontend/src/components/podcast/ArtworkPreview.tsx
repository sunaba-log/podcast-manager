/**
 * Artwork Preview Component - displays uploaded artwork with validation status
 * Shows image preview, dimensions, file size, and validation results
 */

'use client';

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ArtworkPreviewProps {
  artwork: {
    id: string;
    url: string;
    width: number;
    height: number;
    height: number;
    file_size: number;
    mime_type: string;
    validation_status: 'PASSED' | 'PASSED_WITH_WARNING' | 'FAILED';
    validation_warnings: string[];
    is_valid: boolean;
  };
}

export default function ArtworkPreview({ artwork }: ArtworkPreviewProps) {
  const RECOMMENDED_WIDTH = 3000;
  const RECOMMENDED_HEIGHT = 3000;
  const fileSizeMB = (artwork.file_size / (1024 * 1024)).toFixed(2);
  const meetsRecommended =
    artwork.width >= RECOMMENDED_WIDTH && artwork.height >= RECOMMENDED_HEIGHT;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Image Preview */}
        <div className="aspect-square relative bg-gray-100">
          <img src={artwork.url} alt="Uploaded artwork" className="w-full h-full object-cover" />
        </div>

        {/* Metadata */}
        <div className="p-4 space-y-4">
          {/* File Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Dimensions</p>
              <p className="font-semibold text-gray-900">
                {artwork.width} × {artwork.height}px
              </p>
            </div>
            <div>
              <p className="text-gray-600">File size</p>
              <p className="font-semibold text-gray-900">{fileSizeMB} MB</p>
            </div>
            <div>
              <p className="text-gray-600">Format</p>
              <p className="font-semibold text-gray-900">
                {artwork.mime_type.split('/')[1].toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p
                className={`font-semibold ${
                  artwork.validation_status === 'PASSED'
                    ? 'text-green-600'
                    : artwork.validation_status === 'PASSED_WITH_WARNING'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {artwork.validation_status === 'PASSED'
                  ? 'Valid'
                  : artwork.validation_status === 'PASSED_WITH_WARNING'
                    ? 'Warning'
                    : 'Invalid'}
              </p>
            </div>
          </div>

          {/* Validation Status */}
          {artwork.validation_status === 'PASSED' && meetsRecommended ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Perfect! Meets platform requirements</p>
                <p className="text-xs mt-1">
                  Your artwork meets Apple Podcasts and Spotify requirements (3000x3000px).
                </p>
              </div>
            </div>
          ) : artwork.validation_status === 'PASSED_WITH_WARNING' ? (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Size below recommendations</p>
                <p className="text-xs mt-1">
                  {artwork.width < RECOMMENDED_WIDTH || artwork.height < RECOMMENDED_HEIGHT
                    ? `Current: ${artwork.width}×${artwork.height}px, Recommended: ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT}px or larger.`
                    : 'Your artwork will work but may not display optimally on all platforms.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Validation failed</p>
                <p className="text-xs mt-1">
                  Your artwork does not meet the requirements. Please try a different image.
                </p>
              </div>
            </div>
          )}

          {/* Warnings List */}
          {artwork.validation_warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Warnings:</p>
              {artwork.validation_warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-orange-50 border border-orange-100 p-3 rounded text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-700">{warning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
