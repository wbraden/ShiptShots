import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ScreenshotData, PropertyControl } from '@/types/screenshot';
import { determineControlType } from '@/utils/propertyControls';

// Check if image is 2x resolution
function checkImageResolution(filePath: string): { width: number; height: number; is2x: boolean } {
  try {
    // For now, we'll use a simple heuristic based on file size
    // In a real implementation, you'd use a library like 'sharp' to get actual dimensions
    const stats = fs.statSync(filePath);
    const fileSizeKB = stats.size / 1024;
    
    // Rough heuristic: files under 50KB are likely not 2x
    // This is a simple approximation - in production you'd want actual image dimensions
    const is2x = fileSizeKB > 50;
    
    return {
      width: 0, // Would be actual width in production
      height: 0, // Would be actual height in production
      is2x
    };
  } catch (error) {
    console.error('Error checking image resolution:', error);
    return { width: 0, height: 0, is2x: false };
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
  
  if (parts.length < 2) {
    // Fallback for simple names
    return {
      component: parts[0] || 'Unknown',
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
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    
    // Check if directory exists
    if (!fs.existsSync(screenshotsDir)) {
      return NextResponse.json({ screenshots: [] });
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(screenshotsDir);
    
    // Filter for PNG files and process them
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    
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
    
    const screenshots: ScreenshotData[] = pngFiles.map((filename, index) => {
      const { component, state, props, propertyControls } = parseFilename(filename);
      const tags = generateTags(component, state, propertyControls);
      const description = generateDescription(component, state);
      
      // Get file stats to use actual creation/modification date
      const filePath = path.join(screenshotsDir, filename);
      const stats = fs.statSync(filePath);
      
      // Check image resolution
      const resolution = checkImageResolution(filePath);
      
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
    });
    
    return NextResponse.json({ screenshots });
  } catch (error) {
    console.error('Error reading screenshots directory:', error);
    return NextResponse.json({ screenshots: [] }, { status: 500 });
  }
} 