'use client';

import { useState, useEffect } from 'react';
import { ScreenshotData } from '@/types/screenshot';
import { BarChart3, FileText, Tag, AlertCircle, CheckCircle } from 'lucide-react';

interface AnalysisData {
  totalComponents: number;
  totalScreenshots: number;
  componentsWithDocs: number;
  componentsWithoutDocs: number;
  missingDocsComponents: string[];
  propertyUsage: Record<string, number>;
  topProperties: Array<{ property: string; count: number }>;
  oneOffProperties: Array<{ property: string; count: number; component: string }>;
}

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const response = await fetch('/api/screenshots');
        const data = await response.json();
        const screenshots: ScreenshotData[] = data.screenshots;

        // Group screenshots by component
        const componentGroups = screenshots.reduce((acc, screenshot) => {
          if (!acc[screenshot.component]) {
            acc[screenshot.component] = [];
          }
          acc[screenshot.component].push(screenshot);
          return acc;
        }, {} as Record<string, ScreenshotData[]>);

        // Analyze documentation coverage
        const componentsWithDocs = Object.keys(componentGroups).filter(component => {
          const componentScreenshots = componentGroups[component];
          return componentScreenshots.some(s => s.documentation);
        });

        const componentsWithoutDocs = Object.keys(componentGroups).filter(component => {
          const componentScreenshots = componentGroups[component];
          return !componentScreenshots.some(s => s.documentation);
        });

        // Analyze property usage
        const propertyUsage: Record<string, number> = {};
        screenshots.forEach(screenshot => {
          if (screenshot.propertyControls) {
            screenshot.propertyControls.forEach(control => {
              const key = `${control.key}:${control.value}`;
              propertyUsage[key] = (propertyUsage[key] || 0) + 1;
            });
          }
        });

        // Get top properties
        const topProperties = Object.entries(propertyUsage)
          .map(([property, count]) => ({ property, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Get one-off properties (used only once)
        const oneOffProperties = Object.entries(propertyUsage)
          .filter(([property, count]) => count === 1)
          .map(([property, count]) => {
            // Find which component uses this property
            const component = screenshots.find(s => 
              s.propertyControls?.some(control => `${control.key}:${control.value}` === property)
            )?.component || 'Unknown';
            
            return { property, count, component };
          })
          .sort((a, b) => a.component.localeCompare(b.component));

        setAnalysisData({
          totalComponents: Object.keys(componentGroups).length,
          totalScreenshots: screenshots.length,
          componentsWithDocs: componentsWithDocs.length,
          componentsWithoutDocs: componentsWithoutDocs.length,
          missingDocsComponents: componentsWithoutDocs,
          propertyUsage,
          topProperties,
          oneOffProperties
        });
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing component library...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analysis data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Component Library Analysis</h1>
          <p className="text-gray-600">Insights into your design system coverage and usage patterns</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Components</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.totalComponents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Screenshots</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.totalScreenshots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Documentation</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.componentsWithDocs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Missing Documentation</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.componentsWithoutDocs}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Missing Documentation */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Missing Documentation
              </h2>
              <p className="text-gray-600 mt-1">
                {analysisData.componentsWithoutDocs} components need documentation
              </p>
            </div>
            <div className="p-6">
              {analysisData.missingDocsComponents.length > 0 ? (
                <div className="space-y-2">
                  {analysisData.missingDocsComponents.map((component, index) => (
                    <div
                      key={component}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <span className="font-medium text-red-800">{component}</span>
                      <span className="text-sm text-red-600">No docs</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All components have documentation! 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Most Used Properties */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                Most Used Properties
              </h2>
              <p className="text-gray-600 mt-1">
                Top 10 most frequently used property values
              </p>
            </div>
            <div className="p-6">
              {analysisData.topProperties.length > 0 ? (
                <div className="space-y-3">
                  {analysisData.topProperties.map((item, index) => (
                    <div key={item.property} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                        <span className="font-medium text-gray-900">{item.property}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / analysisData.topProperties[0].count) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No property data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* One-Off Properties */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              One-Off Properties
            </h2>
            <p className="text-gray-600 mt-1">
              Properties used only once - may indicate unique variants or naming inconsistencies
            </p>
          </div>
          <div className="p-6">
            {analysisData.oneOffProperties.length > 0 ? (
              <div className="space-y-3">
                {analysisData.oneOffProperties.map((item, index) => (
                  <div key={item.property} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-orange-800">{item.property}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {item.component}
                      </span>
                      <span className="text-sm font-medium text-orange-600">
                        Used {item.count} time
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No one-off properties found! All properties are used consistently.</p>
              </div>
            )}
          </div>
        </div>

        {/* Documentation Coverage Chart */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Documentation Coverage</h2>
            <p className="text-gray-600 mt-1">Percentage of components with documentation</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={`${(analysisData.componentsWithDocs / analysisData.totalComponents) * 88} 88`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((analysisData.componentsWithDocs / analysisData.totalComponents) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                {analysisData.componentsWithDocs} of {analysisData.totalComponents} components documented
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 