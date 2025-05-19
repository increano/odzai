import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Toggle admin status for testing purposes
 * This is only for development and testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  
  const cookieStore = cookies();
  const currentState = cookieStore.get('odzai-admin')?.value === 'true';
  
  // If state is explicitly set, use that value
  const newState = state === 'true' 
    ? true 
    : state === 'false' 
      ? false 
      : !currentState; // Toggle if not specified
  
  // Set the cookie
  cookies().set('odzai-admin', String(newState), {
    path: '/',
    maxAge: 86400, // 1 day
    httpOnly: false // Allow JavaScript access for demo purposes
  });
  
  // Also set user cookie for Fabrice Mhr if enabling admin
  if (newState) {
    cookies().set('user', 'fabricemhr', {
      path: '/',
      maxAge: 86400,
      httpOnly: false
    });
  }
  
  // Return the new state
  return NextResponse.json({
    success: true,
    isAdmin: newState
  });
} 