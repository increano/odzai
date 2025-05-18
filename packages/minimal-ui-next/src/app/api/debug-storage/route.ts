import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // This function returns debugging information for troubleshooting
    console.log('Debug storage API called');
    
    const projectRoot = path.resolve(process.cwd());
    console.log('Project root:', projectRoot);
    
    // Check for preferences file
    const preferencesDir = path.join(projectRoot, 'data', 'user-preferences');
    const preferencesFile = path.join(preferencesDir, 'preferences.json');
    
    // Directory info
    let directoryInfo = 'Preferences directory does not exist';
    if (fs.existsSync(preferencesDir)) {
      const stats = fs.statSync(preferencesDir);
      directoryInfo = `Preferences directory exists (permissions: ${stats.mode.toString(8)})`;
    }
    
    // File info
    let fileContents = 'Preferences file does not exist';
    if (fs.existsSync(preferencesFile)) {
      try {
        const rawData = fs.readFileSync(preferencesFile, 'utf8');
        const parsedData = JSON.parse(rawData);
        fileContents = parsedData;
      } catch (error) {
        fileContents = `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    
    // Cookie info
    const cookieList = cookies().getAll();
    
    // List all available directories in data
    let dataDirectories: string[] = [];
    try {
      if (fs.existsSync(path.join(projectRoot, 'data'))) {
        dataDirectories = fs.readdirSync(path.join(projectRoot, 'data'));
      }
    } catch (error) {
      console.error('Error reading data directory:', error);
    }
    
    return NextResponse.json({
      status: 'success',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL || '(not set)',
      },
      filesystemInfo: {
        projectRoot,
        preferencesDir: {
          path: preferencesDir,
          status: directoryInfo,
        },
        preferencesFile: {
          path: preferencesFile,
          contents: fileContents,
        },
        dataDirectories,
      },
      cookieInfo: cookieList,
      timestamp: new Date().toISOString(),
      instructions: "This information is for debugging only. Check the browser's localStorage for 'odzai-current-workspace'"
    });
  } catch (error) {
    console.error('Error in debug-storage API:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 