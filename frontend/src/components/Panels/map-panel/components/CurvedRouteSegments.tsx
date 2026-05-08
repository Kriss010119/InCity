import { Polyline } from 'react-leaflet';
import { getSecondaryPolylineOptions } from '../constants';
import { getSegmentCurvedPoints } from '../utils';
import type { CityType, RouteSegment } from '../../../../types';
import React from 'react';
import { getMetroLineColor } from '../../../../constants/metroConstants';

type ExtendedRouteSegment = RouteSegment & {
  metroCity?: CityType;
};

type CurvedRouteSegmentsProps = {
  segments: ExtendedRouteSegment[];
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
};

const DEFAULT_COLORS: Record<string, string> = {
  walk: '#b8b8b8ff',
  bus: '#434fffff',
  tram: '#6fbf4c',
  trolleybus: '#8e44ad',
  metro: '#bf5151ff',
};

export const CurvedRouteSegments = ({
  segments,
  selectedGapId,
  onSelectGap,
}: CurvedRouteSegmentsProps) => {
  const handleSegmentClick = (segment: ExtendedRouteSegment) => {
    if (segment.gapId && onSelectGap) {
      onSelectGap(segment.gapId);
    }
  };

  return (
    <>
      {segments.map((segment) => {
        const points = getSegmentCurvedPoints(segment);
        if (points.length < 2) {
          return null;
        }
        const isSelected = segment.gapId === selectedGapId;

        let color: string;
        if (
          segment.type === 'metro' &&
          segment.routeNumber &&
          segment.metroCity &&
          segment.metroCity !== 'other'
        ) {
          color = getMetroLineColor(segment.routeNumber, segment.metroCity);
        } else {
          color = DEFAULT_COLORS[segment.type] || '#888888';
        }

        const isDashed =
          segment.type === 'bus' || segment.type === 'tram' || segment.type === 'trolleybus';

        const options = {
          color,
          weight: isSelected ? (isDashed ? 7 : 6) : isDashed ? 4 : 3,
          opacity: isSelected ? 1 : 0.7,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
          ...(isDashed && { dashArray: isSelected ? '8, 4' : '6, 3' }),
        };

        const secondaryOptions = getSecondaryPolylineOptions(segment.type, isSelected);

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
