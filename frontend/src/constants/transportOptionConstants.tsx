import { Train, Bus, Clock } from 'lucide-react';
import type { TransportOption } from '../types';

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'metro', name: 'Метро', icon: <Train size={16} /> },
  { id: 'bus', name: 'Автобус', icon: <Bus size={16} /> },
  { id: 'tram', name: 'Трамвай', icon: <Bus size={16} /> },
  { id: 'trolleybus', name: 'Троллейбус', icon: <Bus size={16} /> },
];

export const DURATION_OPTIONS = [
  { id: 'very-short', name: 'Очень короткий', description: 'Менее 2 часов', icon: <Clock size={14} /> },
  { id: 'short', name: 'Короткий', description: '2-3 часа', icon: <Clock size={14} /> },
  { id: 'medium', name: 'Средний', description: '3-6 часов', icon: <Clock size={14} /> },
  { id: 'long', name: 'Длинный', description: '6-9 часов', icon: <Clock size={14} /> },
];

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];