import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// Path to store user preferences
const getUserPreferencesPath = () => {
  // Use an absolute path to the project root
  const projectRoot = path.resolve(process.cwd());
  console.log('Project root path:', projectRoot);
  
  const dataDir = path.join(projectRoot, 'data', 'user-preferences');
  console.log('Data directory path:', dataDir);
  
  // Ensure directory exists
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory:', dataDir);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const preferencesPath = path.join(dataDir, 'preferences.json');
  console.log('Preferences file path:', preferencesPath);
  return preferencesPath;
};

// Helper to get user preferences
const getUserPreferences = () => {
  const filePath = getUserPreferencesPath();
  
  if (!fs.existsSync(filePath)) {
    console.log('Preferences file does not exist, returning empty object');
    return {};
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const preferences = JSON.parse(data);
    console.log('Read preferences:', preferences);
    return preferences;
  } catch (error) {
    console.error('Error reading user preferences:', error);
    return {};
  }
};

// Helper to save user preferences
const saveUserPreferences = (preferences: any) => {
  const filePath = getUserPreferencesPath();
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2), 'utf8');
    console.log('Saved preferences successfully:', preferences);
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

/**
 * GET /api/user/preferences
 * 
 * Get user preferences
 */
export async function GET(request: Request) {
  try {
    console.log('GET /api/user/preferences called');
    let preferences = getUserPreferences();
    
    // Check if the request is from login page via headers
    const referer = request.headers.get('referer') || '';
    const isLoginPage = referer.includes('/login');
    
    // If on login page, don't return defaultWorkspaceId to prevent redirect loops
    if (isLoginPage) {
      console.log('Request from login page detected, removing defaultWorkspaceId');
      // Create a new object without the defaultWorkspaceId
      const { defaultWorkspaceId, ...safePreferences } = preferences;
      preferences = safePreferences;
    }
    
    console.log('Returning preferences:', preferences);
    
    // Add cache control headers to prevent stale data
    return NextResponse.json(preferences, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/preferences
 * 
 * Update user preferences
 */
export async function POST(request: Request) {
  try {
    console.log('POST /api/user/preferences called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const currentPreferences = getUserPreferences();
    
    // Merge new preferences with existing ones
    const updatedPreferences = {
      ...currentPreferences,
      ...body
    };
    
    console.log('Updating preferences to:', updatedPreferences);
    const success = saveUserPreferences(updatedPreferences);
    
    if (!success) {
      throw new Error('Failed to save user preferences');
    }
    
    return NextResponse.json({
      success: true,
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
} 