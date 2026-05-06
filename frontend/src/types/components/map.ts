import type { VisitPoint } from '../domain';

export type MapMarkerType = 'start' | 'end' | 'point' | 'event' | 'selected';

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
  clusterData?: {
    isCluster: boolean;
    groupIndex: number;
    totalPoints: number;
    points: VisitPoint[];
    centerLat: number;
    centerLng: number;
    centerName: string;
  };
};

export type TransportType = 'walk' | 'bus' | 'tram' | 'trolleybus' | 'metro';

export type RouteSegment = {
  id: string;
  points: [number, number][];
  type: TransportType;
  routeNumber?: string;
  estimatedTime?: number;
  intermediateStops?: string[];
  gapId?: string;
  startName?: string;
  endName?: string;
};

export type MapPanelProps = {
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  isHotelTicket?: boolean;
  routeResponse?: import('../domain').RouteResponse | null;
  isLoading?: boolean;
  isInfoPanelCollapsed?: boolean;
  isSelectingMode?: boolean;
  onDestinationSelect?: (lat: number, lng: number, address?: string) => void;
  selectedGapId?: string | null;
  selectedSectionIndex?: number | null;
  onSelectGap?: (gapId: string | null) => void;
  onSelectSection?: (sectionIndex: number | null) => void;
};

export type MapHandlersProps = {
  onMapClick: (lat: number, lng: number) => void;
  isSelectingMode: boolean;
  onClearSelection?: () => void;
};

export type MapResizeHandlerProps = {
  isInfoPanelCollapsed: boolean;
};

export type MapMarkersProps = {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
};