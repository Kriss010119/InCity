import { Polyline } from 'react-leaflet';
import { getCurvedPath } from '../utils';
import { getPolylineOptions } from '../constants';
import type { RouteSegment } from '../types';

type CurvedRouteSegmentsProps = {
  segments: RouteSegment[];
};

const isValidPoint = (point: [number, number]): boolean => {
  return point && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number' && !isNaN(point[0]) && !isNaN(point[1]);
};

export const CurvedRouteSegments = ({ segments }: CurvedRouteSegmentsProps) => {
  return (
    <>
      {segments.map(segment => {
        const validPoints = segment.points.filter(isValidPoint);
        if (validPoints.length < 2) {
          return null;
        }

        let pointsToDraw: [number, number][];

        if (segment.type === 'walk') {
          pointsToDraw = validPoints;
        } else {
          const curvedPoints: [number, number][] = [];
          for (let i = 0; i < validPoints.length - 1; i++) {
            const from = validPoints[i];
            const to = validPoints[i + 1];
            if (isValidPoint(from) && isValidPoint(to)) {
              const curve = getCurvedPath(from, to, 0.3, 15);
              curvedPoints.push(...curve);
            } else {
              curvedPoints.push(from, to);
            }
          }
          pointsToDraw = curvedPoints;
        }

        return (
          <Polyline
            key={segment.id}
            positions={pointsToDraw}
            pathOptions={{
              ...getPolylineOptions(segment.type),
              weight: 2,
            }}
          />
        );
      })}
    </>
  );
};