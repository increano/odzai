import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Sidebar } from '../components/sidebar';
import { SettingsModalProvider } from '../components/SettingsModalProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Home | Odzai',
  description: 'Financial dashboard for your budget',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkspaceProvider>
          <SettingsModalProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar />
              <div className="flex-1 overflow-auto">
                <main className="h-full">
                  {children}
                </main>
                <Toaster position="top-right" />
              </div>
            </div>
          </SettingsModalProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
} 