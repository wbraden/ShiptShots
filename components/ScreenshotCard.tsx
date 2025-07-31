'use client';

import { ScreenshotData } from '@/types/screenshot';
import { formatDate } from '@/utils/screenshot';
import { cn } from '@/utils/cn';
import { Calendar, Tag, Eye } from 'lucide-react';

interface ScreenshotCardProps {
  screenshot: ScreenshotData;
  onClick: (screenshot: ScreenshotData) => void;
}

export function ScreenshotCard({ screenshot, onClick }: ScreenshotCardProps) {
  // Check if screenshot is new (within last 7 days)
  const isNew = () => {
    const screenshotDate = new Date(screenshot.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return screenshotDate > sevenDaysAgo;
  };

  return (
    <div 
      className="screenshot-card cursor-pointer group"
      onClick={() => onClick(screenshot)}
    >
      {/* Image Section */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden flex items-center">
        <img
          src={screenshot.thumbnailUrl}
          alt={`${screenshot.component} - ${screenshot.state}`}
          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
      
      {/* Stroke Separator */}
      <div className="border-t border-gray-200"></div>
      
      {/* Text Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {screenshot.component}
            </h3>
            <p className="text-gray-600 text-xs">
              {screenshot.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Added {formatDate(screenshot.date)}</span>
          
          {screenshot.tags && screenshot.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{screenshot.tags.length}</span>
            </div>
          )}
        </div>
        
        {screenshot.tags && screenshot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {screenshot.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {screenshot.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{screenshot.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 