"use client";

import React, { createContext, useContext, useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import LazySettingsModal from './LazySettingsModal';

// Define the context type
interface SettingsModalContextType {
  openSettingsModal: (tabOrEvent: string | MouseEvent<HTMLElement>) => void;
  closeSettingsModal: () => void;
}

// Create the context
const SettingsModalContext = createContext<SettingsModalContextType | undefined>(undefined);

// Provider component
export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string>("account");
  const router = useRouter();

  const openSettingsModal = (tabOrEvent: string | MouseEvent<HTMLElement>) => {
    // If it's an event, prevent default behavior
    if (typeof tabOrEvent !== 'string' && tabOrEvent && 'preventDefault' in tabOrEvent) {
      tabOrEvent.preventDefault();
    }
    
    // If it's a string, use it as the tab
    if (typeof tabOrEvent === 'string') {
      setDefaultTab(tabOrEvent);
    }
    
    setIsOpen(true);
  };
  
  const closeSettingsModal = () => {
    setIsOpen(false);
    // Refresh the router state to ensure clean UI after modal closes
    setTimeout(() => {
      router.refresh();
    }, 100);
  };

  // Handle modal state changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeSettingsModal();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <SettingsModalContext.Provider 
      value={{ 
        openSettingsModal, 
        closeSettingsModal 
      }}
    >
      {children}
      {/* Only render modal when needed */}
      {isOpen && (
        <LazySettingsModal 
          open={isOpen} 
          onOpenChange={handleOpenChange}
          defaultTab={defaultTab}
        />
      )}
    </SettingsModalContext.Provider>
  );
}

// Custom hook to use the context
export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  
  if (context === undefined) {
    throw new Error('useSettingsModal must be used within a SettingsModalProvider');
  }
  
  return context;
} 