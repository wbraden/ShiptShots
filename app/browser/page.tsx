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
import { ArrowLeft, FileText, ChevronDown, ChevronUp, Search, X, Grid3X3, Grid2X2, Grid } from 'lucide-react';
import { cn } from '@/utils/cn';
import Link from 'next/link';

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

  // Get initial component from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const componentParam = urlParams.get('component');
      if (componentParam) {
        setSelectedComponent(componentParam);
      }
    }
  }, []);

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

  // Apply filters
  useEffect(() => {
    let filtered = filterScreenshots(screenshots, filters);
    if (selectedComponent) {
      filtered = filtered.filter(s => s.component === selectedComponent);
    }
    setFilteredScreenshots(filtered);
    const grouped = groupScreenshots(filtered, 'component');
    setGroupedScreenshots(grouped);
  }, [screenshots, filters, selectedComponent]);

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
      return availableTags.sort(); // Show all tags when no component is selected
    }
    
    // Filter screenshots by the selected component and get their tags
    const componentScreenshots = screenshots.filter(s => s.component === component);
    const componentTags = componentScreenshots.flatMap(s => s.tags || []);
    
    // Remove the component name from tags when filtering by that component
    const filteredTags = componentTags.filter(tag => 
      tag.toLowerCase() !== component.toLowerCase()
    );
    
    return [...new Set(filteredTags)].sort(); // Remove duplicates and sort alphabetically
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
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Header Row with Search and Filter Mode */}
            <div className="flex items-center gap-4 h-16">
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <MobileMenuButton onClick={toggleSidebar} />
              </div>
              
              <div className="flex-1">
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
                  <button
                    onClick={() => setGridDensity('comfortable')}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                      gridDensity === 'comfortable'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    title="Comfortable"
                  >
                    <Grid className="w-3 h-3" />
                  </button>
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
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

            {/* Screenshot Detail Modal */}
            <ScreenshotDetail
              screenshot={selectedScreenshot}
              onClose={handleCloseDetail}
              onNavigate={handleNavigateScreenshot}
              {...getNavigationState()}
            />
          </div>
        </main>
      </div>
    </div>
  );
} 