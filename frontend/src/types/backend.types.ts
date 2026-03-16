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

export type RouteResponse = {
  visitPoints: VisitPoint[];
  sections: Section[];
};

export type VisitPoint = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory: string;
  square: number;
  estimatedVisitMinutes: number;
  osmType: string;
  tags: string[];
};

export type Node = {
  nodeId: number;
  name: string;
  latitude: number;
  longitude: number;
  role: string;
  sequence: number;
};

export type Gap = {
  startNode: Node;
  transport: string;
  routeNumber: string;
  endNode: Node;
  nodesVisited: Node[];
};

export type Section = {
  gaps: Gap[];
  estimatedTimeInMinutes: number;
  numberOfTransfers: number;
};