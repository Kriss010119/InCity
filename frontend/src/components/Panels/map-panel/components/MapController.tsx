import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type MapControllerProps = {
  center?: [number, number];
  zoom?: number;
  shouldUpdate: boolean;
};

export const MapController = ({ center, zoom, shouldUpdate }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (shouldUpdate && center && zoom) {
      map.flyTo([center[0], center[1]], zoom, {
        duration: 0.3,
        animate: true,
      });
    }
  }, [map, center, zoom, shouldUpdate]);

  return null;
};