import { useState, useCallback, useMemo } from 'react';
import type { MapMarker } from '../components/Panels/map-panel/types';
import type { RouteResponse, VisitPoint } from '../types/types';
import { createHotelMarker, createMarkerFromPoint, createSelectedMarker } from '../components/Panels/map-panel/utils';

interface UseMapMarkersProps {
  routeResponse?: RouteResponse | null;
  isHotelTicket?: boolean;
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
}

const flattenVisitPoints = (response?: RouteResponse | null): VisitPoint[] => {
  if (!response?.visitPoints) return [];
  const flat: VisitPoint[] = [];
  for (const group of response.visitPoints) {
    flat.push(group.mainAttraction);
    flat.push(...group.otherAttractions);
  }
  return flat;
};

export const useMapMarkers = ({
  routeResponse,
  isHotelTicket,
  destinationLat,
  destinationLng,
  destinationName
}: UseMapMarkersProps) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const routeMarkers = useMemo(() => {
    const flatPoints = flattenVisitPoints(routeResponse);
    return flatPoints.map(createMarkerFromPoint);
  }, [routeResponse]);

  const hotelMarker = useMemo(() => {
    if (!isHotelTicket || !destinationLat || !destinationLng || !destinationName) return null;
    return createHotelMarker(destinationLat, destinationLng, destinationName);
  }, [isHotelTicket, destinationLat, destinationLng, destinationName]);

  const markers = useMemo(() => {
    const allMarkers: MapMarker[] = [...routeMarkers];
    if (hotelMarker) allMarkers.push(hotelMarker);
    if (selectedMarker) allMarkers.push(selectedMarker);
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