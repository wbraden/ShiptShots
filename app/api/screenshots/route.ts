import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ScreenshotData, PropertyControl } from '@/types/screenshot';
import { determineControlType } from '@/utils/propertyControls';

// Optional Sharp import with fallback
let sharp: any = null;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp module not available, using fallback image processing');
}

// Check if image is 2x resolution (with fallback)
async function checkImageResolution(filePath: string): Promise<{ width: number; height: number; is2x: boolean }> {
  try {
    if (sharp) {
      // Use sharp to get actual image dimensions
      const metadata = await sharp(filePath).metadata();
      const { width = 0, height = 0 } = metadata;
      
      // Determine if image is 2x based on common UI component dimensions
      const isLargeEnough = width > 400 || height > 200;
      const aspectRatio = width / height;
      const isReasonableAspectRatio = aspectRatio >= 0.5 && aspectRatio <= 4;
      const hasEvenDimensions = width % 2 === 0 && height % 2 === 0;
      const totalPixels = width * height;
      const isHighPixelCount = totalPixels > 50000;
      const isMultipleOfCommonSizes = 
        (width >= 200 && height >= 100) || 
        (width >= 100 && height >= 200) ||
        (width >= 300 && height >= 150) ||
        (width >= 150 && height >= 300);
      
      const criteria = [
        isLargeEnough,
        isReasonableAspectRatio,
        hasEvenDimensions,
        isHighPixelCount,
        isMultipleOfCommonSizes
      ];
      
      const metCriteria = criteria.filter(Boolean).length;
      const finalIs2x = metCriteria >= 3;
      
      return {
        width,
        height,
        is2x: finalIs2x
      };
    } else {
      // Fallback to file size heuristic
      const stats = fs.statSync(filePath);
      const fileSizeKB = stats.size / 1024;
      const is2x = fileSizeKB > 50;
      return { width: 0, height: 0, is2x };
    }
  } catch (error) {
    console.error('Error checking image resolution:', error);
    // Final fallback
    try {
      const stats = fs.statSync(filePath);
      const fileSizeKB = stats.size / 1024;
      const is2x = fileSizeKB > 50;
      return { width: 0, height: 0, is2x };
    } catch (fallbackError) {
      console.error('Error in fallback resolution check:', fallbackError);
      return { width: 0, height: 0, is2x: false };
    }
  }
}

// Parse filename to extract component, state, and props
function parseFilename(filename: string): { 
  component: string; 
  state: string; 
  props: Record<string, any>;
  propertyControls?: PropertyControl[];
} {
  // Remove .png extension
  const nameWithoutExt = filename.replace(/\.png$/i, '');
  
  // Split by underscore to get parts
  const parts = nameWithoutExt.split('_');
  
  if (parts.length < 1) {
    // Fallback for empty names
    return {
      component: 'Unknown',
      state: 'default',
      props: {}
    };
  }
  
  // First part is component name
  const component = parts[0];
  
  // Extract property controls from any parts that contain key-value pairs
  const propertyControls: PropertyControl[] = [];
  const stateParts: string[] = [];
  
  parts.slice(1).forEach(part => {
    // Skip "props" as it's just a flag
    if (part === 'props') {
      return;
    }
    
    if (part.includes('-')) {
      const firstHyphenIndex = part.indexOf('-');
      const key = part.substring(0, firstHyphenIndex);
      const value = part.substring(firstHyphenIndex + 1);
      if (key && value && value !== 'props') { // Also skip if value is "props"
        propertyControls.push({
          key,
          value,
          type: determineControlType(key, value)
        });
      } else {
        stateParts.push(part);
      }
    } else {
      stateParts.push(part);
    }
  });
  
  const state = stateParts.join('_') || 'default';
  
  // Extract props from state (e.g., "primary_default" -> { type: "primary" })
  const props: Record<string, any> = {};
  if (state.includes('primary')) props.type = 'primary';
  if (state.includes('secondary')) props.type = 'secondary';
  if (state.includes('disabled')) props.disabled = true;
  if (state.includes('focused')) props.focused = true;
  if (state.includes('hover')) props.hover = true;
  if (state.includes('test')) props.test = true;
  if (state.includes('selected')) props.selected = true;
  if (state.includes('unselected')) props.selected = false;
  if (state.includes('checked')) props.checked = true;
  if (state.includes('unchecked')) props.checked = false;
  if (state.includes('open')) props.open = true;
  if (state.includes('closed')) props.open = false;
  if (state.includes('active')) props.active = true;
  if (state.includes('inactive')) props.active = false;
  
  return { component, state, props, propertyControls };
}

