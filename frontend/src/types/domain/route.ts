import type { VisitPointGroup } from './visit';

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

export type RouteResponse = {
  visitPoints: VisitPointGroup[];
  sections: RouteSection[];
};
