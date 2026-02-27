import { Polyline } from 'react-leaflet';
import { POLYLINE_STYLES } from '../constants';
import type { RoutePolylineProps } from '../types';

export const RoutePolyline = ({ points }: RoutePolylineProps) => {
  if (points.length < 2) return null;
  
  return (
    <Polyline
      positions={points}
      pathOptions={POLYLINE_STYLES}
    />
  );
};