import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { MapHandlersProps, MapResizeHandlerProps } from '../types';

export const MapClickHandler = ({ onMapClick, isSelectingMode }: MapHandlersProps) => {
  useMapEvents({
    click: (e) => {
      if (isSelectingMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const MapResizeHandler = ({ isInfoPanelCollapsed }: MapResizeHandlerProps) => {
  const map = useMap();
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [isInfoPanelCollapsed, map]);
  
  return null;
};