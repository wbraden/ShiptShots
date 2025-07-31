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
import { Camera, Image } from 'lucide-react';

// Import screenshot utilities
import { getAllScreenshots } from '@/utils/screenshot';

export default function Home() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredScreenshots, setFilteredScreenshots] = useState<ScreenshotData[]>([]);
  const [groupedScreenshots, setGroupedScreenshots] = useState<Record<string, ScreenshotData[]>>({});
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    component: '',
    state: '',
    tags: []
  });
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // Fetch screenshots from API
  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        setLoading(true);
        console.log('Fetching screenshots from API...');
        const response = await fetch('/api/screenshots');
        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);
        
        // Use the actual API data
        const apiScreenshots = data.screenshots || [];
        console.log('Setting screenshots:', apiScreenshots);
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
        console.log('Using fallback data:', fallbackData);
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

  const handleComponentSelect = (component: string | null) => {
    setSelectedComponent(component);
    setSidebarOpen(false); // Close sidebar on mobile after selection
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
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <MobileMenuButton onClick={toggleSidebar} />
                <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">ShiptShots</h1>
                  <p className="text-sm text-gray-600">Screenshot Browser</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>
                    {filteredCount} of {totalScreenshots} screenshots
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search and Filter */}
            <SearchAndFilter
              filters={filters}
              onFiltersChange={setFilters}
              availableComponents={availableComponents}
              availableStates={availableStates}
              availableTags={componentSpecificTags}
              tagCounts={tagCounts}
            />

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
                  <div className="screenshot-grid">
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
                    <Image className="w-8 h-8 text-gray-400" />
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
            />
          </div>
        </main>
      </div>
    </div>
  );
} 