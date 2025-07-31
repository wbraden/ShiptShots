'use client';

import { ScreenshotData } from '@/types/screenshot';
import { formatDate, generateShareableUrl } from '@/utils/screenshot';
import { X, Copy, ExternalLink, Calendar, Tag, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ScreenshotDetailProps {
  screenshot: ScreenshotData | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function ScreenshotDetail({ screenshot, onClose, onNavigate, hasPrevious = false, hasNext = false }: ScreenshotDetailProps) {
  const [copied, setCopied] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && hasPrevious && onNavigate) {
        onNavigate('prev');
      } else if (event.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate, hasPrevious, hasNext]);

  if (!screenshot) return null;

  const handleCopyLink = async () => {
    const url = generateShareableUrl(screenshot.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyMetadata = async () => {
    const metadata = JSON.stringify(screenshot, null, 2);
    try {
      await navigator.clipboard.writeText(metadata);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy metadata:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {screenshot.component}
            </h2>
            <p className="text-gray-600">{screenshot.state}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Image Section */}
          <div className="lg:w-2/3 p-4 flex items-center justify-center overflow-hidden bg-gray-50 relative">
            {/* Previous Button */}
            {hasPrevious && onNavigate && (
              <button
                onClick={() => onNavigate('prev')}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}
            
            {/* Next Button */}
            {hasNext && onNavigate && (
              <button
                onClick={() => onNavigate('next')}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                title="Next (→)"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            )}
            
            <div className="bg-gray-100 rounded-lg overflow-hidden max-w-full max-h-full flex items-center justify-center">
              <img
                src={screenshot.imageUrl}
                alt={`${screenshot.component} - ${screenshot.state}`}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              />
            </div>
          </div>

          {/* Metadata Section */}
          <div className="lg:w-1/3 p-4 border-l border-gray-200 overflow-auto">
            <div className="space-y-4">
              {/* Description */}
              {screenshot.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm">{screenshot.description}</p>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(screenshot.date)}
                </span>
              </div>

              {/* Tags */}
              {screenshot.tags && screenshot.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {screenshot.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Props */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Props</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(screenshot.props, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                
                <button
                  onClick={handleCopyMetadata}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Code className="w-4 h-4" />
                  Copy Metadata
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 