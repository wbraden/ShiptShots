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
  const maxVisibleTags = 12; // Show first 12 tags by default
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
      tags: []
    });
  };

  const hasActiveFilters = filters.search || filters.component || filters.state || filters.tags.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search components, states, or tags..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Component Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Component:</span>
            <select
              value={filters.component}
              onChange={(e) => handleComponentChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All Components</option>
              {availableComponents.map(component => (
                <option key={component} value={component}>
                  {component}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">State:</span>
            <select
              value={filters.state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All States</option>
              {availableStates.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <span className="text-xs text-gray-500">({availableTags.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(tagsExpanded ? availableTags : availableTags.slice(0, maxVisibleTags)).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    "filter-button",
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
              {!tagsExpanded && availableTags.length > maxVisibleTags && (
                <button
                  onClick={() => setTagsExpanded(true)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  +{availableTags.length - maxVisibleTags} more
                </button>
              )}
              {tagsExpanded && availableTags.length > maxVisibleTags && (
                <button
                  onClick={() => setTagsExpanded(false)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 