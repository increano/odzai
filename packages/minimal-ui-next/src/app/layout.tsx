'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Sidebar } from '../components/sidebar';
import { SettingsModalProvider } from '../components/SettingsModalProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';
import AppErrorBoundary from '../components/AppErrorBoundary';
import dynamic from 'next/dynamic';
import { SupabaseAuthProvider } from '../components/providers/SupabaseAuthProvider';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Dynamically import the AdminToggle component with no SSR
const AdminToggle = dynamic(
  () => import('@/components/admin/AdminToggle'),
  { ssr: false }
);

// Dynamically import the AdminLogin component with no SSR
const AdminLogin = dynamic(
  () => import('@/components/admin/AdminLogin'),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

// Debug function to check for auth cookies in browser
function debugAuthCookies() {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookies = cookies.filter(c => 
      c.startsWith('sb-') || 
      c.startsWith('supabase-auth')
    );
    
    console.log('Auth cookies check:', authCookies.length ? authCookies : 'No auth cookies found');
    
    // Check local storage for tokens too
    const localStorageKeys = Object.keys(localStorage);
    const authKeys = localStorageKeys.filter(k => 
      k.includes('supabase') || 
      k.includes('sb-')
    );
    
    if (authKeys.length > 0) {
      console.log('Auth storage keys:', authKeys);
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';
  
  // Debug auth on layout mount
  useEffect(() => {
    console.log('Root layout mounted, checking auth state');
    debugAuthCookies();
    
    // Also debug on storage changes
    const handleStorageChange = () => {
      console.log('Storage changed, re-checking auth');
      debugAuthCookies();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppErrorBoundary>
          <SupabaseAuthProvider>
            <WorkspaceProvider>
              <SettingsModalProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                  {!isAuthPage && <Sidebar />}
                  <div className={`overflow-auto ${isAuthPage ? 'w-full' : 'flex-1'}`}>
                    <main className="h-full">
                      {children}
                    </main>
                    <Toaster position="top-right" richColors />
                  </div>
                </div>
                
                {/* Only render admin components in development mode */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <AdminToggle />
                    <AdminLogin />
                  </>
                )}
              </SettingsModalProvider>
            </WorkspaceProvider>
          </SupabaseAuthProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
} 