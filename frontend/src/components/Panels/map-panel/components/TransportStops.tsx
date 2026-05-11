import { useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type { RouteResponse } from '../../../../types';
import { getTransportColor } from '../../../../constants/transportConstants';

type TransportStopsProps = {
  routeResponse?: RouteResponse | null;
};

interface StopPoint {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'end' | 'intermediate';
  transportType?: string;
  routeNumber?: string;
}

export const TransportStops = ({ routeResponse }: TransportStopsProps) => {
  const stops = useMemo(() => {
    if (!routeResponse?.sections) return [];

    const stopsList: StopPoint[] = [];
    const seenStopIds = new Set<string | number>();

    routeResponse.sections.forEach((section) => {
      section.gaps.forEach((gap) => {
        if (gap.startNode && !seenStopIds.has(gap.startNode.nodeId)) {
          seenStopIds.add(gap.startNode.nodeId);
          stopsList.push({
            id: gap.startNode.nodeId,
            lat: gap.startNode.latitude,
            lng: gap.startNode.longitude,
            name: gap.startNode.name,
            type: 'start',
            transportType: gap.transport,
            routeNumber: gap.routeNumber,
          });
        }

        if (gap.endNode && !seenStopIds.has(gap.endNode.nodeId)) {
          seenStopIds.add(gap.endNode.nodeId);
          stopsList.push({
            id: gap.endNode.nodeId,
            lat: gap.endNode.latitude,
            lng: gap.endNode.longitude,
            name: gap.endNode.name,
            type: 'end',
            transportType: gap.transport,
            routeNumber: gap.routeNumber,
          });
        }

        gap.nodesVisited?.forEach((node) => {
          if (!seenStopIds.has(node.nodeId)) {
            seenStopIds.add(node.nodeId);
            stopsList.push({
              id: node.nodeId,
              lat: node.latitude,
              lng: node.longitude,
              name: node.name,
              type: 'intermediate',
              transportType: gap.transport,
              routeNumber: gap.routeNumber,
            });
          }
        });
      });
    });

    return stopsList;
  }, [routeResponse]);

  if (stops.length === 0) return null;

  return (
    <>
      {stops.map((stop) => (
        <CircleMarker
          key={stop.id}
          center={[stop.lat, stop.lng]}
          radius={stop.type === 'intermediate' ? 4 : 6}
          fillColor={getTransportColor(stop.transportType || 'bus', stop.routeNumber, stop.name, {
            lat: stop.lat,
            lng: stop.lng,
            routeNumber: stop.routeNumber,
          })}
          color="#ffffff"
          weight={stop.type === 'intermediate' ? 1.5 : 2}
          fillOpacity={0.85}
          opacity={0.9}
        >
          <Popup>
            <div style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
              <strong>{stop.name}</strong>
              <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#666' }}>
                {stop.type === 'start' && 'Начальная остановка'}
                {stop.type === 'end' && 'Конечная остановка'}
                {stop.type === 'intermediate' && 'Промежуточная остановка'}
              </div>
              {stop.transportType && (
                <div style={{ marginTop: '2px', fontSize: '0.7rem', color: '#888' }}>
                  {stop.transportType === 'bus' && 'Автобус'}
                  {stop.transportType === 'trolleybus' && 'Троллейбус'}
                  {stop.transportType === 'tram' && 'Трамвай'}
                  {stop.transportType === 'metro' && 'Метро'}
                  {stop.routeNumber && ` №${stop.routeNumber}`}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};
