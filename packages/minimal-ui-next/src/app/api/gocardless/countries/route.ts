import { NextResponse } from 'next/server';

/**
 * Get countries supported by GoCardless
 * GET /api/gocardless/countries
 */
export async function GET() {
  try {
    // For demonstration purposes, return a static list of countries
    // In production, you would connect to your actual backend
    return NextResponse.json({
      countries: [
        { id: 'AT', name: 'Austria' },
        { id: 'BE', name: 'Belgium' },
        { id: 'CZ', name: 'Czech Republic' },
        { id: 'DE', name: 'Germany' },
        { id: 'DK', name: 'Denmark' },
        { id: 'EE', name: 'Estonia' },
        { id: 'ES', name: 'Spain' },
        { id: 'FI', name: 'Finland' },
        { id: 'FR', name: 'France' },
        { id: 'GB', name: 'United Kingdom' },
        { id: 'IE', name: 'Ireland' },
        { id: 'IT', name: 'Italy' },
        { id: 'LT', name: 'Lithuania' },
        { id: 'LV', name: 'Latvia' },
        { id: 'NL', name: 'Netherlands' },
        { id: 'NO', name: 'Norway' },
        { id: 'PL', name: 'Poland' },
        { id: 'PT', name: 'Portugal' },
        { id: 'RO', name: 'Romania' },
        { id: 'SE', name: 'Sweden' },
        { id: 'SK', name: 'Slovakia' }
      ]
    });
    
    /* Comment out the backend API call until your backend is ready
    // Use a different path to avoid recursion if the URLs are the same
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendPath = '/backend/gocardless/countries'; // Change this to your actual backend endpoint
    
    console.log(`Fetching countries from: ${apiUrl}${backendPath}`);
    
    const response = await fetch(`${apiUrl}${backendPath}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);
      
      let errorMessage = 'Failed to fetch countries';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If the response is not JSON, use the error text
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    */
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 