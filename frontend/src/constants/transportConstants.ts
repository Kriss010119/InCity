import { Bus, TrainFront, TramFront, PersonStanding } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { getMetroLineColor, getMetroLineName, detectMetroCity } from './metroConstants';

export const TRANSPORT_COLORS: Record<string, string> = {
  walk: '#b8b8b8ff',
  bus: '#7276ffff',
  tram: '#6fbf4c',
  trolleybus: '#8e44ad',
  metro: '#bf5151ff',
};

export const TRANSPORT_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  metro: TrainFront,
  bus: Bus,
  tram: TramFront,
  trolleybus: TrainFront,
  walk: PersonStanding,
};

export const TRANSPORT_LABELS: Record<string, string> = {
  metro: 'Метро',
  bus: 'Автобус',
  tram: 'Трамвай',
  trolleybus: 'Троллейбус',
  walk: 'Пешком',
};

export const getTransportColor = (
  transport: string,
  routeNumber?: string,
  stationName?: string,
  context?: { lat?: number; lng?: number; routeNumber?: string },
): string => {
  if (transport === 'metro' && routeNumber) {
    const city = detectMetroCity(stationName || '', {
      lat: context?.lat,
      lng: context?.lng,
      routeNumber: context?.routeNumber || routeNumber,
    });
    return getMetroLineColor(routeNumber, city);
  }
  return TRANSPORT_COLORS[transport] || '#888888';
};

export const getTransportIcon = (transport: string) => {
  return TRANSPORT_ICONS[transport] || Bus;
};

export const getTransportLabel = (
  transport: string,
  routeNumber?: string,
  stationName?: string,
  context?: { lat?: number; lng?: number; routeNumber?: string },
): string => {
  if (transport === 'metro' && routeNumber) {
    const city = detectMetroCity(stationName || '', {
      lat: context?.lat,
      lng: context?.lng,
      routeNumber: routeNumber,
    });
    const lineName = getMetroLineName(routeNumber, city);
    return `${lineName}, линия`;
  }
  return TRANSPORT_LABELS[transport] || transport;
};
