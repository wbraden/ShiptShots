'use client';

import { useState, useEffect } from 'react';
import { ScreenshotData, FilterOptions } from '@/types/screenshot';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function Home() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Group screenshots by component and get the first one as cover
  const getComponentGroups = () => {
    const groups: Record<string, ScreenshotData[]> = {};
    
    screenshots.forEach(screenshot => {
      if (!groups[screenshot.component]) {
        groups[screenshot.component] = [];
      }
      groups[screenshot.component].push(screenshot);
    });

    return Object.entries(groups).map(([component, componentScreenshots]) => ({
      component,
      coverScreenshot: componentScreenshots[0], // First screenshot as cover
      totalScreenshots: componentScreenshots.length,
      tags: [...new Set(componentScreenshots.flatMap(s => s.tags || []))].slice(0, 3) // First 3 unique tags
    }));
  };

  const componentGroups = getComponentGroups();

  // Filter components based on search
  const filteredComponents = componentGroups.filter(group => 
    group.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleComponentClick = (component: string) => {
    // Navigate to the browser view with this component selected
    window.location.href = `/browser?component=${encodeURIComponent(component)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg width="19" height="25" viewBox="0 0 19 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.19996 24.3468C5.8278 24.3468 3.18303 23.4922 1.86477 22.9602C0.661856 22.4753 -0.0831974 21.283 0.00743309 19.993L0.66421 9.27855L3.92338 9.47864L3.27837 20.0083C5.19691 20.7474 9.78729 22.0163 15.1227 19.9859C15.0415 18.8042 14.6142 12.5989 14.3635 8.97723C11.102 10.6215 8.3525 10.7486 6.31979 9.32445C5.04508 8.4311 4.31297 6.99395 4.31062 5.38261C4.30826 3.72302 5.09334 2.17759 6.41042 1.24892C7.63217 0.387343 9.07284 0.12016 10.4664 0.494452C12.0119 0.90994 13.3654 2.09755 14.0881 3.67123L11.1209 5.03539C10.8031 4.34448 10.2263 3.81247 9.61662 3.64886C9.15758 3.52528 8.72444 3.61355 8.2913 3.9184C7.84992 4.23031 7.57567 4.7894 7.57685 5.37791C7.57685 5.69099 7.65806 6.27362 8.19478 6.65027C9.44242 7.52479 11.9483 6.86095 14.8991 4.87297C15.3369 4.57871 15.8901 4.5128 16.3845 4.69759C17.3685 5.066 17.4238 5.86402 17.4815 6.70912L18.3937 19.9506C18.4949 21.2606 17.7439 22.4635 16.521 22.9461C13.8845 23.9878 11.3892 24.3468 9.19996 24.3468Z" fill="#37C35C"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ShiptShots</h1>
                <p className="text-sm text-gray-500">Component Library</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <a 
                href="/browser" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Browse All</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            UI Component Library
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our collection of UI components with their various states and configurations. 
            Each component showcases different interactions and design patterns.
          </p>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredComponents.map((group) => (
            <div
              key={group.component}
              onClick={() => handleComponentClick(group.component)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 overflow-hidden flex items-center">
                <img
                  src={group.coverScreenshot.thumbnailUrl}
                  alt={`${group.component} component`}
                  className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {group.component}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {group.totalScreenshots}
                  </span>
                </div>



                {/* CTA */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>View all variants</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredComponents.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse all components.
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 