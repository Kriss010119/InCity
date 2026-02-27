import { useState, useEffect, useMemo, useCallback } from 'react';
import { TileLayer } from 'react-leaflet';
import { PlaceDetailsModal } from '../../place-details-modal/PlaceDetailsModal';
import { MapContainer } from './components/MapContainer';
import { MapClickHandler, MapResizeHandler } from './components/MapHandlers';
import { MapMarkers } from './components/MapMarkers';
import { RoutePolyline } from './components/RoutePolyline';
import { MapHint } from './components/MapHint';
import { LoadingState } from './components/LoadingState';
import { TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from './constants';
import { extractRoutePoints, createPlaceFromMarker } from './utils';
import type { MapPanelProps, MapMarker } from './types';
import styles from './MapPanel.module.css';
import type { VisitPoint } from '../../../types/types';
import { useReverseGeocode } from '../../../hooks';
import { useMapMarkers } from '../../../hooks/useMapMarkers';

export const MapPanel = ({ 
  destinationLat, 
  destinationLng, 
  destinationName,
  isHotelTicket,
  routeResponse,
  isLoading,
  isInfoPanelCollapsed = false,
  isSelectingMode = false,
  onDestinationSelect 
}: MapPanelProps) => {
  const [selectedPlace, setSelectedPlace] = useState<VisitPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [mapKey, setMapKey] = useState(0);
  
  const { reverseGeocode } = useReverseGeocode();
  const { markers, addSelectedMarker } = useMapMarkers({
    routeResponse,
    isHotelTicket,
    destinationLat,
    destinationLng,
    destinationName
  });

  const routePoints = useMemo(() => extractRoutePoints(routeResponse), [routeResponse]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMapKey(prev => prev + 1);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [isInfoPanelCollapsed]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    await addSelectedMarker(lat, lng, address);
    
    if (onDestinationSelect) {
      onDestinationSelect(lat, lng, address);
    }
    
    setMapCenter([lat, lng]);
    setMapZoom(16);
  }, [reverseGeocode, addSelectedMarker, onDestinationSelect]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const place = createPlaceFromMarker(marker);
    setSelectedPlace(place);
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className={styles.wrapper}>
        <MapContainer key={mapKey} center={mapCenter} zoom={mapZoom}>
          <MapResizeHandler isInfoPanelCollapsed={isInfoPanelCollapsed} />
          <MapClickHandler onMapClick={handleMapClick} isSelectingMode={isSelectingMode} />
          
          <TileLayer
            attribution={TILE_LAYER_ATTRIBUTION}
            url={TILE_LAYER_URL}
          />

          <RoutePolyline points={routePoints} />
          <MapMarkers markers={markers} onMarkerClick={handleMarkerClick} />
        </MapContainer>

        <MapHint isSelectingMode={isSelectingMode} />
      </div>

      {selectedPlace && (
        <PlaceDetailsModal 
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </>
  );
};