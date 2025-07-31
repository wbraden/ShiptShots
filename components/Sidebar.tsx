'use client';

import { ScreenshotData } from '@/types/screenshot';
import { getUniqueComponents } from '@/utils/screenshot';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ShiptShots</h1>
                <p className="text-sm text-gray-500">Screenshot Browser</p>
              </div>
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
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                    selectedComponent === null
                      ? "bg-primary-100 text-primary-700 border border-primary-200"
                      : "text-gray-700 hover:bg-gray-100"
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
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                      selectedComponent === component
                        ? "bg-primary-100 text-primary-700 border border-primary-200"
                        : "text-gray-700 hover:bg-gray-100"
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
          </div>
        </div>
      </div>
    </>
  );
} 