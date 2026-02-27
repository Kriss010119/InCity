import type { RouteResponse, VisitPoint } from '../../../types/types';

export type MapMarkerType = 'start' | 'end' | 'point' | 'selected';

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: MapMarkerType;
  description?: string;
  image?: string;
  rating?: number;
  address?: string;
  website?: string;
  schedule?: string;
  phone?: string;
  category?: string;
  estimatedTime?: number;
  placeData?: VisitPoint;
};

export type MapPanelProps = {
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  isHotelTicket?: boolean;
  routeResponse?: RouteResponse | null;
  isLoading?: boolean;
  isInfoPanelCollapsed?: boolean;
  isSelectingMode?: boolean;
  onDestinationSelect?: (lat: number, lng: number, address?: string) => void;
};

export type MapHandlersProps = {
  onMapClick: (lat: number, lng: number) => void;
  isSelectingMode: boolean;
};

export type MapResizeHandlerProps = {
  isInfoPanelCollapsed: boolean;
};

export type MapMarkersProps = {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
};

export type RoutePolylineProps = {
  points: [number, number][];
};