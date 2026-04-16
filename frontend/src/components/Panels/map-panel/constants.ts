import type { TransportType } from './types';
export const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
export const DEFAULT_ZOOM = 12;
export const SELECTED_ZOOM = 16;
export const HOTEL_ZOOM = 15;
export const ROUTE_ZOOM = 13;
export const TRANSPORT_COLORS: Record<TransportType, string> = {
  walk: '#b8b8b8ff', 
  bus: '#ff9f4a',  
  tram: '#6fbf4c',   
  trolleybus: '#bf5151ff', 
  metro: '#8e44ad' 
};

export const getPolylineOptions = (type: TransportType) => ({
  color: TRANSPORT_COLORS[type],
  weight: 2,
  opacity: 0.9,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  dashArray: type !== 'walk' ? undefined : '8, 6', 
});

export const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';