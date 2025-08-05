import { groupTagsIntelligently } from '@/utils/screenshot';
import { Tag } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GroupedTagsProps {
  tags: string[];
  propertyControls?: Array<{ key: string; value: string }>;
  className?: string;
  variant?: 'default' | 'compact';
  maxTags?: number;
}

export function GroupedTags({ tags, propertyControls, className, variant = 'default', maxTags }: GroupedTagsProps) {
  const groupedTags = groupTagsIntelligently(tags, propertyControls);
  const displayTags = maxTags ? groupedTags.slice(0, maxTags) : groupedTags;

  if (!tags || tags.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        {displayTags.map((item, index) => {
          if ('key' in item) {
            // Key-value pair in neutral format
            return (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                <span className="font-medium">{item.key}</span>
                <span className="text-gray-600">:</span>
                <span>{item.value}</span>
              </span>
            );
          } else {
            // Standalone tag
            return (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {item.tag}
              </span>
            );
          }
        })}
        {maxTags && groupedTags.length > maxTags && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{groupedTags.length - maxTags}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {displayTags.map((item, index) => {
          if ('key' in item) {
            // Key-value pair
            return (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                <span className="font-medium">{item.key}</span>
                <span className="text-gray-600">: </span>
                <span>{item.value}</span>
              </span>
            );
          } else {
            // Standalone tag
            return (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {item.tag}
              </span>
            );
          }
        })}
        {maxTags && groupedTags.length > maxTags && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{groupedTags.length - maxTags}
          </span>
        )}
      </div>
    </div>
  );
} 