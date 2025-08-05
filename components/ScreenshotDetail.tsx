'use client';

import { ScreenshotData, PropertyControl } from '@/types/screenshot';
import { formatDate, generateShareableUrl } from '@/utils/screenshot';
import { X, Copy, ExternalLink, Calendar, Code, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { groupPropertyControls, filterScreenshotsByProperties, hasPropertyControls } from '@/utils/propertyControls';
import { cn } from '@/utils/cn';
import { GroupedTags } from '@/components/GroupedTags';

interface ScreenshotDetailProps {
  screenshot: ScreenshotData | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  allScreenshots?: ScreenshotData[]; // All screenshots for the same component
}

export function ScreenshotDetail({ screenshot, onClose, onNavigate, hasPrevious = false, hasNext = false, allScreenshots = [] }: ScreenshotDetailProps) {
  const [copied, setCopied] = useState(false);
  // Initialize selected properties with values from the current screenshot
  const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>(() => {
    if (!screenshot?.propertyControls) return {};
    
    const initialProperties: Record<string, string> = {};
    screenshot.propertyControls.forEach(control => {
      initialProperties[control.key] = control.value;
    });
    return initialProperties;
  });

  // Update selected properties when screenshot changes
  useEffect(() => {
    if (screenshot?.propertyControls) {
      const initialProperties: Record<string, string> = {};
      screenshot.propertyControls.forEach(control => {
        initialProperties[control.key] = control.value;
      });
      setSelectedProperties(initialProperties);
    }
  }, [screenshot]);

  // Handle keyboard navigation - must be before any conditional returns
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

  // Property control logic
  const componentScreenshots = allScreenshots.filter(s => s.component === screenshot?.component);
  const basePropertyGroups = groupPropertyControls(componentScreenshots);
  const filteredScreenshots = filterScreenshotsByProperties(componentScreenshots, selectedProperties);
  const hasPropertyControlsForComponent = hasPropertyControls(componentScreenshots);

  // Simple property groups - show all options like Figma
  const propertyGroups = basePropertyGroups.map(group => ({
    ...group,
    currentValue: selectedProperties[group.key] || group.currentValue
  }));
  
  // Use the first matching screenshot, or fall back to the original
  const displayScreenshot = filteredScreenshots.length > 0 ? filteredScreenshots[0] : screenshot;

  // Only allow navigation when no properties are selected (showing original screenshot)
  const hasActiveProperties = Object.keys(selectedProperties).length > 0;
  const currentHasPrevious = hasActiveProperties ? false : hasPrevious;
  const currentHasNext = hasActiveProperties ? false : hasNext;

  const handlePropertyChange = (key: string, value: string) => {
    setSelectedProperties(prev => {
      const newProperties = { ...prev, [key]: value };
      
      // Find all screenshots that match the new property selection
      const matchingScreenshots = componentScreenshots.filter(screenshot => {
        if (!screenshot.propertyControls) return false;
        
        return Object.entries(newProperties).every(([propKey, propValue]) => {
          const control = screenshot.propertyControls?.find(c => c.key === propKey);
          return control && control.value === propValue;
        });
      });
      
      // If we have matching screenshots, use the first one to set all properties
      if (matchingScreenshots.length > 0) {
        const matchingScreenshot = matchingScreenshots[0];
        const updatedProperties: Record<string, string> = {};
        
        // Set all properties based on the matching screenshot
        matchingScreenshot.propertyControls?.forEach(control => {
          updatedProperties[control.key] = control.value;
        });
        
        return updatedProperties;
      }
      
      // If no exact match, try to find the closest match by relaxing constraints
      const relaxedScreenshots = componentScreenshots.filter(screenshot => {
        if (!screenshot.propertyControls) return false;
        
        // Check if this screenshot has the property we just changed
        const changedProperty = screenshot.propertyControls.find(c => c.key === key);
        return changedProperty && changedProperty.value === value;
      });
      
      if (relaxedScreenshots.length > 0) {
        const closestScreenshot = relaxedScreenshots[0];
        const updatedProperties: Record<string, string> = {};
        
        // Set all properties based on the closest matching screenshot
        closestScreenshot.propertyControls?.forEach(control => {
          updatedProperties[control.key] = control.value;
        });
        
        return updatedProperties;
      }
      
      // Fallback: just update the changed property
      return newProperties;
    });
  };

  const clearAllProperties = () => {
    setSelectedProperties({});
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] md:max-h-[85vh] lg:max-h-[95vh] overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              {displayScreenshot.component}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Image Section */}
          <div className="lg:w-2/3 p-3 md:p-4 flex items-center justify-center overflow-hidden bg-gray-50 relative">
            {/* Previous Button */}
            {currentHasPrevious && onNavigate && (
              <button
                onClick={() => onNavigate('prev')}
                className="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-200 z-10"
                title="Previous (←)"
              >
                <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
              </button>
            )}
            
            {/* Next Button */}
            {currentHasNext && onNavigate && (
              <button
                onClick={() => onNavigate('next')}
                className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-200 z-10"
                title="Next (→)"
              >
                <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
              </button>
            )}
            
            <div className="bg-gray-100 rounded-lg overflow-hidden max-w-full max-h-full flex items-center justify-center">
              <img
                src={displayScreenshot.imageUrl}
                alt={`${displayScreenshot.component} - ${displayScreenshot.state}`}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
            </div>
          </div>

          {/* Metadata Section */}
          <div className="lg:w-1/3 p-3 md:p-4 border-l border-gray-200 overflow-auto">
            <div className="space-y-3 md:space-y-4">
              {/* Property Controls */}
              {hasPropertyControlsForComponent && propertyGroups.length > 0 && (
                <div>
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900">Property Controls</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {propertyGroups.map(group => (
                      <div key={group.key}>
                        {group.type === 'toggle' && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 capitalize text-sm">{group.key}</span>
                            <div className="w-1/2 flex justify-start">
                              <button
                                onClick={() => {
                                  const currentValue = selectedProperties[group.key];
                                  const availableValues = group.options;
                                  const currentIndex = availableValues.indexOf(currentValue);
                                  const nextIndex = (currentIndex + 1) % availableValues.length;
                                  handlePropertyChange(group.key, availableValues[nextIndex]);
                                }}
                                className={cn(
                                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                  selectedProperties[group.key] === group.options[1] ? "bg-blue-600" : "bg-gray-200"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                    selectedProperties[group.key] === group.options[1] ? "translate-x-5" : "translate-x-1"
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {group.type === 'dropdown' && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 capitalize text-sm">{group.key}</span>
                            <select
                              value={selectedProperties[group.key] || ''}
                              onChange={(e) => handlePropertyChange(group.key, e.target.value)}
                              className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              {group.options.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        

                      </div>
                    ))}
                  </div>
                  

                </div>
              )}



              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(displayScreenshot.date)}
                </span>
              </div>

              {/* Tags */}
              {displayScreenshot.tags && displayScreenshot.tags.length > 0 && (
                <GroupedTags 
                  tags={displayScreenshot.tags} 
                  propertyControls={displayScreenshot.propertyControls}
                />
              )}



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