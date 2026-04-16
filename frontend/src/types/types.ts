export type Theme = 'light' | 'dark';

export type TransportType = 'metro' | 'bus' | 'train';

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  themeIcon: string;
}

export type OrderType = 'train' | 'hotel';

export type TrainTicketDetails = {
  orderType: 'train';
  orderId: string;
  createdAt: string;
  details: {
    departureStationCode: string;
    arrivalStationCode: string;
    departureDate: string;
    arrivalDate: string;
    departureTime: string;
    arrivalTime: string;
    passengers: number;
  };
};

export type HotelTicketDetails = {
  orderType: 'hotel';
  orderId: string;
  createdAt: string;
  details: {
    hotelName: string;
    coordinates: { latitude: number; longitude: number };
    checkIn: string;
    checkOut: string;
  };
};

export type TicketDetails = TrainTicketDetails | HotelTicketDetails;

export type FormData = {
  to: string;
  date: string;
  transport: string[];
  attractions: string[];
  events: string[];
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  useTicket?: boolean;
};

export type RoutePointType = { id: string; name: string; lat: number; lng: number };
export type PlaceType = { id: string; title: string; type: 'event' | 'sight' };
export type RouteStateType = { from: RoutePointType | null; to: RoutePointType | null; places: PlaceType[] };
export type Coordinates = { lat: number; lng: number };

export type Event = {
  id: string;
  name: string;
  coordinates: Coordinates;
  description: string;
  date: string;
  tags: string[];
};

export type RoutePoint = {
  id: string;
  address: string;
  coordinates: Coordinates;
  type: 'start' | 'intermediate' | 'end';
};

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
};

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
};

export type MapMarker = {
  id: string;
  coordinates: Coordinates;
  type: 'route' | 'attraction';
  color: 'red' | 'green' | 'yellow' | 'blue' | 'purple';
  popup?: { title: string; description: string };
};

export type TicketData = { ticketNumber: string; ticketDetails: TicketDetails };
export type LocationState = { from?: string; to?: string; date?: string; autoFill?: boolean; ticketNumber?: string };

export type RouteNode = {
  nodeId: number;
  name: string;
  latitude: number;
  longitude: number;
  role: string;
  sequence: number;
};

export type RouteGap = {
  startNode: RouteNode;
  transport: string;
  routeNumber: string;
  endNode: RouteNode;
  nodesVisited: RouteNode[];
};

export type RouteSection = {
  gaps: RouteGap[];
  estimatedTimeInMinutes: number;
  numberOfTransfers: number;
};

export type VisitPoint = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory: string;
  square: number | null;
  estimatedVisitMinutes: number;
  osmType: string | null;
  tags: string[];
};

export type VisitPointGroup = {
  mainAttraction: VisitPoint;
  otherAttractions: VisitPoint[];
};

export type Node = RouteNode;
export type Gap = RouteGap;
export type Section = RouteSection;

export type RouteResponse = {
  visitPoints: VisitPointGroup[];
  sections: Section[];
};