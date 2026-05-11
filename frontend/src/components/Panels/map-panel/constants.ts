import type { TransportType } from '../../../types';
import {
  TRANSPORT_COLORS as BASE_TRANSPORT_COLORS,
  getTransportColor,
} from '../../../constants/transportConstants';

export const TRANSPORT_COLORS = BASE_TRANSPORT_COLORS;

export const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
export const DEFAULT_ZOOM = 12;
export const SELECTED_ZOOM = 16;
export const HOTEL_ZOOM = 15;
export const ROUTE_ZOOM = 13;

export const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const getSegmentColor = (
  type: TransportType,
  routeNumber?: string,
  stationName?: string,
  stopLat?: number,
  stopLng?: number,
): string => {
  if (type === 'metro' && routeNumber) {
    return getTransportColor(type, routeNumber, stationName, { lat: stopLat, lng: stopLng });
  }
  return TRANSPORT_COLORS[type] || '#888888';
};

export const getPolylineOptions = (
  type: TransportType,
  isSelected = false,
  routeNumber?: string,
  stationName?: string,
  stopLat?: number,
  stopLng?: number,
) => {
  const color = getSegmentColor(type, routeNumber, stationName, stopLat, stopLng);

  const baseOptions = {
    color,
    weight: isSelected ? 6 : 3,
    opacity: isSelected ? 1 : 0.7,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };

  if (type === 'bus' || type === 'tram' || type === 'trolleybus') {
    return {
      ...baseOptions,
      weight: isSelected ? 7 : 4,
      dashArray: isSelected ? '8, 4' : '6, 3',
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    };
  }

  return baseOptions;
};

export const getActivePolylineOptions = (
  type: TransportType,
  routeNumber?: string,
  stationName?: string,
  stopLat?: number,
  stopLng?: number,
) => {
  const color = getSegmentColor(type, routeNumber, stationName, stopLat, stopLng);

  return {
    color,
    weight: 4,
    opacity: 1,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    stroke: true,
  };
};

export const getSecondaryPolylineOptions = (type: TransportType, isSelected = false) => {
  if (type !== 'bus' && type !== 'tram' && type !== 'trolleybus') {
    return null;
  }

  return {
    color: '#ffffff',
    weight: isSelected ? 4 : 2,
    opacity: 0.9,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };
};
