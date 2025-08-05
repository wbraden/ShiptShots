import { ScreenshotData, ScreenshotMetadata, GroupByOption, FilterOptions, GroupedScreenshots } from '@/types/screenshot';

// Sample screenshot filenames - in a real app, these would be read from the filesystem
const SAMPLE_FILENAMES = [
  'Button_primary_default.png',
  'Button_primary_disabled.png',
  'Button_secondary_default.png',
  'Button_secondary_hover.png',
  'Input_text_default.png',
  'Input_text_focused.png',
  'Input_text_error.png',
  'Card_default.png',
  'Card_hover.png',
  'Modal_open.png',
  'Modal_loading.png',
  'Dropdown_closed.png',
  'Dropdown_open.png',
  'Checkbox_unchecked.png',
  'Checkbox_checked.png',
  'Badge_success.png',
  'Badge_error.png',
  'Badge_warning.png'
];

// Parse filename to extract component, state, and props
export function parseFilename(filename: string): { component: string; state: string; props: Record<string, any> } {
  // Remove .png extension
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  
  // Split by underscore
  const parts = nameWithoutExt.split('_');
  
  if (parts.length < 2) {
    // Fallback for simple filenames
    return {
      component: parts[0] || 'Unknown',
      state: 'default',
      props: {}
    };
  }
  
  const component = parts[0];
  const state = parts.slice(1).join('_'); // Join remaining parts as state
  
  // Generate props based on state
  const props: Record<string, any> = {};
  
  if (state.includes('primary')) props.type = 'primary';
  if (state.includes('secondary')) props.type = 'secondary';
  if (state.includes('disabled')) props.disabled = true;
  if (state.includes('hover')) props.hover = true;
  if (state.includes('focused')) props.focused = true;
  if (state.includes('error')) props.error = true;
  if (state.includes('success')) props.type = 'success';
  if (state.includes('warning')) props.type = 'warning';
  if (state.includes('loading')) props.loading = true;
  if (state.includes('open')) props.open = true;
  if (state.includes('closed')) props.open = false;
  if (state.includes('checked')) props.checked = true;
  if (state.includes('unchecked')) props.checked = false;
  
  return { component, state, props };
}

// Generate tags based on component and state
export function generateTags(component: string, state: string): string[] {
  const tags: string[] = [];
  
  // Component-based tags
  if (['Button', 'Input', 'Dropdown', 'Checkbox'].includes(component)) {
    tags.push('form', 'interactive');
  }
  if (['Card', 'Modal'].includes(component)) {
    tags.push('layout', 'container');
  }
  if (component === 'Modal') {
    tags.push('overlay', 'dialog');
  }
  if (component === 'Badge') {
    tags.push('status');
  }
  
  // State-based tags
  if (state.includes('primary')) tags.push('primary');
  if (state.includes('secondary')) tags.push('secondary');
  if (state.includes('disabled')) tags.push('disabled');
  if (state.includes('hover')) tags.push('hover');
  if (state.includes('focused')) tags.push('focused');
  if (state.includes('error')) tags.push('error');
  if (state.includes('success')) tags.push('success');
  if (state.includes('warning')) tags.push('warning');
  if (state.includes('loading')) tags.push('loading');
  if (state.includes('open')) tags.push('open');
  if (state.includes('checked')) tags.push('checked');
  
  return [...new Set(tags)]; // Remove duplicates
}

// Generate description based on component and state
export function generateDescription(component: string, state: string): string {
  const stateName = state.replace(/_/g, ' ');
  return `${component} component in ${stateName} state`;
}

// Generate image URL based on filename
export function generateImageUrl(filename: string): string {
  return `/screenshots/${filename}`;
}

// Process filenames into screenshot data
export function processScreenshotData(filenames: string[]): ScreenshotData[] {
  return filenames.map((filename, index) => {
    const { component, state, props } = parseFilename(filename);
    const tags = generateTags(component, state);
    const description = generateDescription(component, state);
    
    return {
      id: `${component}_${state}_${index}`,
      component,
      state,
      props,
      filename,
      date: new Date().toISOString(), // Use current date as fallback
      tags,
      description,
      imageUrl: generateImageUrl(filename),
      thumbnailUrl: generateImageUrl(filename)
    };
  });
}

