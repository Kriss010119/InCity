import { Polyline } from 'react-leaflet';
import { getPolylineOptions } from '../constants';
import { getSegmentCurvedPoints } from '../utils';
import type { RouteSegment } from '../../../../types';

type CurvedRouteSegmentsProps = {
  segments: RouteSegment[];
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
};

export const CurvedRouteSegments = ({ segments, selectedGapId, onSelectGap }: CurvedRouteSegmentsProps) => {
  const handleSegmentClick = (segment: RouteSegment) => {
    if (segment.gapId && onSelectGap) {
      onSelectGap(segment.gapId);
    }
  };
  return (
    <>
      {segments.map(segment => {
        const points = getSegmentCurvedPoints(segment);
        if (points.length < 2) {
          return null;
        }
        const isSelected = segment.gapId === selectedGapId;
        const options = getPolylineOptions(segment.type, isSelected);
        return (
          <Polyline
            key={segment.id}
            positions={points}
            pathOptions={options}
            eventHandlers={{
              click: () => handleSegmentClick(segment),
            }}
          />
        );
      })}
    </>
  );
};