export interface ScreenshotMetadata {
  component: string;
  state: string;
  props: Record<string, any>;
  filename: string;
  date: string;
  tags?: string[];
  description?: string;
}

export interface ScreenshotData extends ScreenshotMetadata {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  documentation?: string | null;
}

export type GroupByOption = 'component' | 'state' | 'flat';

export interface FilterOptions {
  search: string;
  component: string;
  state: string;
  tags: string[];
  tagFilterMode: 'AND' | 'OR'; // 'AND' = all tags must be present, 'OR' = any tag can be present
}

export interface GroupedScreenshots {
  [key: string]: ScreenshotData[];
} 