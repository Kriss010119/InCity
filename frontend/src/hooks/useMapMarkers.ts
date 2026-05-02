import { useState, useCallback, useMemo } from 'react';
import type { MapMarker, RouteResponse, VisitPoint } from '../types';
import { createHotelMarker, createMarkerFromPoint, createSelectedMarker } from '../components/Panels/map-panel/utils';

interface UseMapMarkersProps {
  routeResponse?: RouteResponse | null;
  isHotelTicket?: boolean;
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  currentZoom?: number;
  clusterThreshold?: number;
  onClusterClick?: (lat: number, lng: number, groupIndex: number, groupName: string) => void;
}

const getAllPointsWithGroup = (response?: RouteResponse | null): { point: VisitPoint; groupIndex: number }[] => {
  if (!response?.visitPoints) return [];
  const points: { point: VisitPoint; groupIndex: number }[] = [];
  response.visitPoints.forEach((group, idx) => {
    points.push({ point: group.mainAttraction, groupIndex: idx });
    group.otherAttractions.forEach((other) => {
      points.push({ point: other, groupIndex: idx });
    });
  });
  return points;
};

export const useMapMarkers = ({
  routeResponse,
  isHotelTicket,
  destinationLat,
  destinationLng,
  destinationName,
  currentZoom = 12,
  clusterThreshold = 13,
  onClusterClick,
}: UseMapMarkersProps) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const clusterMarkers = useMemo(() => {
    if (!routeResponse?.visitPoints) return [];

    const shouldCluster = currentZoom < clusterThreshold;
    if (!shouldCluster) return [];

    const clusters: MapMarker[] = [];

    routeResponse.visitPoints.forEach((group, groupIndex) => {
      const mainPoint = group.mainAttraction;
      const totalPoints = 1 + group.otherAttractions.length;

      const marker = createMarkerFromPoint(mainPoint);
      marker.title = `${mainPoint.name}`;
      marker.category = `Кластер (${totalPoints} мест)`;
      marker.type = 'point';
      
      (marker as any).clusterData = {
        isCluster: true,
        groupIndex,
        totalPoints,
        points: [mainPoint, ...group.otherAttractions],
        centerLat: mainPoint.latitude,
        centerLng: mainPoint.longitude,
        centerName: mainPoint.name,
      };
      
      clusters.push(marker);
    });

    return clusters;
  }, [routeResponse, currentZoom, clusterThreshold]);

  const detailedMarkers = useMemo(() => {
    if (!routeResponse?.visitPoints) return [];

    const shouldShowDetailed = currentZoom >= clusterThreshold;
    if (!shouldShowDetailed) return [];

    const pointsWithGroup = getAllPointsWithGroup(routeResponse);
    return pointsWithGroup.map(({ point }) => createMarkerFromPoint(point));
  }, [routeResponse, currentZoom, clusterThreshold]);

  const routeMarkers = useMemo(() => {
    if (currentZoom < clusterThreshold) {
      return clusterMarkers;
    }
    return detailedMarkers;
  }, [currentZoom, clusterThreshold, clusterMarkers, detailedMarkers]);

  const hotelMarker = useMemo(() => {
    if (!isHotelTicket || !destinationLat || !destinationLng || !destinationName) {
      return null;
    }
    return createHotelMarker(destinationLat, destinationLng, destinationName);
  }, [isHotelTicket, destinationLat, destinationLng, destinationName]);

  const destinationMarker = useMemo(() => {
    if (destinationLat && destinationLng && destinationName) {
      return createSelectedMarker(destinationLat, destinationLng, destinationName);
    }
    return null;
  }, [destinationLat, destinationLng, destinationName]);

  const markers = useMemo(() => {
    const allMarkers: MapMarker[] = [...routeMarkers];
    if (hotelMarker) allMarkers.push(hotelMarker);
    if (selectedMarker) allMarkers.push(selectedMarker);
    if (destinationMarker) allMarkers.push(destinationMarker);
    return allMarkers;
  }, [routeMarkers, hotelMarker, selectedMarker, destinationMarker]);

  const addSelectedMarker = useCallback(async (lat: number, lng: number, address: string) => {
    const newMarker = createSelectedMarker(lat, lng, address);
    setSelectedMarker(newMarker);
  }, []);

  const clearSelectedMarker = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleClusterClick = useCallback((marker: MapMarker) => {
    const clusterData = (marker as any).clusterData;
    if (clusterData?.isCluster && onClusterClick) {
      onClusterClick(
        clusterData.centerLat, 
        clusterData.centerLng, 
        clusterData.groupIndex,
        clusterData.centerName
      );
    }
  }, [onClusterClick]);

  return {
    markers,
    selectedMarker,
    addSelectedMarker,
    clearSelectedMarker,
    handleClusterClick,
  };
};