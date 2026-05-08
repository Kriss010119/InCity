import type { PlaceDetails, VisitPoint } from '..';

export type CachedPlaceData = {
  details: PlaceDetails;
  timestamp: number;
  images?: string[];
};

export type PlaceCacheContextType = {
  getCachedData: (placeId: number) => CachedPlaceData | undefined;
  setCachedData: (placeId: number, data: PlaceDetails, images?: string[]) => void;
  clearCache: () => void;
  preloadPlace: (place: VisitPoint) => Promise<void>;
};
