import { useState, useCallback, useMemo } from 'react';
import type { MapMarker } from '../components/Panels/map-panel/types';
import type { RouteResponse } from '../types/types';
import { createHotelMarker, createMarkerFromPoint, createSelectedMarker } from '../components/Panels/map-panel/utils';

interface UseMapMarkersProps {
  routeResponse?: RouteResponse | null;
  isHotelTicket?: boolean;
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
}

export const useMapMarkers = ({
  routeResponse,
  isHotelTicket,
  destinationLat,
  destinationLng,
  destinationName
}: UseMapMarkersProps) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const routeMarkers = useMemo(() => {
    if (!routeResponse?.visitPoints) return [];
    return routeResponse.visitPoints.map(createMarkerFromPoint);
  }, [routeResponse]);

  const hotelMarker = useMemo(() => {
    if (!isHotelTicket || !destinationLat || !destinationLng || !destinationName) return null;
    return createHotelMarker(destinationLat, destinationLng, destinationName);
  }, [isHotelTicket, destinationLat, destinationLng, destinationName]);

  const markers = useMemo(() => {
    const allMarkers: MapMarker[] = [...routeMarkers];
    if (hotelMarker) {
      allMarkers.push(hotelMarker);
    }
    if (selectedMarker) {
      allMarkers.push(selectedMarker);
    }
    return allMarkers;
  }, [routeMarkers, hotelMarker, selectedMarker]);

  const addSelectedMarker = useCallback(async (lat: number, lng: number, address: string) => {
    const newMarker = createSelectedMarker(lat, lng, address);
    setSelectedMarker(newMarker);
  }, []);

  const clearSelectedMarker = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  return {
    markers,
    selectedMarker,
    addSelectedMarker,
    clearSelectedMarker
  };
};