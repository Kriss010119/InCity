import type { RouteResponse, VisitPointGroup, WalkingSegment, TransportType, VisitPoint } from '../../../types';
import type { MapMarker, RouteSegment } from '../../../types';

type LatLng = { lat: number; lng: number };

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
  let lastLocationName = 'Начало маршрута';

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const places = visitPoints[i] || null;

    const point: LatLng = places
      ? { lat: places.mainAttraction.latitude, lng: places.mainAttraction.longitude }
      : startPoint;

    // пешком к началу секции
    if (i < sections.length - 1 || (i === sections.length - 1 && section.gaps && section.gaps.length > 0)) {
      let sectionStart: LatLng;
      let sectionStartName = 'Остановка';
      if (section.gaps && section.gaps.length > 0) {
        sectionStart = {
          lat: section.gaps[0].startNode.latitude,
          lng: section.gaps[0].startNode.longitude,
        };
        sectionStartName = section.gaps[0].startNode.name;
      } else if (places) {
        sectionStart = point;
        sectionStartName = places.mainAttraction.name;
      } else {
        continue;
      }

      const walkD = Math.hypot(curPos.lat - sectionStart.lat, curPos.lng - sectionStart.lng);
      if (walkD > 0.0001) {
        segments.push({
          id: `walk-to-section-${i}`,
          type: 'walk',
          points: [[curPos.lat, curPos.lng], [sectionStart.lat, sectionStart.lng]],
          gapId: `walk-to-section-${i}`,
          startName: lastLocationName,
          endName: sectionStartName,
        });
      }
      curPos = sectionStart;
      lastLocationName = sectionStartName;
    }

    // транспортные сегменты
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
          gapId: `${i}-${j}`,
        });
        curPos = gapPoints[gapPoints.length - 1];
        lastLocationName = gap.endNode.name;

        // пеший переход между gap-ами
        if (j < section.gaps.length - 1) {
          const nextGap = section.gaps[j + 1];
          const nextSt: LatLng = {
            lat: nextGap.startNode.latitude,
            lng: nextGap.startNode.longitude,
          };
          const dist = Math.hypot(curPos.lat - nextSt.lat, curPos.lng - nextSt.lng);
          if (dist > 0.0001) {
            segments.push({
              id: `walk-transfer-${i}-${j}`,
              type: 'walk',
              points: [[curPos.lat, curPos.lng], [nextSt.lat, nextSt.lng]],
              gapId: `walk-transfer-${i}-${j}`,
              startName: gap.endNode.name,
              endName: nextGap.startNode.name,
            });
          }
          curPos = nextSt;
          lastLocationName = nextGap.startNode.name;
        }
      }

      // пешком от конечной остановки к кластеру
      if (places) {
        const mainPoint: LatLng = {
          lat: places.mainAttraction.latitude,
          lng: places.mainAttraction.longitude,
        };
        const dist = Math.hypot(curPos.lat - mainPoint.lat, curPos.lng - mainPoint.lng);
        if (dist > 0.0001) {
          segments.push({
            id: `walk-transport-to-cluster-${i}`,
            type: 'walk',
            points: [[curPos.lat, curPos.lng], [mainPoint.lat, mainPoint.lng]],
            gapId: `walk-transport-to-cluster-${i}`,
            startName: lastLocationName,
            endName: places.mainAttraction.name,
          });
        }
        curPos = mainPoint;
        lastLocationName = places.mainAttraction.name;
      }
    } else {
      // секция без транспорта (пешая)
      if (places) {
        const dist = Math.hypot(curPos.lat - point.lat, curPos.lng - point.lng);
        if (dist > 0.0001) {
          segments.push({
            id: `walk-section-${i}`,
            type: 'walk',
            points: [[curPos.lat, curPos.lng], [point.lat, point.lng]],
            estimatedTime: section.estimatedTimeInMinutes,
            gapId: `walk-section-${i}`,
            startName: lastLocationName,
            endName: places.mainAttraction.name,
          });
        }
        curPos = point;
        lastLocationName = places.mainAttraction.name;
      }
    }

    // пешком внутри кластера
    if (places) {
      const attractions = [places.mainAttraction, ...(places.otherAttractions || [])];
      for (let u = 0; u < attractions.length - 1; u++) {
        const from = attractions[u];
        const to = attractions[u + 1];
        segments.push({
          id: `walk-cluster-${i}-${u}`,
          type: 'walk',
          points: [[from.latitude, from.longitude], [to.latitude, to.longitude]],
          gapId: `walk-cluster-${i}-${u}`,
          startName: from.name,
          endName: to.name,
        });
      }
      const lastAttr = attractions[attractions.length - 1];
      curPos = { lat: lastAttr.latitude, lng: lastAttr.longitude };
      lastLocationName = lastAttr.name;
    }
  }

  // возврат к старту
  segments.push({
    id: 'walk-final-return',
    type: 'walk',
    points: [[curPos.lat, curPos.lng], [startPoint.lat, startPoint.lng]],
    gapId: 'walk-final-return',
    startName: lastLocationName,
    endName: 'Начало маршрута',
  });

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

export const extractWalkingSegmentsFromRouteSegments = (
  segments: RouteSegment[]
): WalkingSegment[] => {
  return segments
    .filter(seg => seg.type === 'walk' && seg.gapId)
    .map(seg => {
      const startPoint = seg.points[0];
      const endPoint = seg.points[seg.points.length - 1];
      const distance = Math.hypot(startPoint[0] - endPoint[0], startPoint[1] - endPoint[1]);
      const estimatedTime = Math.round(distance * 111000 / 80);
      return {
        id: seg.gapId!,
        sectionIndex: extractSectionIndexFromGapId(seg.gapId!),
        startPoint: {
          name: seg.startName || 'Точка',
          lat: startPoint[0],
          lng: startPoint[1],
        },
        endPoint: {
          name: seg.endName || 'Точка',
          lat: endPoint[0],
          lng: endPoint[1],
        },
        estimatedTime,
      };
    });
};

export const extractWalkingSegmentsForInfoPanel = (
  routeResponse: RouteResponse | null | undefined,
  startLat?: number,
  startLng?: number
): WalkingSegment[] => {
  if (!routeResponse || !startLat || !startLng) {
    return [];
  }
  const segments = buildFullRouteSegments(routeResponse, routeResponse.visitPoints, startLat, startLng);
  return extractWalkingSegmentsFromRouteSegments(segments);
};

const extractSectionIndexFromGapId = (gapId: string): number => {
  const sectionMatch = gapId.match(/^section-(\d+)$/);
  if (sectionMatch) {
    return parseInt(sectionMatch[1], 10);
  }
  
  if (gapId === 'walk-final-return') {
    return -1;
  }
  
  const match = gapId.match(/walk-to-section-(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  const matchCluster = gapId.match(/walk-cluster-(\d+)-/);
  if (matchCluster) {
    return parseInt(matchCluster[1], 10);
  }
  
  const matchTransfer = gapId.match(/walk-transfer-(\d+)-/);
  if (matchTransfer) {
    return parseInt(matchTransfer[1], 10);
  }
  
  const matchTransport = gapId.match(/walk-transport-to-cluster-(\d+)/);
  if (matchTransport) {
    return parseInt(matchTransport[1], 10);
  }
  
  const matchWalkSection = gapId.match(/walk-section-(\d+)/);
  if (matchWalkSection) {
    return parseInt(matchWalkSection[1], 10);
  }
  
  const gapMatch = gapId.match(/^(\d+)-(\d+)$/);
  if (gapMatch) {
    return parseInt(gapMatch[1], 10);
  }
  
  return -1;
};