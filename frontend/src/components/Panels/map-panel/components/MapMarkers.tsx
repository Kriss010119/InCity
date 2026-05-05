import { Marker } from 'react-leaflet';
import type { MapMarkersProps, MapMarker } from '../../../../types';
import { MARKER_ICONS } from '../MarkerIcons';
import { MarkerTooltip } from './MarkerTooltip';

export const MapMarkers = ({ markers, onMarkerClick }: MapMarkersProps) => {
  const getMarkerIcon = (marker: MapMarker) => {
    if (marker.type != 'event' && marker.type != 'point') {
      return  MARKER_ICONS.selected;
    }

    const category = marker.category || '';
    const categoryLower = category.toLowerCase();
    
    const eventKeywords = [
      'концерт', 'concert',
      'фестивал', 'festival',
      'выставк', 'exhibition',
      'кино', 'cinema',
      'ярмарк', 'fair',
      'ивент', 'event',
      "детские мероприятия", 'kids',
      'благотворительн', 'charity',
      'business', 'бизнес'
    ];
    
    const isEvent = eventKeywords.some(keyword => categoryLower.includes(keyword));
    
    if (isEvent) {
      return MARKER_ICONS.event;
    }
    
    return MARKER_ICONS.point;
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