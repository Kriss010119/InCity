import React, { createContext, useContext, useRef, useCallback } from 'react';
import type { CachedPlaceData, PlaceCacheContextType, PlaceDetails, VisitPoint } from '../types';
import { buildFullPlaceDetails } from '../api/wikipediaService';

const PlaceCacheContext = createContext<PlaceCacheContextType | undefined>(undefined);

const CACHE_DURATION = 12 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

export const PlaceCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const cacheRef = useRef<Map<number, CachedPlaceData>>(new Map());
  const pendingRequests = useRef<Map<number, Promise<void>>>(new Map());

  const getCachedData = useCallback((placeId: number) => {
    const cached = cacheRef.current.get(placeId);
    if (!cached) return undefined;
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cacheRef.current.delete(placeId);
      return undefined;
    }
    return cached;
  }, []);

  const setCachedData = useCallback((placeId: number, details: PlaceDetails, images?: string[]) => {
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(cacheRef.current.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      )[0]?.[0];
      if (oldestKey) cacheRef.current.delete(oldestKey);
    }
    cacheRef.current.set(placeId, { details, images, timestamp: Date.now() });
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    pendingRequests.current.clear();
  }, []);

  const preloadPlace = useCallback(
    async (place: VisitPoint) => {
      if (cacheRef.current.has(place.id) || pendingRequests.current.has(place.id)) {
        return;
      }
      const loadPromise = (async () => {
        try {
          const { details, images } = await buildFullPlaceDetails(place.tags || []);
          setCachedData(place.id, details as PlaceDetails, images);
        } catch (error) {
          console.warn(`Preload failed for place ${place.id}`, error);
          setCachedData(place.id, {}, []);
        } finally {
          pendingRequests.current.delete(place.id);
        }
      })();
      pendingRequests.current.set(place.id, loadPromise);
    },
    [setCachedData],
  );

  return (
    <PlaceCacheContext.Provider value={{ getCachedData, setCachedData, clearCache, preloadPlace }}>
      {children}
    </PlaceCacheContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlaceCache = () => {
  const context = useContext(PlaceCacheContext);
  if (!context) {
    throw new Error('usePlaceCache must be used within PlaceCacheProvider');
  }
  return context;
};
