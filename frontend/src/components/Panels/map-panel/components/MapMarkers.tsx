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
      'концерты', 'concert',
      'фестивали', 'festival',
      'выставки', 'exhibition',
      'кинопоказы', 'cinema',
      'ярмарки', 'fair',
      'ивенты', 'event',
      "детские мероприятия", 'kids',
      'благотворительные акции', 'charity',
      'business', 'бизнес ивенты'
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