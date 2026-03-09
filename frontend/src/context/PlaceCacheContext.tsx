/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useRef } from 'react';

type CachedPlaceData = {
  details: any;
  timestamp: number;
  images?: string[];
};

export const usePlaceCache = () => {
  const context = useContext(PlaceCacheContext);
  if (!context) {
    throw new Error('usePlaceCache must be used within PlaceCacheProvider');
  }
  return context;
};

type PlaceCacheContextType = {
  getCachedData: (placeId: number) => CachedPlaceData | undefined;
  setCachedData: (placeId: number, data: any, images?: string[]) => void;
  clearCache: () => void;
};

const PlaceCacheContext = createContext<PlaceCacheContextType | undefined>(undefined);

const CACHE_DURATION = 12000 * 60 * 60;
const MAX_CACHE_SIZE = 100;

export const PlaceCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const cacheRef = useRef<Map<number, CachedPlaceData>>(new Map());

  const getCachedData = (placeId: number) => {
    const cached = cacheRef.current.get(placeId);
    
    if (!cached) return undefined;
    
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cacheRef.current.delete(placeId);
      return undefined;
    }
    
    return cached;
  };

  const setCachedData = (placeId: number, details: any, images?: string[]) => {
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(cacheRef.current.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
      
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }
    
    cacheRef.current.set(placeId, {
      details,
      images,
      timestamp: Date.now()
    });
  };

  const clearCache = () => {
    cacheRef.current.clear();
  };

  return (
    <PlaceCacheContext.Provider value={{ getCachedData, setCachedData, clearCache }}>
      {children}
    </PlaceCacheContext.Provider>
  );
};

