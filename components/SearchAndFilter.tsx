'use client';

import { FilterOptions } from '@/types/screenshot';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';

interface SearchAndFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableComponents: string[];
  availableStates: string[];
  availableTags: string[];
  tagCounts?: Record<string, number>;
}

export function SearchAndFilter({
  filters,
  onFiltersChange,
  availableComponents,
  availableStates,
  availableTags,
  tagCounts = {}
}: SearchAndFilterProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const maxVisibleTags = 8; // Show first 8 tags by default (one line)
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleComponentChange = (component: string) => {
    onFiltersChange({ ...filters, component: component || '' });
  };

  const handleStateChange = (state: string) => {
    onFiltersChange({ ...filters, state: state || '' });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      component: '',
      state: '',
      tags: [],
      tagFilterMode: filters.tagFilterMode // Preserve the current filter mode
    });
  };

  const hasActiveFilters = filters.search || filters.component || filters.state || filters.tags.length > 0;

    return (
    <div className="space-y-4">

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="flex gap-2 items-start">
            {/* Tags Container with Overflow and Fade */}
            <div className="relative flex-1 overflow-hidden">
              <div className={cn(
                "flex gap-2",
                tagsExpanded ? "flex-wrap" : "flex-nowrap"
              )}>
                {/* Clear Filters Button - Only when active */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
                
                {(tagsExpanded ? availableTags : availableTags.slice(0, maxVisibleTags)).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "filter-button whitespace-nowrap",
                      filters.tags.includes(tag) ? "active" : ""
                    )}
                  >
                    <span>{tag}</span>
                    {tagCounts[tag] && (
                      <span className={cn(
                        "ml-1.5 px-1.5 py-0.5 text-xs font-medium rounded-full",
                        filters.tags.includes(tag) 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-200 text-gray-700"
                      )}>
                        {tagCounts[tag]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Fade overlay - only show when not expanded and there are more tags */}
              {!tagsExpanded && availableTags.length > maxVisibleTags && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              )}
            </div>
            
            {/* Expand/Collapse Button - Always Visible */}
            {!tagsExpanded && availableTags.length > maxVisibleTags && (
              <button
                onClick={() => setTagsExpanded(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
                +{availableTags.length - maxVisibleTags} more
              </button>
            )}
            {tagsExpanded && availableTags.length > maxVisibleTags && (
              <button
                onClick={() => setTagsExpanded(false)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <ChevronUp className="w-4 h-4" />
                Show Less
              </button>
            )}
          </div>
        )}
      </div>
  );
} 