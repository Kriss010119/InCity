import type { RouteResponse, VisitPoint } from '../../../types/types';
import type { MapMarker } from './types';

export const extractTagValue = (tags: string[], key: string): string => {
  return tags.find(tag => tag.startsWith(key))?.split('=')[1] || '';
};

export const createMarkerFromPoint = (point: VisitPoint): MapMarker => ({
  id: point.id.toString(),
  lat: point.latitude,
  lng: point.longitude,
  title: point.name,
  type: 'point',
  category: point.category,
  estimatedTime: point.estimatedVisitMinutes,
  placeData: point,
  address: extractTagValue(point.tags, 'addr:street') || extractTagValue(point.tags, 'addr:full'),
  phone: extractTagValue(point.tags, 'phone') || extractTagValue(point.tags, 'contact:phone'),
  website: extractTagValue(point.tags, 'website') || extractTagValue(point.tags, 'contact:website'),
  schedule: extractTagValue(point.tags, 'opening_hours'),
});

export const createHotelMarker = (
  lat: number, 
  lng: number, 
  name: string
): MapMarker => ({
  id: 'hotel-destination',
  lat,
  lng,
  title: name,
  type: 'end',
  category: 'Отель',
  address: name,
});

export const createSelectedMarker = (
  lat: number, 
  lng: number, 
  address: string
): MapMarker => ({
  id: 'user-selected-destination',
  lat,
  lng,
  title: address,
  type: 'selected',
  category: 'Выбранная точка',
  address,
});

export const createPlaceFromMarker = (marker: MapMarker): VisitPoint => {
  if (marker.placeData) return marker.placeData;
  
  return {
    id: marker.type === 'selected' ? -Date.now() : parseInt(marker.id) || 0,
    name: marker.title,
    latitude: marker.lat,
    longitude: marker.lng,
    category: marker.category || 'Пользовательская точка',
    subcategory: marker.type === 'end' ? 'Отель' : 'Выбрано на карте',
    square: 0,
    estimatedVisitMinutes: marker.estimatedTime || 30,
    osmType: 'node',
    tags: [
      `name=${marker.title}`,
      marker.address ? `addr:full=${marker.address}` : '',
      marker.phone ? `phone=${marker.phone}` : '',
      marker.website ? `website=${marker.website}` : '',
    ].filter(tag => tag !== '')
  };
};

export const extractRoutePoints = (routeResponse?: RouteResponse | null): [number, number][] => {
  if (!routeResponse?.sections) return [];
  
  const points: [number, number][] = [];
  
  routeResponse.sections.forEach(section => {
    section.gaps.forEach(gap => {
      points.push([gap.startNode.latitude, gap.startNode.longitude]);
      
      gap.nodesVisited.forEach(node => {
        points.push([node.latitude, node.longitude]);
      });
      
      points.push([gap.endNode.latitude, gap.endNode.longitude]);
    });
  });
  
  return points;
};