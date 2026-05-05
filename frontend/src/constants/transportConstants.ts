import { Bus, TrainFront, TramFront, PersonStanding } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { getMetroLineColor, getMetroLineName, detectMetroCity } from './metroConstants';

export const TRANSPORT_COLORS: Record<string, string> = {
  walk: '#b8b8b8ff',
  bus: '#ff9f4a',
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
  stationName?: string
): string => {
  if (transport === 'metro' && routeNumber) {
    const city = stationName ? detectMetroCity(stationName) : 'moscow';
    return getMetroLineColor(routeNumber, city);
  }
  return TRANSPORT_COLORS[transport] || '#888888';
};

export const getTransportIcon = (transport: string) => {
  return TRANSPORT_ICONS[transport] || Bus;
};

export const getTransportLabel = (transport: string, routeNumber?: string, stationName?: string): string => {
  if (transport === 'metro' && routeNumber) {
    const city = stationName ? detectMetroCity(stationName) : 'moscow';
    const lineName = getMetroLineName(routeNumber, city);
    return `${lineName}, линия`;
  }
  return TRANSPORT_LABELS[transport] || transport;
};