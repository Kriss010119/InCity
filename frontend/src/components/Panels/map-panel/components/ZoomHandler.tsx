import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type ZoomHandlerProps = {
  onZoomChange: (zoom: number) => void;
};

export const ZoomHandler = ({ onZoomChange }: ZoomHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    map.on('zoomend', handleZoom);
    handleZoom();
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
};
