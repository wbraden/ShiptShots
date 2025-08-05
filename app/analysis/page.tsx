'use client';

import { useState, useEffect } from 'react';
import { ScreenshotData } from '@/types/screenshot';
import { BarChart3, FileText, Tag, AlertCircle, CheckCircle, TrendingUp, Zap, Shield, ArrowRight, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface AnalysisData {
  totalComponents: number;
  totalScreenshots: number;
  componentsWithDocs: number;
  componentsWithoutDocs: number;
  missingDocsComponents: string[];
  propertyUsage: Record<string, number>;
  topProperties: Array<{ property: string; count: number }>;
  oneOffProperties: Array<{ property: string; count: number; component: string; screenshotId: string }>;
  non2xImages: Array<{ filename: string; component: string; fileSizeKB: number; screenshotId: string }>;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'missing-docs' | 'top-properties' | 'one-off' | 'low-res' | null;
  }>({ isOpen: false, type: null });

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
            const screenshot = screenshots.find(s => 
              s.propertyControls?.some(control => `${control.key}:${control.value}` === property)
            );
            
            return { 
              property, 
              count, 
              component: screenshot?.component || 'Unknown',
              screenshotId: screenshot?.id || ''
            };
          })
          .sort((a, b) => a.component.localeCompare(b.component));

        // Find non-2x images
        const non2xImages = screenshots
          .filter(screenshot => screenshot.resolution && !screenshot.resolution.is2x)
          .map(screenshot => ({
            filename: screenshot.filename,
            component: screenshot.component,
            fileSizeKB: 0, // Would be actual file size in production
            screenshotId: screenshot.id
          }))
          .sort((a, b) => a.component.localeCompare(b.component));

        setAnalysisData({
          totalComponents: Object.keys(componentGroups).length,
          totalScreenshots: screenshots.length,
          componentsWithDocs: componentsWithDocs.length,
          componentsWithoutDocs: componentsWithoutDocs.length,
          missingDocsComponents: componentsWithoutDocs,
          propertyUsage,
          topProperties,
          oneOffProperties,
          non2xImages
        });
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, []);

  const openModal = (type: 'missing-docs' | 'top-properties' | 'one-off' | 'low-res') => {
    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Analyzing component library...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Failed to load analysis data</p>
        </div>
      </div>
    );
  }

  const documentationPercentage = Math.round((analysisData.componentsWithDocs / analysisData.totalComponents) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/browser" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Back to Browser</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="19" height="25" viewBox="0 0 19 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.19996 24.3468C5.8278 24.3468 3.18303 23.4922 1.86477 22.9602C0.661856 22.4753 -0.0831974 21.283 0.00743309 19.993L0.66421 9.27855L3.92338 9.47864L3.27837 20.0083C5.19691 20.7474 9.78729 22.0163 15.1227 19.9859C15.0415 18.8042 14.6142 12.5989 14.3635 8.97723C11.102 10.6215 8.3525 10.7486 6.31979 9.32445C5.04508 8.4311 4.31297 6.99395 4.31062 5.38261C4.30826 3.72302 5.09334 2.17759 6.41042 1.24892C7.63217 0.387343 9.07284 0.12016 10.4664 0.494452C12.0119 0.90994 13.3654 2.09755 14.0881 3.67123L11.1209 5.03539C10.8031 4.34448 10.2263 3.81247 9.61662 3.64886C9.15758 3.52528 8.72444 3.61355 8.2913 3.9184C7.84992 4.23031 7.57567 4.7894 7.57685 5.37791C7.57685 5.69099 7.65806 6.27362 8.19478 6.65027C9.44242 7.52479 11.9483 6.86095 14.8991 4.87297C15.3369 4.57871 15.8901 4.5128 16.3845 4.69759C17.3685 5.066 17.4238 5.86402 17.4815 6.70912L18.3937 19.9506C18.4949 21.2606 17.7439 22.4635 16.521 22.9461C13.8845 23.9878 11.3892 24.3468 9.19996 24.3468Z" fill="#37C35C"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">ShiptShots</h1>
                <p className="text-xs text-gray-500">Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Design System Dashboard</h1>
          <p className="text-sm text-gray-600">Component library insights and metrics</p>
        </div>

        {/* Compact Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Components</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.totalComponents}</p>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Screenshots</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.totalScreenshots}</p>
              </div>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Documented</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.componentsWithDocs}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Need Docs</p>
                <p className="text-2xl font-bold text-gray-900">{analysisData.componentsWithoutDocs}</p>
              </div>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documentation Coverage */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Documentation</h3>
            </div>
            
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={`${(analysisData.componentsWithDocs / analysisData.totalComponents) * 50} 50`}
                    className="text-emerald-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{documentationPercentage}%</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 text-center">
              {analysisData.componentsWithDocs} of {analysisData.totalComponents} documented
            </p>
          </div>

          {/* Missing Documentation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Missing Documentation</h3>
              </div>
              {analysisData.missingDocsComponents.length > 4 && (
                <button
                  onClick={() => openModal('missing-docs')}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  Show all ({analysisData.missingDocsComponents.length})
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              {analysisData.missingDocsComponents.length > 0 ? (
                <>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-700">Component</th>
                        <th className="text-right py-2 font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.missingDocsComponents.slice(0, 4).map((component, index) => (
                        <tr key={component} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-gray-900">{component}</td>
                          <td className="py-2 text-right">
                            <Link
                              href={`/browser?component=${encodeURIComponent(component)}`}
                              className="text-gray-600 hover:text-gray-700 font-medium underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">All documented! 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Most Used Properties */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Top Properties</h3>
              </div>
              {Object.keys(analysisData.propertyUsage).length > 4 && (
                <button
                  onClick={() => openModal('top-properties')}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  Show all ({Object.keys(analysisData.propertyUsage).length})
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              {analysisData.topProperties.length > 0 ? (
                <>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-700">Property</th>
                        <th className="text-right py-2 font-medium text-gray-700">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.topProperties.slice(0, 4).map((item, index) => (
                        <tr key={item.property} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-gray-900">{item.property}</td>
                          <td className="py-2 text-right font-bold text-gray-600">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center py-4">
                  <Tag className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No data</p>
                </div>
              )}
            </div>
          </div>

          {/* One-Off Properties */}
          {analysisData.oneOffProperties.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Zap className="h-3 w-3 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">One-Off Properties</h3>
                </div>
                {analysisData.oneOffProperties.length > 6 && (
                  <button
                    onClick={() => openModal('one-off')}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    Show all ({analysisData.oneOffProperties.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="max-h-32 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Property</th>
                      <th className="text-right py-2 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.oneOffProperties.slice(0, 6).map((item, index) => (
                      <tr key={item.property} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-900">{item.property}</td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/browser?component=${encodeURIComponent(item.component)}&screenshot=${encodeURIComponent(item.screenshotId)}`}
                            className="text-gray-600 hover:text-gray-700 font-medium underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Non-2x Images */}
          {analysisData.non2xImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Shield className="h-3 w-3 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Low Resolution Images</h3>
                </div>
                {analysisData.non2xImages.length > 6 && (
                  <button
                    onClick={() => openModal('low-res')}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    Show all ({analysisData.non2xImages.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="max-h-32 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Filename</th>
                      <th className="text-right py-2 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.non2xImages.slice(0, 6).map((item, index) => (
                      <tr key={item.filename} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-900">{item.filename}</td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/browser?component=${encodeURIComponent(item.component)}&screenshot=${encodeURIComponent(item.screenshotId)}`}
                            className="text-gray-600 hover:text-gray-700 font-medium underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'missing-docs'}
        onClose={closeModal}
        title="Missing Documentation"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Component</th>
              <th className="text-right py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {analysisData?.missingDocsComponents.map((component, index) => (
              <tr key={component} className="border-b border-gray-100">
                <td className="py-3 font-medium text-gray-900">{component}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/browser?component=${encodeURIComponent(component)}`}
                    className="text-gray-600 hover:text-gray-700 font-medium underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        isOpen={modalState.isOpen && modalState.type === 'top-properties'}
        onClose={closeModal}
        title="All Properties"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Rank</th>
              <th className="text-left py-3 font-medium text-gray-700">Property</th>
              <th className="text-right py-3 font-medium text-gray-700">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(analysisData?.propertyUsage || {})
              .map(([property, count]) => ({ property, count }))
              .sort((a, b) => b.count - a.count)
              .map((item, index) => (
              <tr key={item.property} className="border-b border-gray-100">
                <td className="py-3 font-bold text-gray-400">{index + 1}</td>
                <td className="py-3 font-medium text-gray-900">{item.property}</td>
                <td className="py-3 text-right font-bold text-gray-600">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        isOpen={modalState.isOpen && modalState.type === 'one-off'}
        onClose={closeModal}
        title="One-Off Properties"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Property</th>
              <th className="text-left py-3 font-medium text-gray-700">Component</th>
              <th className="text-right py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {analysisData?.oneOffProperties.map((item, index) => (
              <tr key={item.property} className="border-b border-gray-100">
                <td className="py-3 font-medium text-gray-900">{item.property}</td>
                <td className="py-3 text-gray-600">{item.component}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/browser?component=${encodeURIComponent(item.component)}&screenshot=${encodeURIComponent(item.screenshotId)}`}
                    className="text-gray-600 hover:text-gray-700 font-medium underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        isOpen={modalState.isOpen && modalState.type === 'low-res'}
        onClose={closeModal}
        title="Low Resolution Images"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Filename</th>
              <th className="text-left py-3 font-medium text-gray-700">Component</th>
              <th className="text-right py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {analysisData?.non2xImages.map((item, index) => (
              <tr key={item.filename} className="border-b border-gray-100">
                <td className="py-3 font-medium text-gray-900">{item.filename}</td>
                <td className="py-3 text-gray-600">{item.component}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/browser?component=${encodeURIComponent(item.component)}&screenshot=${encodeURIComponent(item.screenshotId)}`}
                    className="text-gray-600 hover:text-gray-700 font-medium underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
} 