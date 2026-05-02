import type { TransportType } from '../../../types';
import { TRANSPORT_COLORS as BASE_TRANSPORT_COLORS } from '../../../constants/transportConstants';

export const TRANSPORT_COLORS = BASE_TRANSPORT_COLORS;
export const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
export const DEFAULT_ZOOM = 12;
export const SELECTED_ZOOM = 16;
export const HOTEL_ZOOM = 15;
export const ROUTE_ZOOM = 13;

export const getPolylineOptions = (type: TransportType, isSelected = false) => ({
  color: TRANSPORT_COLORS[type] || '#888',
  weight: isSelected ? 6 : 2,
  opacity: isSelected ? 1 : 0.5,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  dashArray: type !== 'walk' ? undefined : '8, 6',
});

export const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';