// Get all screenshot data from filenames
export function getAllScreenshots(): ScreenshotData[] {
  console.log('Getting screenshots from filenames:', SAMPLE_FILENAMES);
  const screenshots = processScreenshotData(SAMPLE_FILENAMES);
  console.log('Processed screenshots:', screenshots);
  return screenshots;
}

// Filter screenshots based on search and filter options
export function filterScreenshots(
  screenshots: ScreenshotData[],
  filters: FilterOptions
): ScreenshotData[] {
  return screenshots.filter(screenshot => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        screenshot.component.toLowerCase().includes(searchLower) ||
        screenshot.state.toLowerCase().includes(searchLower) ||
        screenshot.description?.toLowerCase().includes(searchLower) ||
        screenshot.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Component filter
    if (filters.component && screenshot.component !== filters.component) {
      return false;
    }
    
    // State filter
    if (filters.state && screenshot.state !== filters.state) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      if (filters.tagFilterMode === 'AND') {
        // All selected tags must be present
        const hasAllTags = filters.tags.every(tag => 
          screenshot.tags?.includes(tag)
        );
        if (!hasAllTags) return false;
      } else {
        // Any selected tag can be present (OR mode)
        const hasAnyTag = filters.tags.some(tag => 
          screenshot.tags?.includes(tag)
        );
        if (!hasAnyTag) return false;
      }
    }
    
    return true;
  });
}

// Group screenshots by specified option
export function groupScreenshots(
  screenshots: ScreenshotData[],
  groupBy: GroupByOption
): GroupedScreenshots {
  const grouped: GroupedScreenshots = {};
  
  screenshots.forEach(screenshot => {
    let key: string;
    
    switch (groupBy) {
      case 'component':
        key = screenshot.component;
        break;
      case 'state':
        key = screenshot.state;
        break;
      case 'flat':
      default:
        key = 'All Screenshots';
        break;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    
    grouped[key].push(screenshot);
  });
  
  return grouped;
}

// Get unique values for filter dropdowns
export function getUniqueComponents(screenshots: ScreenshotData[]): string[] {
  return [...new Set(screenshots.map(s => s.component))].sort();
}

export function getUniqueStates(screenshots: ScreenshotData[]): string[] {
  return [...new Set(screenshots.map(s => s.state))].sort();
}

export function getUniqueTags(screenshots: ScreenshotData[]): string[] {
  const allTags = screenshots.flatMap(s => s.tags || []);
  return [...new Set(allTags)].sort();
}

// Format date for display in Figma-style relative format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  } else {
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  }
}

// Generate shareable URL for a screenshot
export function generateShareableUrl(screenshotId: string): string {
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}/browser?screenshot=${screenshotId}`;
  }
  return '';
} 

// Group tags intelligently using property controls from filename parsing
export function groupTagsIntelligently(
  tags: string[], 
  propertyControls?: Array<{ key: string; value: string }>
): Array<{ key: string; value: string } | { tag: string }> {
  const grouped: Array<{ key: string; value: string } | { tag: string }> = [];
  
  // If we have property controls, use them directly for key-value pairs
  if (propertyControls && propertyControls.length > 0) {
    propertyControls.forEach(control => {
      grouped.push({ key: control.key, value: control.value });
    });
  }
  
  // Add remaining tags that aren't part of property controls
  const propertyKeys = new Set(propertyControls?.map(pc => pc.key.toLowerCase()) || []);
  const propertyValues = new Set(propertyControls?.map(pc => pc.value.toLowerCase()) || []);
  
  tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    // Only add tags that aren't already covered by property controls
    if (!propertyKeys.has(lowerTag) && !propertyValues.has(lowerTag)) {
      grouped.push({ tag });
    }
  });

  return grouped;
} 