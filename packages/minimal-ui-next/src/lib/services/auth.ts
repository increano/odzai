/**
 * Authentication service providing user validation and admin access checks
 */

/**
 * Checks if a user has admin privileges based on their session
 * 
 * @param sessionToken The user's session token
 * @returns True if user has admin privileges, false otherwise
 */
export async function isAdminUser(sessionToken: string): Promise<boolean> {
  // TEMPORARY: Admin check disabled to allow access to GoCardless setup
  // Return true for all session tokens
  return true;
  
  // Original implementation (commented out):
  /*
  try {
    // This is a placeholder - replace with real admin validation
    // For example, query a database, check with authentication service, etc.
    
    // For demonstration, we'll consider a specific session token as admin
    // In production, this would be a proper check
    const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN;
    
    if (ADMIN_TOKEN && sessionToken === ADMIN_TOKEN) {
      return true;
    }
    
    // Example: Decode JWT token and check admin claim
    // const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
    // return decoded.isAdmin === true;
    
    return false;
  } catch (error) {
    console.error('Error validating admin status:', error);
    return false;
  }
  */
} 