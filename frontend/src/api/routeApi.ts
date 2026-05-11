import axios from 'axios';
import { mapAttractionsToBackend } from '../constants/filterConstants';
import type { FormData, RouteResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 20000,
});

const toCsv = (values?: string[]) => (values && values.length > 0 ? values.join(',') : '');

export const buildRouteFromPoint = async (formData: FormData): Promise<RouteResponse> => {
  if (formData.destinationLat == null || formData.destinationLng == null) {
    throw new Error('Destination coordinates are required');
  }

  const { main, sub } = mapAttractionsToBackend(formData.attractions || []);
  const response = await api.get<RouteResponse>('/route-from-point', {
    params: {
      lat: formData.destinationLat,
      lng: formData.destinationLng,
      duration: formData.duration || 'medium',
      transport: toCsv(formData.transport),
      attractions: toCsv([...new Set(main)]),
      subattractions: toCsv(sub),
      events: toCsv(formData.events),
    },
  });

  return response.data;
};

export const buildRouteFromOrder = async (
  arrivalCode: string,
  date: string,
  duration: 'very-short' | 'short' | 'medium' | 'long',
  transport?: string[],
  attractions?: string[],
  events?: string[],
): Promise<RouteResponse> => {
  const { main, sub } = mapAttractionsToBackend(attractions || []);
  const response = await api.get<RouteResponse>('/route-from-order', {
    params: {
      arrivalCode,
      date,
      duration,
      transport: toCsv(transport),
      attractions: toCsv([...new Set(main)]),
      subattractions: toCsv(sub),
      events: toCsv(events),
    },
  });

  return response.data;
};

export const getPlacesAlongRoute = (routeId: string) => api.get(`/places?routeId=${routeId}`);

export const getEventsInCity = (city: string) => api.get(`/events?city=${city}`);
