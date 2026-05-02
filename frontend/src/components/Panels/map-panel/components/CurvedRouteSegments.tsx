import { Polyline } from 'react-leaflet';
import { getPolylineOptions } from '../constants';
import { getSegmentCurvedPoints } from '../utils';
import { useEffect } from 'react';
import type { RouteSegment } from '../../../../types';

type CurvedRouteSegmentsProps = {
  segments: RouteSegment[];
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
};

export const CurvedRouteSegments = ({ segments, selectedGapId, onSelectGap }: CurvedRouteSegmentsProps) => {
  const handleSegmentClick = (segment: RouteSegment) => {
    if (segment.gapId && onSelectGap) {
      console.log(`🖱️ Segment clicked: ${segment.id}, gapId: ${segment.gapId}`);
      onSelectGap(segment.gapId);
    }
  };

  useEffect(() => {
    console.log('📋 Route segments on map:', segments.map(s => ({ id: s.id, gapId: s.gapId, type: s.type })));
  }, [segments]);

  useEffect(() => {
    if (selectedGapId) {
      const exists = segments.some(s => s.gapId === selectedGapId);
      console.log(`🎯 Selected gapId: ${selectedGapId}, exists in segments: ${exists}`);
    }
  }, [selectedGapId, segments]);

  return (
    <>
      {segments.map(segment => {
        const points = getSegmentCurvedPoints(segment);
        if (points.length < 2) return null;
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