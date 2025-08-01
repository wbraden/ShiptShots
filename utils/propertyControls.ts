import { PropertyControl, PropertyGroup } from '@/types/screenshot';

// Determine the type of a property control based on its key and value
export function determineControlType(key: string, value: string): 'toggle' | 'dropdown' | 'text' {
  // Boolean values (true/false) become toggles
  if (value === 'true' || value === 'false') {
    return 'toggle';
  }
  
  // Common property keys that should be dropdowns
  const dropdownKeys = ['size', 'variant', 'type', 'color', 'theme', 'state'];
  if (dropdownKeys.includes(key.toLowerCase())) {
    return 'dropdown';
  }
  
  // Default to text for other properties
  return 'text';
}

// Group property controls by key and determine their types
export function groupPropertyControls(screenshots: any[]): PropertyGroup[] {
  const propertyMap = new Map<string, Set<string>>();
  
  // Collect all unique values for each property key
  screenshots.forEach(screenshot => {
    if (screenshot.propertyControls) {
      screenshot.propertyControls.forEach((control: PropertyControl) => {
        if (!propertyMap.has(control.key)) {
          propertyMap.set(control.key, new Set());
        }
        propertyMap.get(control.key)!.add(control.value);
      });
    }
  });
  
  // Convert to PropertyGroup array
  const groups: PropertyGroup[] = [];
  propertyMap.forEach((values, key) => {
    const valueArray = Array.from(values);
    const firstValue = valueArray[0];
    
    // Determine control type based on the first value
    const type = determineControlType(key, firstValue);
    
    // For toggles, ensure we have both true and false values
    if (type === 'toggle') {
      if (!valueArray.includes('true')) valueArray.push('true');
      if (!valueArray.includes('false')) valueArray.push('false');
    }
    
    groups.push({
      key,
      type,
      options: valueArray.sort(),
      currentValue: firstValue
    });
  });
  
  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

// Filter screenshots based on selected property values
export function filterScreenshotsByProperties(
  screenshots: any[], 
  selectedProperties: Record<string, string>
): any[] {
  if (Object.keys(selectedProperties).length === 0) {
    return screenshots;
  }
  
  return screenshots.filter(screenshot => {
    if (!screenshot.propertyControls) return false;
    
    // Check if all selected properties match
    return Object.entries(selectedProperties).every(([key, value]) => {
      const control = screenshot.propertyControls.find((c: PropertyControl) => c.key === key);
      return control && control.value === value;
    });
  });
}

// Check if a component has property controls
export function hasPropertyControls(screenshots: any[], component?: string): boolean {
  const filteredScreenshots = component 
    ? screenshots.filter(s => s.component === component)
    : screenshots;
  
  return filteredScreenshots.some(screenshot => 
    screenshot.propertyControls && screenshot.propertyControls.length > 0
  );
} 