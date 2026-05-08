import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import { getSegmentCurvedPoints } from '../utils';
import { getMetroLineColor } from '../../../../constants/metroConstants';
import type { CityType, RouteSegment } from '../../../../types';
import { TRANSPORT_COLORS } from '../constants';

type ExtendedRouteSegment = RouteSegment & {
  metroCity?: CityType;
};

type RouteArrowsProps = {
  segments: ExtendedRouteSegment[];
};

export const RouteArrows = ({ segments }: RouteArrowsProps) => {
  const map = useMap();
  const decoratorRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!map) {
      return;
    }

    decoratorRef.current.forEach((layer) => map.removeLayer(layer));
    decoratorRef.current = [];

    segments.forEach((segment) => {
      const points = getSegmentCurvedPoints(segment);
      if (points.length < 2) {
        return;
      }

      const latlngs = points.map((p) => L.latLng(p[0], p[1]));
      const polyline = L.polyline(latlngs, { interactive: false, weight: 0 });

      let arrowColor: string;
      if (
        segment.type === 'metro' &&
        segment.routeNumber &&
        segment.metroCity &&
        segment.metroCity !== 'other'
      ) {
        arrowColor = getMetroLineColor(segment.routeNumber, segment.metroCity);
      } else {
        arrowColor = TRANSPORT_COLORS[segment.type] || '#888888';
      }

      const getArrowPatterns = () => {
        if (segment.type === 'walk') {
          return [
            {
              offset: '50%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 8,
                polygon: false,
                pathOptions: {
                  color: arrowColor,
                  weight: 2,
                  opacity: 0.5,
                },
              }),
            },
          ];
        }

        if (segment.type === 'metro') {
          return [
            {
              offset: '15%',
              repeat: '30%',
              symbol: L.Symbol.arrowHead({
                pixelSize: 12,
                polygon: false,
                pathOptions: {
                  color: arrowColor,
                  weight: 2,
                  opacity: 0.5,
                },
              }),
            },
          ];
        }

        return [
          {
            offset: '10%',
            repeat: '20%',
            symbol: L.Symbol.arrowHead({
              pixelSize: 12,
              polygon: false,
              pathOptions: {
                color: arrowColor,
                weight: 2,
                opacity: 0.5,
              },
            }),
          },
        ];
      };

      const decorator = L.polylineDecorator(polyline, {
        patterns: getArrowPatterns(),
      });

      decorator.addTo(map);
      decoratorRef.current.push(decorator);
    });

    return () => {
      decoratorRef.current.forEach((layer) => map.removeLayer(layer));
    };
  }, [map, segments]);

  return null;
};