// Generate tags based on component and state
function generateTags(component: string, state: string, propertyControls?: PropertyControl[]): string[] {
  const tags: string[] = [];
  
  // Add component name as a tag
  tags.push(component.toLowerCase());
  
  // Split state by underscore and add each part as a tag
  const stateParts = state.split('_');
  stateParts.forEach(part => {
    if (part && part.trim()) {
      tags.push(part.toLowerCase());
    }
  });

  // Add property controls as tags
  if (propertyControls && propertyControls.length > 0) {
    propertyControls.forEach(control => {
      tags.push(control.key.toLowerCase());
      tags.push(control.value.toLowerCase());
    });
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Generate description based on component and state
function generateDescription(component: string, state: string): string {
  return `${component} component in ${state} state`;
}

export async function GET() {
  try {
    console.log('API: Starting to process screenshots...');
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    
    // Check if directory exists
    if (!fs.existsSync(screenshotsDir)) {
      console.log('API: Screenshots directory not found, returning empty array');
      return NextResponse.json({ screenshots: [] });
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(screenshotsDir);
    console.log(`API: Found ${files.length} files in screenshots directory`);
    
    // Filter for PNG files and process them
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    console.log(`API: Found ${pngFiles.length} PNG files`);
    
    // Read markdown files for documentation
    const markdownFiles = files.filter(file => file.toLowerCase().endsWith('.md'));
    const documentation: Record<string, string> = {};
    
    markdownFiles.forEach(filename => {
      const componentName = filename.replace(/\.md$/i, '');
      const filePath = path.join(screenshotsDir, filename);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        documentation[componentName] = content;
      } catch (error) {
        console.error(`Error reading markdown file ${filename}:`, error);
      }
    });
    
    // Process screenshots with async resolution checking
    console.log('API: Starting to process screenshots...');
    const screenshotsPromises = pngFiles.map(async (filename, index) => {
      try {
        const { component, state, props, propertyControls } = parseFilename(filename);
        const tags = generateTags(component, state, propertyControls);
        const description = generateDescription(component, state);
        
        // Get file stats to use actual creation/modification date
        const filePath = path.join(screenshotsDir, filename);
        const stats = fs.statSync(filePath);
        
        // Check image resolution (now async)
        const resolution = await checkImageResolution(filePath);
        
        return {
          id: `${component}_${state}_${index}`,
          component,
          state,
          props,
          filename,
          date: stats.birthtime.toISOString(), // Use file creation date
          tags,
          description,
          imageUrl: `/screenshots/${filename}`,
          thumbnailUrl: `/screenshots/${filename}`,
          documentation: documentation[component] || null,
          propertyControls,
          resolution
        };
      } catch (error) {
        console.error(`Error processing screenshot ${filename}:`, error);
        // Return a fallback object for this screenshot
        return {
          id: `error_${index}`,
          component: 'Error',
          state: 'error',
          props: {},
          filename,
          date: new Date().toISOString(),
          tags: ['error'],
          description: `Error processing ${filename}`,
          imageUrl: `/screenshots/${filename}`,
          thumbnailUrl: `/screenshots/${filename}`,
          documentation: null,
          propertyControls: [],
          resolution: { width: 0, height: 0, is2x: false }
        };
      }
    });
    
    const screenshots = await Promise.all(screenshotsPromises);
    console.log(`API: Successfully processed ${screenshots.length} screenshots`);
    
    // Limit the response size by truncating documentation if it's too large
    const processedScreenshots = screenshots.map(screenshot => ({
      ...screenshot,
      documentation: screenshot.documentation ? screenshot.documentation.substring(0, 500) + '...' : null
    }));
    
    return NextResponse.json({ screenshots: processedScreenshots });
  } catch (error) {
    console.error('Error reading screenshots directory:', error);
    return NextResponse.json({ screenshots: [] }, { status: 500 });
  }
} 