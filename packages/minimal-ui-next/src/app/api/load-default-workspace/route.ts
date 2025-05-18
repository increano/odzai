import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('Testing default workspace loading...');
    
    // Step 1: Read preferences file
    const projectRoot = path.resolve(process.cwd());
    const preferencesPath = path.join(projectRoot, 'data', 'user-preferences', 'preferences.json');
    console.log('Looking for preferences file at:', preferencesPath);
    
    let defaultWorkspaceId = null;
    if (fs.existsSync(preferencesPath)) {
      try {
        const data = fs.readFileSync(preferencesPath, 'utf8');
        const preferences = JSON.parse(data);
        console.log('Found preferences:', preferences);
        defaultWorkspaceId = preferences.defaultWorkspaceId;
      } catch (error) {
        console.error('Error reading preferences file:', error);
      }
    } else {
      console.log('Preferences file not found');
    }
    
    if (!defaultWorkspaceId) {
      return NextResponse.json({
        success: false,
        error: 'No default workspace ID found in preferences'
      });
    }
    
    // Step 2: Try to load the workspace from the Express server
    console.log('Trying to load workspace with ID:', defaultWorkspaceId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgetId: defaultWorkspaceId }),
      credentials: 'include'
    });
    
    if (!loadResponse.ok) {
      console.error('Failed to load budget on Express server:', loadResponse.statusText);
      return NextResponse.json({
        success: false,
        error: `Failed to load budget on Express server: ${loadResponse.statusText}`
      });
    }
    
    const responseData = await loadResponse.json();
    console.log('Express server response:', responseData);
    
    // Step 3: Return success
    return NextResponse.json({
      success: true,
      defaultWorkspaceId,
      expressResponse: responseData
    });
  } catch (error) {
    console.error('Error in load-default-workspace API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 