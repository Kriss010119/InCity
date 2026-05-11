// src/components/Panels/map-panel/tests/utils.test.ts
import {
  createMarkerFromPoint,
  createHotelMarker,
  createSelectedMarker,
  createPlaceFromMarker,
  getCurvedPath,
  buildFullRouteSegments,
  getSegmentCurvedPoints,
  extractWalkingSegmentsFromRouteSegments,
  extractWalkingSegmentsForInfoPanel,
  extractSectionIndexFromGapId,
} from '../utils';
import type { RouteResponse, VisitPoint, MapMarker, RouteSegment } from '../../../types';

describe('MapPanel utils', () => {
  describe('createMarkerFromPoint', () => {
    test('создаёт маркер из точки интереса', () => {
      const point: VisitPoint = {
        id: 1,
        name: 'Красная площадь',
        latitude: 55.7537,
        longitude: 37.6199,
        category: 'Достопримечательность',
        subcategory: 'Площадь',
        square: null,
        estimatedVisitMinutes: 60,
        osmType: 'node',
        tags: [
          'addr:street=Красная площадь',
          'phone=+7 495 123-45-67',
          'website=example.com',
          'opening_hours=09:00-18:00',
        ],
      };
      const marker = createMarkerFromPoint(point);
      expect(marker.id).toBe('1');
      expect(marker.lat).toBe(55.7537);
      expect(marker.lng).toBe(37.6199);
      expect(marker.title).toBe('Красная площадь');
      expect(marker.type).toBe('point');
      expect(marker.category).toBe('Достопримечательность');
      expect(marker.estimatedTime).toBe(60);
      expect(marker.placeData).toBe(point);
      expect(marker.address).toBe('Красная площадь');
      expect(marker.phone).toBe('+7 495 123-45-67');
      expect(marker.website).toBe('example.com');
      expect(marker.schedule).toBe('09:00-18:00');
    });
  });

  describe('createHotelMarker', () => {
    test('создаёт маркер отеля', () => {
      const marker = createHotelMarker(55.7558, 37.6173, 'Lotte Hotel');
      expect(marker.id).toBe('hotel-destination');
      expect(marker.lat).toBe(55.7558);
      expect(marker.lng).toBe(37.6173);
      expect(marker.title).toBe('Lotte Hotel');
      expect(marker.type).toBe('end');
      expect(marker.category).toBe('Отель');
      expect(marker.address).toBe('Lotte Hotel');
    });
  });

  describe('createSelectedMarker', () => {
    test('создаёт маркер выбранной точки', () => {
      const marker = createSelectedMarker(55.7558, 37.6173, 'Москва, Красная площадь');
      expect(marker.id).toBe('user-selected-destination');
      expect(marker.lat).toBe(55.7558);
      expect(marker.lng).toBe(37.6173);
      expect(marker.title).toBe('Москва, Красная площадь');
      expect(marker.type).toBe('selected');
      expect(marker.category).toBe('Выбранная точка');
      expect(marker.address).toBe('Москва, Красная площадь');
    });
  });

  describe('createPlaceFromMarker', () => {
    test('возвращает placeData если он есть', () => {
      const originalPoint: VisitPoint = {
        id: 99,
        name: 'Original',
        latitude: 10,
        longitude: 20,
        category: 'Test',
        subcategory: 'Sub',
        square: null,
        estimatedVisitMinutes: 30,
        osmType: 'node',
        tags: [],
      };
      const marker: MapMarker = {
        id: '99',
        lat: 10,
        lng: 20,
        title: 'Original',
        type: 'point',
        placeData: originalPoint,
      };
      const result = createPlaceFromMarker(marker);
      expect(result).toBe(originalPoint);
    });

    test('создаёт новую точку из маркера типа selected', () => {
      const marker = createSelectedMarker(55.7558, 37.6173, 'Selected point');
      const place = createPlaceFromMarker(marker);
      expect(place.id).toBeLessThan(0);
      expect(place.name).toBe('Selected point');
      expect(place.latitude).toBe(55.7558);
      expect(place.longitude).toBe(37.6173);
      expect(place.category).toBe('Выбранная точка');
      expect(place.subcategory).toBe('Выбрано на карте');
      expect(place.estimatedVisitMinutes).toBe(30);
      expect(place.tags).toContain('name=Selected point');
      expect(place.tags).toContain('addr:full=Selected point');
    });

    test('создаёт новую точку из маркера типа end (отель)', () => {
      const marker = createHotelMarker(55.7558, 37.6173, 'Hotel');
      const place = createPlaceFromMarker(marker);
      expect(place.id).toBe(0);
      expect(place.name).toBe('Hotel');
      expect(place.category).toBe('Отель');
      expect(place.subcategory).toBe('Отель');
    });
  });

  describe('getCurvedPath', () => {
    test('возвращает массив точек между start и end с curvature 0', () => {
      const start: [number, number] = [55.7558, 37.6173];
      const end: [number, number] = [55.7512, 37.6185];
      const points = getCurvedPath(start, end, 0, 5);
      expect(points.length).toBe(6);
      expect(points[0]).toEqual(start);
      expect(points[points.length - 1]).toEqual(end);
      for (let i = 1; i < points.length - 1; i++) {
        const t = i / 5;
        const lon = start[1] + (end[1] - start[1]) * t;
        const lat = start[0] + (end[0] - start[0]) * t;
        expect(points[i][0]).toBeCloseTo(lat);
        expect(points[i][1]).toBeCloseTo(lon);
      }
    });

    test('возвращает изогнутую линию при curvature > 0', () => {
      const start: [number, number] = [0, 0];
      const end: [number, number] = [10, 0];
      const straight = getCurvedPath(start, end, 0, 10);
      const curved = getCurvedPath(start, end, 0.5, 10);
      expect(straight).not.toEqual(curved);
      const maxY = Math.max(...curved.map((p) => p[0]));
      const minY = Math.min(...curved.map((p) => p[0]));
      expect(maxY - minY).toBeGreaterThan(0);
    });

    test('возвращает [start, end] если расстояние ноль', () => {
      const point: [number, number] = [55.7558, 37.6173];
      const result = getCurvedPath(point, point, 0.3, 10);
      expect(result).toEqual([point, point]);
    });
  });

  describe('buildFullRouteSegments', () => {
    const createMockRouteResponse = (): RouteResponse => ({
      visitPoints: [
        {
          mainAttraction: {
            id: 1,
            name: 'Attraction 1',
            latitude: 55.75,
            longitude: 37.62,
            category: 'test',
            subcategory: 'test',
            square: null,
            estimatedVisitMinutes: 30,
            osmType: 'node',
            tags: [],
          },
          otherAttractions: [],
          estimatedTimeInMinutes: 30,
        },
      ],
      sections: [
        {
          gaps: [
            {
              startNode: {
                nodeId: 101,
                name: 'Start Stop',
                latitude: 55.749,
                longitude: 37.619,
                role: 'start',
                sequence: 1,
              },
              endNode: {
                nodeId: 102,
                name: 'End Stop',
                latitude: 55.751,
                longitude: 37.621,
                role: 'end',
                sequence: 2,
              },
              transport: 'bus',
              routeNumber: '123',
              nodesVisited: [],
            },
          ],
          estimatedTimeInMinutes: 10,
          numberOfTransfers: 0,
        },
      ],
    });

    test('строит сегменты для одного транспортного перегона', () => {
      const response = createMockRouteResponse();
      const segments = buildFullRouteSegments(response, response.visitPoints, 55.7558, 37.6173);
      expect(segments.length).toBeGreaterThan(0);
      const walkToStart = segments.find((s) => s.id === 'walk-to-section-0');
      expect(walkToStart).toBeDefined();
      expect(walkToStart?.type).toBe('walk');
      const transport = segments.find((s) => s.id === 'transport-0-gap-0');
      expect(transport).toBeDefined();
      expect(transport?.type).toBe('bus');
      const walkToCluster = segments.find((s) => s.id === 'walk-transport-to-cluster-0');
      expect(walkToCluster).toBeDefined();
      const finalReturn = segments.find((s) => s.id === 'walk-final-return');
      expect(finalReturn).toBeDefined();
    });

    test('обрабатывает секцию без транспорта', () => {
      const response: RouteResponse = {
        visitPoints: [
          {
            mainAttraction: {
              id: 1,
              name: 'Attraction 1',
              latitude: 55.75,
              longitude: 37.62,
              category: 'test',
              subcategory: 'test',
              square: null,
              estimatedVisitMinutes: 30,
              osmType: 'node',
              tags: [],
            },
            otherAttractions: [],
            estimatedTimeInMinutes: 30,
          },
        ],
        sections: [
          {
            gaps: [],
            estimatedTimeInMinutes: 5,
            numberOfTransfers: 0,
          },
        ],
      };
      const segments = buildFullRouteSegments(response, response.visitPoints, 55.7558, 37.6173);
      const walkSection = segments.find((s) => s.id === 'walk-section-0');
      expect(walkSection).toBeDefined();
      expect(walkSection?.type).toBe('walk');
    });
  });

  describe('getSegmentCurvedPoints', () => {
    test('возвращает пустой массив для сегмента с недостаточным количеством точек', () => {
      const segment: RouteSegment = {
        id: 'test',
        type: 'bus',
        points: [],
      };
      expect(getSegmentCurvedPoints(segment)).toEqual([]);
    });

    test('возвращает прямые точки для пешего сегмента', () => {
      const points: [number, number][] = [
        [55.7558, 37.6173],
        [55.7512, 37.6185],
      ];
      const segment: RouteSegment = {
        id: 'walk',
        type: 'walk',
        points,
      };
      const result = getSegmentCurvedPoints(segment);
      expect(result).toEqual(points);
    });

    test('возвращает изогнутые точки для транспортного сегмента', () => {
      const points: [number, number][] = [
        [55.7558, 37.6173],
        [55.753, 37.619],
        [55.7512, 37.6185],
      ];
      const segment: RouteSegment = {
        id: 'bus',
        type: 'bus',
        points,
      };
      const curved = getSegmentCurvedPoints(segment);
      expect(curved.length).toBeGreaterThan(points.length);
      expect(curved[0]).toEqual(points[0]);
      expect(curved[curved.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe('extractWalkingSegmentsFromRouteSegments', () => {
    test('извлекает пешие сегменты и преобразует в WalkingSegment', () => {
      const segments: RouteSegment[] = [
        {
          id: 'walk-1',
          type: 'walk',
          points: [
            [55.7558, 37.6173],
            [55.754, 37.618],
          ],
          gapId: 'walk-to-section-0',
          startName: 'Start Point',
          endName: 'End Point',
        },
        {
          id: 'bus-1',
          type: 'bus',
          points: [
            [55.754, 37.618],
            [55.753, 37.619],
          ],
          gapId: 'bus-gap',
        },
      ];
      const walking = extractWalkingSegmentsFromRouteSegments(segments);
      expect(walking.length).toBe(1);
      expect(walking[0].id).toBe('walk-to-section-0');
      expect(walking[0].sectionIndex).toBe(0);
      expect(walking[0].startPoint.name).toBe('Start Point');
      expect(walking[0].endPoint.name).toBe('End Point');
      expect(walking[0].estimatedTime).toBeDefined();
    });
  });

  describe('extractWalkingSegmentsForInfoPanel', () => {
    test('возвращает пустой массив если нет ответа', () => {
      const result = extractWalkingSegmentsForInfoPanel(null, 55.7558, 37.6173);
      expect(result).toEqual([]);
    });
  });

  describe('extractSectionIndexFromGapId', () => {
    test('извлекает индекс из section-<n>', () => {
      expect(extractSectionIndexFromGapId('section-2')).toBe(2);
    });
    test('извлекает индекс из walk-to-section-<n>', () => {
      expect(extractSectionIndexFromGapId('walk-to-section-3')).toBe(3);
    });
    test('извлекает индекс из walk-cluster-<n>-*', () => {
      expect(extractSectionIndexFromGapId('walk-cluster-1-0')).toBe(1);
    });
    test('извлекает индекс из walk-transfer-<n>-*', () => {
      expect(extractSectionIndexFromGapId('walk-transfer-4-2')).toBe(4);
    });
    test('извлекает индекс из walk-transport-to-cluster-<n>', () => {
      expect(extractSectionIndexFromGapId('walk-transport-to-cluster-5')).toBe(5);
    });
    test('извлекает индекс из walk-section-<n>', () => {
      expect(extractSectionIndexFromGapId('walk-section-6')).toBe(6);
    });
    test('извлекает индекс из <n>-<m>', () => {
      expect(extractSectionIndexFromGapId('2-1')).toBe(2);
    });
    test('возвращает -1 для walk-final-return', () => {
      expect(extractSectionIndexFromGapId('walk-final-return')).toBe(-1);
    });
    test('возвращает -1 для невалидных строк', () => {
      expect(extractSectionIndexFromGapId('invalid')).toBe(-1);
      expect(extractSectionIndexFromGapId('')).toBe(-1);
    });
  });
});
