/**
 * Artwork Preview Component - displays uploaded artwork with validation status
 */

'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

interface ArtworkPreviewProps {
  artwork: {
    url: string;
    width: number;
    height: number;
    is_valid: boolean;
    warnings?: string[];
    file_size: number;
  };
}

export default function ArtworkPreview({ artwork }: ArtworkPreviewProps) {
  const meetsMinimum = artwork.width >= 3000 && artwork.height >= 3000;
  const fileSizeMB = (artwork.file_size / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="aspect-square relative bg-gray-100">
          <img src={artwork.url} alt="Podcast artwork" className="w-full h-full object-cover" />
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Dimensions</p>
              <p className="font-semibold">
                {artwork.width} × {artwork.height}px
              </p>
            </div>
            <div>
              <p className="text-gray-600">File size</p>
              <p className="font-semibold">{fileSizeMB}MB</p>
            </div>
          </div>

          {meetsMinimum ? (
            <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                Meets Apple Podcasts & Spotify requirements (3000x3000px)
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Below recommended minimum</p>
                <p className="text-xs mt-1">
                  Apple Podcasts and Spotify require 3000x3000px for best results.
                </p>
              </div>
            </div>
          )}

          {artwork.warnings && artwork.warnings.length > 0 && (
            <div className="space-y-2">
              {artwork.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-orange-50 p-2 rounded text-xs"
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
