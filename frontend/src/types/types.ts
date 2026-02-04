export type Theme = 'light' | 'dark';

export type TransportType = 'metro' | 'bus' | 'train' | 'electric_train' | 'plane' | 'ship';

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  themeIcon: string;
}

export type FormData = {
  from: string;
  to: string;
  date: string;
  transport: string[];
  attractions: string[];
  events: string[];
}

export type RoutePointType = {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export type PlaceType = {
  id: string;
  title: string;
  type: 'event' | 'sight';
}

export type RouteStateType = {
  from: RoutePointType | null;
  to: RoutePointType | null;
  places: PlaceType[];
}

export type Coordinates = {
  lat: number;
  lng: number;
}

export type Event = {
  id: string;
  name: string;
  coordinates: Coordinates;
  description: string;
  date: string;
  tags: string[];
}

export type RoutePoint = {
  id: string;
  address: string;
  coordinates: Coordinates;
  type: 'start' | 'intermediate' | 'end';
}

export interface RouteStep {
  id: number;
  action: string;
  location: string;
  time: number;
}

export type Route = {
  points: RoutePoint[];
  polyline: Coordinates[];
  distance: number;
  duration: number;
  transport: TransportType[];
}

export type Attraction = {
  id: number;
  name: string;
  coordinates?: Coordinates;
  description?: string;
  shortDescription?: string;
  address?: string;
  workingHours?: string;
  tags?: string[];
  weather?: 'sunny' | 'cloudy' | 'rainy';
  image?: string;
  distance: string;
}

export type MapMarker = {
  id: string;
  coordinates: Coordinates;
  type: 'route' | 'attraction';
  color: 'red' | 'green' | 'yellow' | 'blue' | 'purple';
  popup?: {
    title: string;
    description: string;
  };
}