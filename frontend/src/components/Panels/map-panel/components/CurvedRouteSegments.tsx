import { Polyline } from 'react-leaflet';
import { getPolylineOptions } from '../constants';
import { getSegmentCurvedPoints } from '../utils';
import type { RouteSegment } from '../types';

type CurvedRouteSegmentsProps = {
  segments: RouteSegment[];
};

export const CurvedRouteSegments = ({ segments }: CurvedRouteSegmentsProps) => {
  return (
    <>
      {segments.map(segment => {
        const points = getSegmentCurvedPoints(segment);
        if (points.length < 2) return null;

        return (
          <Polyline
            key={segment.id}
            positions={points}
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