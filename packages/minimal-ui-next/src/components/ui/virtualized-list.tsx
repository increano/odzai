'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemHeight?: (item: T, index: number) => number;
  itemKey: (item: T, index: number) => string | number;
  className?: string;
  itemClassName?: string;
  overscan?: number;
  scrollToIndex?: number;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  isLoading?: boolean;
  height?: number | string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  id?: string;
}

/**
 * VirtualizedList component for rendering large lists efficiently
 * Only renders items that are visible within the viewport
 */
export function VirtualizedList<T>({
  data,
  renderItem,
  getItemHeight = () => 50, // Default height of 50px per item
  itemKey,
  className,
  itemClassName,
  overscan = 3,
  scrollToIndex,
  emptyState,
  loadingState,
  isLoading = false,
  height = '100%',
  onEndReached,
  endReachedThreshold = 250,
  id,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isEndReachedCalled, setIsEndReachedCalled] = useState(false);

  // Calculate the total height of all items
  const totalHeight = useMemo(() => {
    return data.reduce((acc, item, index) => {
      return acc + getItemHeight(item, index);
    }, 0);
  }, [data, getItemHeight]);

  // Calculate which items should be visible
  const visibleItems = useMemo(() => {
    if (data.length === 0) return [];

    let startIndex = 0;
    let currentOffset = 0;
    
    // Find the start index based on scroll position
    while (startIndex < data.length) {
      const itemHeight = getItemHeight(data[startIndex], startIndex);
      if (currentOffset + itemHeight > scrollTop - itemHeight * overscan) {
        break;
      }
      currentOffset += itemHeight;
      startIndex++;
    }
    
    // Calculate how many items to render
    let visibleItemCount = 0;
    let currentHeight = 0;
    while (
      startIndex + visibleItemCount < data.length &&
      currentHeight < containerHeight + getItemHeight(data[startIndex + visibleItemCount], startIndex + visibleItemCount) * overscan * 2
    ) {
      currentHeight += getItemHeight(data[startIndex + visibleItemCount], startIndex + visibleItemCount);
      visibleItemCount++;
    }
    
    // Create array of visible items with their offsets
    return Array.from({ length: visibleItemCount }).map((_, index) => {
      const itemIndex = startIndex + index;
      const offset = Array.from({ length: itemIndex }).reduce((acc: number, _, i) => {
        return acc + getItemHeight(data[i], i);
      }, 0);
      
      return {
        item: data[itemIndex],
        index: itemIndex,
        offset,
      };
    });
  }, [data, scrollTop, containerHeight, getItemHeight, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // Check if we're near the end to trigger load more
    if (
      onEndReached &&
      !isEndReachedCalled &&
      scrollTop + containerHeight + endReachedThreshold >= totalHeight
    ) {
      setIsEndReachedCalled(true);
      onEndReached();
    } else if (scrollTop + containerHeight + endReachedThreshold < totalHeight) {
      setIsEndReachedCalled(false);
    }
  }, [containerHeight, endReachedThreshold, isEndReachedCalled, onEndReached, totalHeight]);

  // Measure the container height after mount
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        setContainerHeight(entries[0].contentRect.height);
      });
      
      resizeObserver.observe(containerRef.current);
      setContainerHeight(containerRef.current.clientHeight);
      
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    }
  }, []);

  // Scroll to index if specified
  useEffect(() => {
    if (scrollToIndex != null && containerRef.current) {
      const offset = Array.from({ length: scrollToIndex }).reduce((acc: number, _, i) => {
        return acc + getItemHeight(data[i], i);
      }, 0);
      
      containerRef.current.scrollTop = offset;
    }
  }, [scrollToIndex, data, getItemHeight]);
  
  // Cleanup AbortController on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setIsEndReachedCalled(false);
    };
  }, [data]);

  // Show loading state if loading
  if (isLoading && loadingState) {
    return <div className={className}>{loadingState}</div>;
  }

  // Show empty state if no data
  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      id={id}
      ref={containerRef}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      className={cn('virtualized-list', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offset }) => (
          <div
            key={itemKey(item, index)}
            className={cn('virtualized-item', itemClassName)}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${offset}px)`,
              width: '100%',
              height: getItemHeight(item, index),
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
} 