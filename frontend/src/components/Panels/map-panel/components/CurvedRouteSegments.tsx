import { Polyline } from 'react-leaflet';
import { getPolylineOptions, getSecondaryPolylineOptions } from '../constants';
import { getSegmentCurvedPoints } from '../utils';
import type { RouteSegment } from '../../../../types';
import React from 'react';

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

        const options = getPolylineOptions(
          segment.type, 
          isSelected,
          segment.routeNumber,
          segment.startName
        );
        
        const secondaryOptions = getSecondaryPolylineOptions(
          segment.type,
          isSelected,
        );
        
        return (
          <React.Fragment key={segment.id}>
            <Polyline
              positions={points}
              pathOptions={options}
              eventHandlers={{
                click: () => handleSegmentClick(segment),
              }}
            />
            {secondaryOptions && (
              <Polyline
                positions={points}
                pathOptions={secondaryOptions}
                eventHandlers={{
                  click: () => handleSegmentClick(segment),
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};