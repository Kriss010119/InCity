import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type L from 'leaflet';

type MapControllerProps = {
  center?: [number, number];
  zoom?: number;
  shouldUpdate: boolean;
  targetBounds?: L.LatLngBoundsExpression | null;
};

export const MapController = ({ center, zoom, shouldUpdate, targetBounds }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (shouldUpdate && center && zoom) {
      map.flyTo([center[0], center[1]], zoom, {
        duration: 0.3,
        animate: true,
      });
    }
  }, [map, center, zoom, shouldUpdate]);

  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, targetBounds]);

  return null;
};
