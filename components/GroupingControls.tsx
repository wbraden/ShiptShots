'use client';

import { GroupByOption } from '@/types/screenshot';
import { Grid, Layers, List } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GroupingControlsProps {
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
}

export function GroupingControls({ groupBy, onGroupByChange }: GroupingControlsProps) {
  const options = [
    { value: 'component' as GroupByOption, label: 'By Component', icon: Grid },
    { value: 'state' as GroupByOption, label: 'By State', icon: Layers },
    { value: 'flat' as GroupByOption, label: 'All Screenshots', icon: List }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Group by:</span>
        <div className="flex gap-1">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onGroupByChange(value)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                groupBy === value
                  ? "bg-primary-100 text-primary-700 border border-primary-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 