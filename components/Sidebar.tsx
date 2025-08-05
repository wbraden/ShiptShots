'use client';

import { ScreenshotData } from '@/types/screenshot';
import { getUniqueComponents } from '@/utils/screenshot';
import { ChevronRight, Microscope } from 'lucide-react';
import { cn } from '@/utils/cn';
import Link from 'next/link';

interface SidebarProps {
  screenshots: ScreenshotData[];
  selectedComponent: string | null;
  onComponentSelect: (component: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  screenshots,
  selectedComponent,
  onComponentSelect,
  isOpen,
  onToggle
}: SidebarProps) {
  const components = getUniqueComponents(screenshots);
  
  // Count screenshots per component
  const componentCounts = components.reduce((acc, component) => {
    acc[component] = screenshots.filter(s => s.component === component).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out",
        "w-64 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg width="19" height="25" viewBox="0 0 19 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.19996 24.3468C5.8278 24.3468 3.18303 23.4922 1.86477 22.9602C0.661856 22.4753 -0.0831974 21.283 0.00743309 19.993L0.66421 9.27855L3.92338 9.47864L3.27837 20.0083C5.19691 20.7474 9.78729 22.0163 15.1227 19.9859C15.0415 18.8042 14.6142 12.5989 14.3635 8.97723C11.102 10.6215 8.3525 10.7486 6.31979 9.32445C5.04508 8.4311 4.31297 6.99395 4.31062 5.38261C4.30826 3.72302 5.09334 2.17759 6.41042 1.24892C7.63217 0.387343 9.07284 0.12016 10.4664 0.494452C12.0119 0.90994 13.3654 2.09755 14.0881 3.67123L11.1209 5.03539C10.8031 4.34448 10.2263 3.81247 9.61662 3.64886C9.15758 3.52528 8.72444 3.61355 8.2913 3.9184C7.84992 4.23031 7.57567 4.7894 7.57685 5.37791C7.57685 5.69099 7.65806 6.27362 8.19478 6.65027C9.44242 7.52479 11.9483 6.86095 14.8991 4.87297C15.3369 4.57871 15.8901 4.5128 16.3845 4.69759C17.3685 5.066 17.4238 5.86402 17.4815 6.70912L18.3937 19.9506C18.4949 21.2606 17.7439 22.4635 16.521 22.9461C13.8845 23.9878 11.3892 24.3468 9.19996 24.3468Z" fill="#37C35C"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">ShiptShots</h1>
                  <p className="text-sm text-gray-500">Screenshot Browser</p>
                </div>
              </Link>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Components Eyebrow */}
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Components</h2>
              </div>
              
              <div className="space-y-1">
                {/* All Components Option */}
                <button
                  onClick={() => onComponentSelect(null)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors border",
                    selectedComponent === null
                      ? "bg-primary-100 text-primary-700 border-primary-200"
                      : "text-gray-700 hover:bg-gray-100 border-transparent"
                  )}
                >
                  <span className="font-medium">All Components</span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    selectedComponent === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  )}>
                    {screenshots.length}
                  </span>
                </button>

                {/* Individual Components */}
                {components.map((component) => (
                  <button
                    key={component}
                    onClick={() => onComponentSelect(component)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors border",
                      selectedComponent === component
                        ? "bg-primary-100 text-primary-700 border-primary-200"
                        : "text-gray-700 hover:bg-gray-100 border-transparent"
                    )}
                  >
                    <span>{component}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      selectedComponent === component
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    )}>
                      {componentCounts[component]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Total Screenshots:</span>
                <span className="font-medium">{screenshots.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Components:</span>
                <span className="font-medium">{components.length}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href="/analysis"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                <Microscope className="w-4 h-4" />
                <span>Analysis</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 