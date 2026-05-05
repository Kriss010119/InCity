import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import { getSegmentCurvedPoints } from '../utils';
import { getPolylineOptions } from '../constants';
import type { RouteSegment } from '../../../../types';

type RouteArrowsProps = {
  segments: RouteSegment[];
};

export const RouteArrows = ({ segments }: RouteArrowsProps) => {
  const map = useMap();
  const decoratorRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!map) {
        return;
    }

    decoratorRef.current.forEach(layer => map.removeLayer(layer));
    decoratorRef.current = [];

    segments.forEach(segment => {
      const points = getSegmentCurvedPoints(segment);
      if (points.length < 2) {
        return;
      }

      const latlngs = points.map(p => L.latLng(p[0], p[1]));
      const polyline = L.polyline(latlngs, { interactive: false, weight: 0 });
      const lineOptions = getPolylineOptions(segment.type);
      const arrowColor = lineOptions.color;

      const decorator = L.polylineDecorator(polyline, {
        patterns: [
          {
            offset: (segment.type === 'walk') ? '50%' : '25%',
            repeat: (segment.type === 'walk') ? 0 : '25%',
            symbol: L.Symbol.arrowHead({
              pixelSize: 12,
              polygon: false,
              pathOptions: {
                color: arrowColor,
                weight: 2,
                opacity: 0.9,
              },
            }),
          },
        ],
      });
      decorator.addTo(map);
      decoratorRef.current.push(decorator);
    });

    return () => {
      decoratorRef.current.forEach(layer => map.removeLayer(layer));
    };
  }, [map, segments]);

  return null;
};