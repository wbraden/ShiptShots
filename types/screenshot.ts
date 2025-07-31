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
}

export type GroupByOption = 'component' | 'state' | 'flat';

export interface FilterOptions {
  search: string;
  component: string;
  state: string;
  tags: string[];
}

export interface GroupedScreenshots {
  [key: string]: ScreenshotData[];
} 