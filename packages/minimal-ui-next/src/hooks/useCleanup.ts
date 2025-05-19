'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook for managing cleanup functions to prevent memory leaks
 * Provides a way to register multiple cleanup functions that will
 * all be executed when the component unmounts
 */
export function useCleanup() {
  // Store cleanup functions in a ref
  const cleanupFns = useRef<Array<() => void>>([]);
  
  // Register a cleanup function
  const registerCleanup = (fn: () => void) => {
    cleanupFns.current.push(fn);
    
    // Return an unregister function
    return () => {
      const index = cleanupFns.current.indexOf(fn);
      if (index !== -1) {
        cleanupFns.current.splice(index, 1);
      }
    };
  };
  
  // Register a timeout that will be cleared on unmount
  const registerTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    return registerCleanup(() => clearTimeout(timeoutId));
  };
  
  // Register an interval that will be cleared on unmount
  const registerInterval = (callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay);
    return registerCleanup(() => clearInterval(intervalId));
  };
  
  // Register an event listener that will be removed on unmount
  const registerEventListener = <K extends keyof WindowEventMap>(
    target: Window | Document | HTMLElement,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(type, listener as EventListener, options);
    return registerCleanup(() => {
      target.removeEventListener(type, listener as EventListener, options);
    });
  };
  
  // Register an AbortController that will be aborted on unmount
  const registerAbortController = () => {
    const controller = new AbortController();
    registerCleanup(() => controller.abort());
    return controller;
  };
  
  // Run all cleanup functions when component unmounts
  useEffect(() => {
    return () => {
      // Execute all cleanup functions
      cleanupFns.current.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error('Error in cleanup function:', error);
        }
      });
      
      // Clear the array
      cleanupFns.current = [];
    };
  }, []); // Empty dependency array - only run on unmount
  
  return {
    registerCleanup,
    registerTimeout,
    registerInterval,
    registerEventListener,
    registerAbortController
  };
} 