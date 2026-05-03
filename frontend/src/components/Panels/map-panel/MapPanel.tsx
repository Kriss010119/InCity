import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TileLayer } from 'react-leaflet';
import { PlaceDetailsModal } from '../../place-details-modal/PlaceDetailsModal';
import { MapContainer } from './components/MapContainer';
import { MapClickHandler, MapResizeHandler } from './components/MapHandlers';
import { MapMarkers } from './components/MapMarkers';
import { MapHint } from './components/MapHint';
import { LoadingState } from './components/LoadingState';
import { CurvedRouteSegments } from './components/CurvedRouteSegments';
import { TransportStops } from './components/TransportStops';
import { MapController } from './components/MapController';
import {
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from './constants';
import { buildFullRouteSegments, createPlaceFromMarker } from './utils';
import L from 'leaflet';
import styles from './MapPanel.module.css';
import type { MapMarker, MapPanelProps, VisitPoint } from '../../../types';
import { useReverseGeocode } from '../../../hooks';
import { useMapMarkers } from '../../../hooks/useMapMarkers';
import { RouteArrows } from './components/RouteArrows';
import { ZoomHandler } from './components/ZoomHandler';
import { usePlaceCache } from '../../../context/PlaceCacheContext';

export const MapPanel = ({
  destinationLat,
  destinationLng,
  destinationName,
  isHotelTicket,
  routeResponse,
  isLoading,
  isInfoPanelCollapsed = false,
  isSelectingMode = false,
  onDestinationSelect,
  selectedGapId,
  onSelectGap,
}: MapPanelProps) => {
  const [selectedPlace, setSelectedPlace] = useState<VisitPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [mapKey, setMapKey] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [shouldFlyTo, setShouldFlyTo] = useState(false);
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);
  const { reverseGeocode } = useReverseGeocode();
  const { preloadPlace } = usePlaceCache();
  
  const prevCollapsedRef = useRef(isInfoPanelCollapsed);

  useEffect(() => {
    if (!routeResponse?.visitPoints) return;

    routeResponse.visitPoints.forEach(group => {
      preloadPlace(group.mainAttraction);
      group.otherAttractions.forEach(point => preloadPlace(point));
    });
  }, [routeResponse, preloadPlace]);

  const handleClusterClick = useCallback((lat: number, lng: number) => {
    const ZOOM_TO_SHOW_DETAILS = 16;
    setTargetCenter([lat, lng]);
    setTargetZoom(ZOOM_TO_SHOW_DETAILS);
    setShouldFlyTo(true);
    setMapCenter([lat, lng]);
    setMapZoom(ZOOM_TO_SHOW_DETAILS);
    setTimeout(() => setShouldFlyTo(false), 1000);
  }, []);

  const { markers, clearSelectedMarker, handleClusterClick: clusterClickHandler } = useMapMarkers({
    routeResponse,
    isHotelTicket,
    destinationLat,
    destinationLng,
    destinationName,
    currentZoom,
    clusterThreshold: 15,
    onClusterClick: handleClusterClick,
  });

  const visitPoints = useMemo(() => routeResponse?.visitPoints || [], [routeResponse]);

  const routeSegments = useMemo(
    () => buildFullRouteSegments(routeResponse, visitPoints, destinationLat, destinationLng),
    [routeResponse, visitPoints, destinationLat, destinationLng]
  );

  const computedBounds = useMemo(() => {
    if (!selectedGapId || routeSegments.length === 0) {
      return null;
    }
    const segment = routeSegments.find(s => s.gapId === selectedGapId);
    if (segment && segment.points.length > 1) {
      return L.latLngBounds(segment.points.map(p => [p[0], p[1]]));
    }
    return null;
  }, [selectedGapId, routeSegments]);

  useEffect(() => {
    if (destinationLat && destinationLng) {
      clearSelectedMarker();
    }
  }, [destinationLat, destinationLng, clearSelectedMarker]);

  useEffect(() => {
    if (prevCollapsedRef.current !== isInfoPanelCollapsed) {
      prevCollapsedRef.current = isInfoPanelCollapsed;
      
      const rafId = requestAnimationFrame(() => {
        setMapKey((prev) => prev + 1);
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [isInfoPanelCollapsed]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng);
      if (onDestinationSelect) {
        onDestinationSelect(lat, lng, address);
      }
      setTargetCenter([lat, lng]);
      setTargetZoom(16);
      setShouldFlyTo(true);
      setMapCenter([lat, lng]);
      setMapZoom(16);
      setTimeout(() => setShouldFlyTo(false), 2000);
    },
    [reverseGeocode, onDestinationSelect]
  );

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const clusterData = (marker as any).clusterData;
    if (clusterData?.isCluster) {
      clusterClickHandler(marker);
    } else {
      const place = createPlaceFromMarker(marker);
      setSelectedPlace(place);
    }
  }, [clusterClickHandler]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className={styles.wrapper}>
        <MapContainer key={mapKey} center={mapCenter} zoom={mapZoom}>
          <MapController
            center={targetCenter || mapCenter}
            zoom={targetZoom || mapZoom}
            shouldUpdate={shouldFlyTo}
            targetBounds={computedBounds}
          />
          <ZoomHandler onZoomChange={setCurrentZoom} />
          <MapResizeHandler isInfoPanelCollapsed={isInfoPanelCollapsed} />
          <MapClickHandler onMapClick={handleMapClick} isSelectingMode={isSelectingMode} />
          <TileLayer attribution={TILE_LAYER_ATTRIBUTION} url={TILE_LAYER_URL} />
          <CurvedRouteSegments
            segments={routeSegments}
            selectedGapId={selectedGapId}
            onSelectGap={onSelectGap}
          />
          <RouteArrows segments={routeSegments} />
          <TransportStops routeResponse={routeResponse} />
          <MapMarkers markers={markers} onMarkerClick={handleMarkerClick} />
        </MapContainer>
        <MapHint isSelectingMode={isSelectingMode} />
      </div>
      {selectedPlace && (
        <PlaceDetailsModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </>
  );
};