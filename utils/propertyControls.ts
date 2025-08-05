import { PropertyControl, PropertyGroup } from '@/types/screenshot';

/**
 * IMMUTABLE PROPERTY CONTROL BEHAVIOR - DO NOT CHANGE
 * 
 * This system implements Figma/Storybook-style variant behavior:
 * 1. ALL property options are always available (no filtering based on current selection)
 * 2. When a property changes, ALL other properties automatically adjust to match a valid variant
 * 3. The system finds the best matching screenshot and updates all properties accordingly
 * 
 * This ensures users can always select any property value and get a valid combination.
 */

// Determine the type of a property control based on its key and value
export function determineControlType(key: string, value: string): 'toggle' | 'dropdown' {
  // Boolean values (true/false) become toggles
  if (value === 'true' || value === 'false') {
    return 'toggle';
  }

  // Everything else becomes a dropdown
  return 'dropdown';
}

/**
 * IMMUTABLE: Get ALL available options for a property key (no filtering)
 * This ensures users can always select any property value
 */
export function getAvailableOptionsForProperty(
  screenshots: any[],
  propertyKey: string,
  currentSelections: Record<string, string> = {}
): string[] {
  const availableOptions = new Set<string>();
  
  screenshots.forEach(screenshot => {
    if (!screenshot.propertyControls) return;
    
    const control = screenshot.propertyControls.find((c: PropertyControl) => c.key === propertyKey);
    if (control) {
      availableOptions.add(control.value);
    }
  });
  
  return Array.from(availableOptions).sort();
}

/**
 * IMMUTABLE: Group property controls with ALL available options (no filtering)
 * This ensures dropdowns always show all possible values
 */
export function groupPropertyControls(
  screenshots: any[], 
  currentSelections: Record<string, string> = {}
): PropertyGroup[] {
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
  
  // Convert to PropertyGroup array with ALL available options (no filtering)
  const groups: PropertyGroup[] = [];
  propertyMap.forEach((values, key) => {
    const allValues = Array.from(values);
    const firstValue = allValues[0];
    
    // Determine control type based on the first value
    const type = determineControlType(key, firstValue);
    
    // For toggles, ensure we have both true and false values if they exist
    let options = allValues;
    if (type === 'toggle') {
      if (allValues.includes('true') && !options.includes('true')) options.push('true');
      if (allValues.includes('false') && !options.includes('false')) options.push('false');
      options = options.sort();
    }
    
    groups.push({
      key,
      type,
      options, // IMMUTABLE: Always show all options
      currentValue: currentSelections[key] || firstValue
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

/**
 * IMMUTABLE: Find the best matching screenshot for given property selections
 * This is used for fallback when no exact match is found
 */
export function findBestMatchingScreenshot(
  screenshots: any[],
  selectedProperties: Record<string, string>
): any | null {
  const exactMatches = filterScreenshotsByProperties(screenshots, selectedProperties);
  
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }
  
  // If no exact match, find the closest match by relaxing constraints
  const partialMatches = screenshots.filter(screenshot => {
    if (!screenshot.propertyControls) return false;
    
    // Check if at least one property matches
    return Object.entries(selectedProperties).some(([key, value]) => {
      const control = screenshot.propertyControls.find((c: PropertyControl) => c.key === key);
      return control && control.value === value;
    });
  });
  
  return partialMatches.length > 0 ? partialMatches[0] : null;
}

/**
 * IMMUTABLE: Update all properties when one property changes to match valid combinations
 * 
 * CRITICAL BEHAVIOR - DO NOT CHANGE:
 * 1. Find ALL screenshots that have the changed property value
 * 2. Use the FIRST matching screenshot to set ALL properties
 * 3. This ensures users can select any property value and get a valid combination
 * 
 * Example: User selects "Type: Large-route" → automatically changes "User" to "Driver"
 */
export function updatePropertiesForValidCombination(
  screenshots: any[],
  changedKey: string,
  changedValue: string,
  currentProperties: Record<string, string>
): Record<string, string> {
  // IMMUTABLE: Find ALL screenshots that have the changed property value
  const matchingScreenshots = screenshots.filter(screenshot => {
    if (!screenshot.propertyControls) return false;
    
    // Check if this screenshot has the changed property
    const changedControl = screenshot.propertyControls.find((c: PropertyControl) => c.key === changedKey);
    return changedControl && changedControl.value === changedValue;
  });
  
  if (matchingScreenshots.length > 0) {
    // IMMUTABLE: Use the FIRST matching screenshot to set ALL properties
    const matchingScreenshot = matchingScreenshots[0];
    const updatedProperties: Record<string, string> = {};
    
    matchingScreenshot.propertyControls?.forEach((control: PropertyControl) => {
      updatedProperties[control.key] = control.value;
    });
    
    return updatedProperties;
  }
  
  // If no exact match, just update the changed property
  return { ...currentProperties, [changedKey]: changedValue };
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