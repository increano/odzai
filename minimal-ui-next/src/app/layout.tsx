'use client';

import React, { useState } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Header } from '@/components/navigation/header';
import { Sidebar } from '@/components/navigation/sidebar';
import { WorkspaceProvider } from '@/context/workspace-context';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WorkspaceProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar - hidden on mobile, collapsible on desktop */}
            <div 
              className={`hidden lg:block transition-all duration-300 ease-in-out ${
                sidebarVisible ? 'lg:w-[250px]' : 'lg:w-0 lg:opacity-0'
              }`}
            >
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />
              <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
                <div className="container px-4 py-6 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </WorkspaceProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
