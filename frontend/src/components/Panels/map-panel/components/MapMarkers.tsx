import { Marker } from 'react-leaflet';
import type { MapMarkersProps, MapMarker } from '../../../../types';
import { MARKER_ICONS } from '../MarkerIcons';
import { MarkerTooltip } from './MarkerTooltip';

export const MapMarkers = ({ markers, onMarkerClick }: MapMarkersProps) => {
  const getMarkerIcon = (marker: MapMarker) => {
    switch(marker.type) {
      case 'start': return MARKER_ICONS.start;
      case 'end': return MARKER_ICONS.end;
      case 'selected': return MARKER_ICONS.selected;
      default: return MARKER_ICONS.point;
    }
  };

  return (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={getMarkerIcon(marker)}
          eventHandlers={{ click: () => onMarkerClick(marker) }}
        >
          <MarkerTooltip marker={marker} />
        </Marker>
      ))}
    </>
  );
};