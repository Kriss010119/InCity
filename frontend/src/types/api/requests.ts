export type DestinationPoint = {
  name: string;
  lat: number;
  lng: number;
};

export type RouteFromPointQuery = {
  destination: DestinationPoint;
  date: string;
  duration: 'very-short' | 'short' | 'medium' | 'long';
  transport: string[];
  attractions: string[];
  subattractions: string[];
  events: string[];
};

export type RouteFromOrderQuery = {
  arrivalCode: string;
  date: string;
  duration: 'very-short' | 'short' | 'medium' | 'long';
  transport: string[];
  attractions: string[];
  subattractions: string[];
  events: string[];
};