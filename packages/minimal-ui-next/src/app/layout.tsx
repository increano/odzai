import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Sidebar } from '../components/sidebar';
import { SettingsModalProvider } from '../components/SettingsModalProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';
import AppErrorBoundary from '../components/AppErrorBoundary';
import dynamic from 'next/dynamic';

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

export const metadata: Metadata = {
  title: 'Odzai',
  description: 'Financial dashboard for your budget',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppErrorBoundary>
          <WorkspaceProvider>
            <SettingsModalProvider>
              <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex-1 overflow-auto">
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
        </AppErrorBoundary>
      </body>
    </html>
  );
} 