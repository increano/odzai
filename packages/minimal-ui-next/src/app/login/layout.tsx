'use client';

import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Special minimalistic layout for login/auth pages 
// Doesn't include sidebar or other components that might make authenticated API requests
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-background`}>
      <main className="h-full">
        {children}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
} 