'use client';

import { useState, useEffect } from 'react';
import { ScreenshotData, FilterOptions, GroupByOption } from '@/types/screenshot';
import {
  filterScreenshots,
  groupScreenshots,
  getUniqueComponents,
  getUniqueStates,
  getUniqueTags
} from '@/utils/screenshot';
import { ScreenshotCard } from '@/components/ScreenshotCard';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { ScreenshotDetail } from '@/components/ScreenshotDetail';
import { Sidebar } from '@/components/Sidebar';
import { MobileMenuButton } from '@/components/MobileMenuButton';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

import { ArrowLeft, FileText, ChevronDown, ChevronUp, Search, X, Grid3X3, Grid2X2, Grid, ArrowUpDown, Calendar, SortAsc, SortDesc, Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { hasPropertyControls, groupPropertyControls, filterScreenshotsByProperties } from '@/utils/propertyControls';
import { formatDate, generateShareableUrl } from '@/utils/screenshot';
import { GroupedTags } from '@/components/GroupedTags';

export default function BrowserPage() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredScreenshots, setFilteredScreenshots] = useState<ScreenshotData[]>([]);
  const [groupedScreenshots, setGroupedScreenshots] = useState<Record<string, ScreenshotData[]>>({});
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    component: '',
    state: '',
    tags: [],
    tagFilterMode: 'AND' // Default to AND mode (all tags must be present)
  });
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [gridDensity, setGridDensity] = useState<'compact' | 'default' | 'comfortable'>('default');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'date'>('alphabetical');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>({});

  // Update selected properties when screenshot changes
  useEffect(() => {
    if (selectedScreenshot?.propertyControls) {
      const initialProperties: Record<string, string> = {};
      selectedScreenshot.propertyControls.forEach(control => {
        initialProperties[control.key] = control.value;
      });
      setSelectedProperties(initialProperties);
    } else {
      setSelectedProperties({});
    }
  }, [selectedScreenshot]);

  // Get initial component and screenshot from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const componentParam = urlParams.get('component');
      const screenshotParam = urlParams.get('screenshot');
      
      if (componentParam) {
        setSelectedComponent(componentParam);
      }
      
      if (screenshotParam) {
        // Find the screenshot by ID and open it in the modal
        const screenshot = screenshots.find(s => s.id === screenshotParam);
        if (screenshot) {
          setSelectedScreenshot(screenshot);
        }
      }
    }
  }, [screenshots]);

  // Fetch screenshots from API
  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/screenshots');
        const data = await response.json();
        const apiScreenshots = data.screenshots || [];
        setScreenshots(apiScreenshots);
      } catch (error) {
        console.error('Error fetching screenshots:', error);
        // Fallback to test data if API fails
        const fallbackData = [
          {
            id: 'Button_primary_default_0',
            component: 'Button',
            state: 'primary_default',
            props: { type: 'primary' },
            filename: 'Button_primary_default.png',
            date: new Date().toISOString(),
            tags: ['form', 'interactive', 'primary'],
            description: 'Button component in primary_default state',
            imageUrl: '/screenshots/Button_primary_default.png',
            thumbnailUrl: '/screenshots/Button_primary_default.png'
          }
        ];
        setScreenshots(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchScreenshots();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = filterScreenshots(screenshots, filters);
    if (selectedComponent) {
      filtered = filtered.filter(s => s.component === selectedComponent);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        const comparison = a.component.localeCompare(b.component);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    
    setFilteredScreenshots(sorted);
    
    // Group by component only when sorting alphabetically
    if (sortBy === 'alphabetical') {
      const grouped = groupScreenshots(sorted, 'component');
      setGroupedScreenshots(grouped);
    } else {
      // For date sorting, create a flat list with a single group
      setGroupedScreenshots({ 'All Screenshots': sorted });
    }
  }, [screenshots, filters, selectedComponent, sortBy, sortOrder]);

  const handleScreenshotClick = (screenshot: ScreenshotData) => {
    setSelectedScreenshot(screenshot);
  };

  const handleCloseDetail = () => {
    setSelectedScreenshot(null);
  };

  const handleNavigateScreenshot = (direction: 'prev' | 'next') => {
    if (!selectedScreenshot) return;
    
    const currentIndex = filteredScreenshots.findIndex(s => s.id === selectedScreenshot.id);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredScreenshots.length - 1;
    } else {
      newIndex = currentIndex < filteredScreenshots.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedScreenshot(filteredScreenshots[newIndex]);
  };

  const getNavigationState = () => {
    if (!selectedScreenshot) return { hasPrevious: false, hasNext: false };
    
    const currentIndex = filteredScreenshots.findIndex(s => s.id === selectedScreenshot.id);
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < filteredScreenshots.length - 1
    };
  };

  const handleComponentSelect = (component: string | null) => {
    // If we're in detail view and selecting a different component, clear the detail view
    if (selectedScreenshot && component !== selectedScreenshot.component) {
      setSelectedScreenshot(null);
    }
    setSelectedComponent(component);
    setSidebarOpen(false); // Close sidebar on mobile after selection
    
    // Clear tag filters when switching to a specific component
    // This ensures users see all items in the component first
    if (component !== null) {
      setFilters(prev => ({
        ...prev,
        tags: []
      }));
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const availableComponents = getUniqueComponents(screenshots);
  const availableStates = getUniqueStates(screenshots);
  const availableTags = getUniqueTags(screenshots);

  // Get component-specific tags based on selected component
  const getComponentSpecificTags = (component: string | null): string[] => {
    if (!component) {
      // For all tags, sort by occurrence count
      const allTags = screenshots.flatMap(s => s.tags || []);
      const tagCounts: Record<string, number> = {};
      
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      
      return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
    }
    
    // Filter screenshots by the selected component and get their tags
    const componentScreenshots = screenshots.filter(s => s.component === component);
    const componentTags = componentScreenshots.flatMap(s => s.tags || []);
    
    // Remove the component name from tags when filtering by that component
    const filteredTags = componentTags.filter(tag => 
      tag.toLowerCase() !== component.toLowerCase()
    );
    
    // Count occurrences and sort by count (descending)
    const tagCounts: Record<string, number> = {};
    filteredTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  };

  const componentSpecificTags = getComponentSpecificTags(selectedComponent);

  // Calculate tag counts for the current component-specific tags
  const getTagCounts = (tags: string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    
    // If filtering by component, only count tags from that component's screenshots
    const screenshotsToCount = selectedComponent 
      ? screenshots.filter(s => s.component === selectedComponent)
      : screenshots;
    
    tags.forEach(tag => {
      const tagCount = screenshotsToCount.filter(s => 
        s.tags && s.tags.includes(tag)
      ).length;
      counts[tag] = tagCount;
    });
    
    return counts;
  };

  const tagCounts = getTagCounts(componentSpecificTags);

  const totalScreenshots = screenshots.length;
  const filteredCount = filteredScreenshots.length;

  // Property control logic for detail view
  const componentScreenshots = selectedScreenshot ? screenshots.filter(s => s.component === selectedScreenshot.component) : [];
  const hasPropertyControlsForComponent = hasPropertyControls(screenshots, selectedScreenshot?.component);
  const basePropertyGroups = groupPropertyControls(componentScreenshots);
  const detailFilteredScreenshots = filterScreenshotsByProperties(componentScreenshots, selectedProperties);
  
  // Simple property groups - show all options like Figma
  const propertyGroups = basePropertyGroups.map(group => ({
    ...group,
    currentValue: selectedProperties[group.key] || group.currentValue
  }));

  // Use the first matching screenshot, or fall back to the original
  const displayScreenshot = detailFilteredScreenshots.length > 0 ? detailFilteredScreenshots[0] : selectedScreenshot;

  const handlePropertyChange = (key: string, value: string) => {
    setSelectedProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCopyLink = async () => {
    if (!selectedScreenshot) return;
    const url = generateShareableUrl(selectedScreenshot.id);
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar (fixed on desktop) */}
      <Sidebar
        screenshots={screenshots}
        selectedComponent={selectedComponent}
        onComponentSelect={handleComponentSelect}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content Wrapper */}
      <div className="lg:ml-64 h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          {selectedScreenshot ? (
            // Detail View Header
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  {/* Mobile Menu Button */}
                  <div className="lg:hidden">
                    <MobileMenuButton onClick={toggleSidebar} />
                  </div>
                  <button
                    onClick={() => setSelectedScreenshot(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Browser</span>
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {selectedScreenshot.component}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedScreenshot.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getNavigationState().hasPrevious && handleNavigateScreenshot && (
                    <button
                      onClick={() => handleNavigateScreenshot('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Previous (←)"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                  {getNavigationState().hasNext && handleNavigateScreenshot && (
                    <button
                      onClick={() => handleNavigateScreenshot('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Next (→)"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-700 flex items-center gap-2"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy link</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Browser Header (Original Search/Filter Controls)
            <div className="px-4 sm:px-6 lg:px-8">
            {/* Top Header Row with Search and Filter Mode */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 h-auto lg:h-16 py-4 lg:py-0">
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <MobileMenuButton onClick={toggleSidebar} />
              </div>
              
                <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search components, states, or tags..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="absolute right-0.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-10 h-10 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
                {/* Controls Row - Wraps on mobile/tablet */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 w-full lg:w-auto">
              {/* Filter Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filter Mode:</span>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilters({ ...filters, tagFilterMode: 'AND' })}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      filters.tagFilterMode === 'AND'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    AND
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, tagFilterMode: 'OR' })}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      filters.tagFilterMode === 'OR'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    OR
                  </button>
                </div>
              </div>
              
                  {/* Grid Density Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Density:</span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setGridDensity('compact')}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                          gridDensity === 'compact'
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                        title="Compact"
                      >
                        <Grid3X3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setGridDensity('default')}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                          gridDensity === 'default'
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                        title="Default"
                      >
                        <Grid2X2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
              
              {/* Sort Controls */}
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>{sortBy === 'alphabetical' ? 'Alphabetical' : 'Date created'}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                
                {sortDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-gray-900 rounded-md shadow-lg z-10">
                    {/* Sort by section */}
                    <div className="p-1.5">
                      <div className="text-xs text-gray-400 mb-1.5">Sort by:</div>
                      <button
                        onClick={() => {
                          setSortBy('alphabetical');
                          setSortDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-1.5 py-1 text-xs rounded flex items-center justify-between",
                          sortBy === 'alphabetical'
                            ? "bg-blue-600 text-white"
                            : "text-white hover:bg-gray-800"
                        )}
                      >
                        <span>Alphabetical</span>
                        {sortBy === 'alphabetical' && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('date');
                          setSortDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-1.5 py-1 text-xs rounded flex items-center justify-between",
                          sortBy === 'date'
                            ? "bg-blue-600 text-white"
                            : "text-white hover:bg-gray-800"
                        )}
                      >
                        <span>Date created</span>
                        {sortBy === 'date' && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-700"></div>
                    
                    {/* Order section */}
                    <div className="p-1.5">
                      <div className="text-xs text-gray-400 mb-1.5">Order:</div>
                      <button
                        onClick={() => {
                          setSortOrder('asc');
                          setSortDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-1.5 py-1 text-xs rounded flex items-center justify-between",
                          sortOrder === 'asc'
                            ? "text-white"
                            : "text-white hover:bg-gray-800"
                        )}
                      >
                        <span>{sortBy === 'alphabetical' ? 'A-Z' : 'Oldest first'}</span>
                        {sortOrder === 'asc' && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder('desc');
                          setSortDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-1.5 py-1 text-xs rounded flex items-center justify-between",
                          sortOrder === 'desc'
                            ? "text-white"
                            : "text-white hover:bg-gray-800"
                        )}
                      >
                        <span>{sortBy === 'alphabetical' ? 'Z-A' : 'Newest first'}</span>
                        {sortOrder === 'desc' && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                </div>
            </div>
            
            {/* Filter Section */}
            <div className="pb-4">
              <SearchAndFilter
                filters={filters}
                onFiltersChange={setFilters}
                availableComponents={availableComponents}
                availableStates={availableStates}
                availableTags={componentSpecificTags}
                tagCounts={tagCounts}
              />
            </div>
          </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {selectedScreenshot ? (
            // Detail View (Storybook-like)
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Canvas Area (Storybook Canvas) */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 overflow-auto min-h-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <img
                    src={displayScreenshot?.imageUrl || selectedScreenshot?.imageUrl}
                    alt={`${displayScreenshot?.component || selectedScreenshot?.component} - ${displayScreenshot?.state || selectedScreenshot?.state}`}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: 'calc(90vh - 120px)' }}
                  />
                </div>
              </div>

              {/* Controls Panel (Storybook Controls) */}
              <div className="w-full lg:w-80 bg-white border-t lg:border-l lg:border-t-0 border-gray-200 lg:overflow-auto lg:h-full flex flex-col">
                <div className="p-4 space-y-6">
                  {/* Property Controls */}
                  {hasPropertyControlsForComponent && propertyGroups.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Controls</h3>
                      <div className="space-y-3">
                        {propertyGroups.map(group => (
                          <div key={group.key}>
                            {group.type === 'toggle' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 capitalize">{group.key}</span>
                                <div className="w-1/2">
                                  <button
                                    onClick={() => {
                                      const currentValue = selectedProperties[group.key];
                                      const availableValues = group.options;
                                      const currentIndex = availableValues.indexOf(currentValue);
                                      const nextIndex = (currentIndex + 1) % availableValues.length;
                                      handlePropertyChange(group.key, availableValues[nextIndex]);
                                    }}
                                    className={cn(
                                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                      selectedProperties[group.key] === group.options[1] ? "bg-blue-600" : "bg-gray-200"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        selectedProperties[group.key] === group.options[1] ? "translate-x-6" : "translate-x-1"
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {group.type === 'dropdown' && (
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-700 capitalize">{group.key}</label>
                                <div className="w-1/2">
                                  <div className="relative">
                                    <select
                                      value={selectedProperties[group.key] || ''}
                                      onChange={(e) => handlePropertyChange(group.key, e.target.value)}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                                    >
                                      {group.options.map(option => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {(displayScreenshot?.tags || selectedScreenshot?.tags) && (displayScreenshot?.tags?.length || selectedScreenshot?.tags?.length) > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                      <GroupedTags
                        tags={displayScreenshot?.tags || selectedScreenshot?.tags || []}
                        propertyControls={displayScreenshot?.propertyControls || selectedScreenshot?.propertyControls}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Browser View (Original Grid Layout)
            <div className="px-4 sm:px-6 lg:px-8 py-8">

            {/* Component Filter Indicator */}
            {selectedComponent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">Filtering by component:</span>
                    <span className="font-medium text-blue-900">{selectedComponent}</span>
                  </div>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            )}

            {/* Component Documentation */}
            {selectedComponent && (() => {
              const componentScreenshots = screenshots.filter(s => s.component === selectedComponent);
              const documentation = componentScreenshots.find(s => s.documentation)?.documentation;
              
              if (documentation) {
                return (
                  <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
                    <button
                      onClick={() => setDocsExpanded(!docsExpanded)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Design Guidelines</h3>
                      </div>
                      {docsExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {docsExpanded && (
                      <div className="px-6 pt-4 pb-6 border-t border-gray-100">
                        <MarkdownRenderer content={documentation} />
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Screenshot Gallery */}
              <div className="space-y-8">
                {Object.entries(groupedScreenshots).map(([groupName, groupScreenshots]) => (
                  <div key={groupName}>
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {groupName}
                      </h2>
                      <span className="text-sm text-gray-600">
                        {groupScreenshots.length} screenshot{groupScreenshots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Screenshot Grid */}
                    <div className={cn(
                      "screenshot-grid",
                      gridDensity === 'compact' && 'compact',
                      gridDensity === 'comfortable' && 'comfortable'
                    )}>
                      {groupScreenshots.map((screenshot) => (
                        <ScreenshotCard
                          key={screenshot.id}
                          screenshot={screenshot}
                          onClick={handleScreenshotClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                      <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading screenshots...</h3>
                    <p className="text-gray-600">Reading files from your screenshots directory</p>
                  </div>
                )}

                {/* Empty State */}
                {!loading && filteredScreenshots.length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No screenshots found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
} 