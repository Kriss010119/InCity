import type { RouteResponse, VisitPointGroup } from '../../../types/types';
import type { MapMarker, RouteSegment, TransportType } from './types';

type LatLng = { lat: number; lng: number };

export const extractTagValue = (tags: string[], key: string): string => {
  return tags.find(tag => tag.startsWith(key))?.split('=')[1] || '';
};

export const createMarkerFromPoint = (point: any): MapMarker => ({
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

export const createHotelMarker = (lat: number, lng: number, name: string): MapMarker => ({
  id: 'hotel-destination',
  lat,
  lng,
  title: name,
  type: 'end',
  category: 'Отель',
  address: name,
});

export const createSelectedMarker = (lat: number, lng: number, address: string): MapMarker => ({
  id: 'user-selected-destination',
  lat,
  lng,
  title: address,
  type: 'selected',
  category: 'Выбранная точка',
  address,
});

export const createPlaceFromMarker = (marker: MapMarker): any => {
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
    ].filter(tag => tag !== ''),
  };
};


export const getCurvedPath = (
  start: [number, number],
  end: [number, number],
  curvature: number = 0.4,
  numPoints: number = 20
): [number, number][] => {
  const points: [number, number][] = [];

  const lat1 = start[0];
  const lon1 = start[1];
  const lat2 = end[0];
  const lon2 = end[1];

  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return [start, end];

  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = lon1 + dx * t;
    const y = lat1 + dy * t;

    const offset = curvature * distance * 4 * t * (1 - t);
    const curvedX = x + nx * offset;
    const curvedY = y + ny * offset;

    points.push([curvedY, curvedX]);
  }

  return points;
};


export const buildFullRouteSegments = (
  routeResponse: RouteResponse | null | undefined,
  visitPoints: VisitPointGroup[],
  startLat?: number,
  startLng?: number
): RouteSegment[] => {
  if (!routeResponse || !startLat || !startLng || !visitPoints.length) {
    return [];
  }

  const sections = routeResponse.sections;
  const segments: RouteSegment[] = [];
  const startPoint: LatLng = { lat: startLat, lng: startLng };
  let curPos: LatLng = { ...startPoint };

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const isLastSection = i === sections.length - 1;
    const places = !isLastSection ? visitPoints[i] : null;
    const point: LatLng = places
      ? { lat: places.mainAttraction.latitude, lng: places.mainAttraction.longitude }
      : startPoint;

    // main point -> section
    let sectionStart: LatLng;
    if (section.gaps && section.gaps.length > 0) {
      sectionStart = {
        lat: section.gaps[0].startNode.latitude,
        lng: section.gaps[0].startNode.longitude,
      };
    } else {
      sectionStart = point;
    }
    const walkX = curPos.lng - sectionStart.lng;
    const walkY = curPos.lat - sectionStart.lat;
    const walkD = Math.sqrt(walkX * walkX + walkY * walkY);
    if (walkD > 0.0001) {
      segments.push({
        id: `walk-to-section-${i}`,
        type: 'walk',
        points: [
          [curPos.lat, curPos.lng],
          [sectionStart.lat, sectionStart.lng],
        ],
      });
    }
    curPos = sectionStart;

    // transport segment
    if (section.gaps && section.gaps.length > 0) {
      for (let j = 0; j < section.gaps.length; j++) {
        const gap = section.gaps[j];
        const gapPoints: LatLng[] = [
          { lat: gap.startNode.latitude, lng: gap.startNode.longitude },
          ...gap.nodesVisited.map((node) => ({ lat: node.latitude, lng: node.longitude })),
          { lat: gap.endNode.latitude, lng: gap.endNode.longitude },
        ];
        segments.push({
          id: `transport-${i}-gap-${j}`,
          type: gap.transport as TransportType,
          routeNumber: gap.routeNumber,
          points: gapPoints.map(p => [p.lat, p.lng] as [number, number]),
          estimatedTime: section.estimatedTimeInMinutes,
          intermediateStops: gap.nodesVisited.map((n) => n.name),
        });
        curPos = gapPoints[gapPoints.length - 1];
        
        if (j < section.gaps.length - 1) {
          const nextGap = section.gaps[j + 1];
          const nextSt: LatLng = {
            lat: nextGap.startNode.latitude,
            lng: nextGap.startNode.longitude,
          };
          const dx = curPos.lng - nextSt.lng;
          const dy = curPos.lat - nextSt.lat;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.0001) {
            segments.push({
              id: `walk-transfer-${i}-${j}`,
              type: 'walk',
              points: [
                [curPos.lat, curPos.lng],
                [nextSt.lat, nextSt.lng],
              ],
            });
          }
          curPos = nextSt;
        }
      }

      if (places) {
          const mainPoint: LatLng = {
            lat: places.mainAttraction.latitude,
            lng: places.mainAttraction.longitude,
          };
          const dx = curPos.lng - mainPoint.lng;
          const dy = curPos.lat - mainPoint.lat;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.0001) {
            segments.push({
              id: `walk-transport-to-cluster-${i}`,
              type: 'walk',
              points: [
                [curPos.lat, curPos.lng],
                [mainPoint.lat, mainPoint.lng],
              ],
            });
          }
          curPos = mainPoint;
        }
    } else {
      if (i === 0) {
        const dx = curPos.lng - point.lng;
        const dy = curPos.lat - point.lat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.0001) {
          segments.push({
            id: `walk-section-${i}`,
            type: 'walk',
            points: [
              [curPos.lat, curPos.lng],
              [point.lat, point.lng],
            ],
            estimatedTime: section.estimatedTimeInMinutes,
          });
        }
      }
      curPos = point;
    }

    // places in one cluster
    if (places) {
      const attractions = [places.mainAttraction, ...(places.otherAttractions || [])];
      for (let u = 0; u < attractions.length - 1; u++) {
        const from = attractions[u];
        const to = attractions[u + 1];
        segments.push({
          id: `walk-cluster-${i}-${u}`,
          type: 'walk',
          points: [
            [from.latitude, from.longitude],
            [to.latitude, to.longitude],
          ],
        });
      }
      const lastAttr = attractions[attractions.length - 1];
      curPos = { lat: lastAttr.latitude, lng: lastAttr.longitude };
    }
  }

  // to main point
  const dx = curPos.lng - startPoint.lng;
  const dy = curPos.lat - startPoint.lat;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0.0001) {
    segments.push({
      id: 'walk-final-return',
      type: 'walk',
      points: [
        [curPos.lat, curPos.lng],
        [startPoint.lat, startPoint.lng],
      ],
    });
  }
  return segments;
};

export const getSegmentCurvedPoints = (segment: RouteSegment): [number, number][] => {
  const validPoints = segment.points.filter(
    (p): p is [number, number] => 
      p && p.length === 2 && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1])
  );

  if (validPoints.length < 2) {
    return [];
  }

  if (segment.type === 'walk') {
    return validPoints;
  }

  const curvedPoints: [number, number][] = [];

  for (let i = 0; i < validPoints.length - 1; i++) {
    const from = validPoints[i];
    const to = validPoints[i + 1];
    const curve = getCurvedPath(from, to, 0.3, 15);
    curvedPoints.push(...curve);
  }
  
  return curvedPoints;
};