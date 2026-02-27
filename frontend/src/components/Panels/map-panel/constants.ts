export const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
export const DEFAULT_ZOOM = 12;
export const SELECTED_ZOOM = 16;
export const HOTEL_ZOOM = 15;
export const ROUTE_ZOOM = 13;

export const POLYLINE_STYLES = {
  color: '#ffdd2d',
  weight: 4,
  opacity: 0.8,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  dashArray: '10, 10'
};

export const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';