'use client';

import { useState } from 'react';
import { PropertyGroup, ScreenshotData } from '@/types/screenshot';
import { groupPropertyControls, filterScreenshotsByProperties } from '@/utils/propertyControls';
import { ScreenshotCard } from './ScreenshotCard';
import { cn } from '@/utils/cn';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PropertyToggleViewProps {
  screenshots: ScreenshotData[];
  onScreenshotClick: (screenshot: ScreenshotData) => void;
  className?: string;
}

export function PropertyToggleView({ 
  screenshots, 
  onScreenshotClick, 
  className 
}: PropertyToggleViewProps) {
  const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Get property groups from screenshots
  const propertyGroups = groupPropertyControls(screenshots);
  
  // Filter screenshots based on selected properties
  const filteredScreenshots = filterScreenshotsByProperties(screenshots, selectedProperties);
  
  const handlePropertyChange = (key: string, value: string) => {
    setSelectedProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const toggleGroupExpansion = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  const clearAllProperties = () => {
    setSelectedProperties({});
  };
  
  if (propertyGroups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No property controls found for this component.
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Property Controls Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Property Controls</h3>
          {Object.keys(selectedProperties).length > 0 && (
            <button
              onClick={clearAllProperties}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {propertyGroups.map(group => (
            <div key={group.key} className="border border-gray-200 rounded-md">
              <button
                onClick={() => toggleGroupExpansion(group.key)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 capitalize">{group.key}</span>
                  {selectedProperties[group.key] && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {selectedProperties[group.key]}
                    </span>
                  )}
                </div>
                {expandedGroups.has(group.key) ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {expandedGroups.has(group.key) && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  {group.type === 'toggle' && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Enabled</span>
                      <button
                        onClick={() => handlePropertyChange(group.key, selectedProperties[group.key] === 'true' ? 'false' : 'true')}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          selectedProperties[group.key] === 'true' ? "bg-blue-600" : "bg-gray-200"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            selectedProperties[group.key] === 'true' ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  )}
                  
                  {group.type === 'dropdown' && (
                    <div className="py-2">
                      <select
                        value={selectedProperties[group.key] || ''}
                        onChange={(e) => handlePropertyChange(group.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select {group.key}</option>
                        {group.options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {group.type === 'text' && (
                    <div className="py-2">
                      <input
                        type="text"
                        value={selectedProperties[group.key] || ''}
                        onChange={(e) => handlePropertyChange(group.key, e.target.value)}
                        placeholder={`Enter ${group.key}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Screenshot Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Screenshots ({filteredScreenshots.length})
          </h3>
        </div>
        
        {filteredScreenshots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No screenshots match the selected properties.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredScreenshots.map((screenshot) => (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                onClick={onScreenshotClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 