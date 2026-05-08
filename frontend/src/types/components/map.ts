import type { MobileTab } from '../../components/MobileTabBar/MobileTabBar';
import type { CityType, RouteResponse, VisitPoint, WalkingSegment, TabType, FormData } from '..';

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
  metroCity?: CityType;
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

export type MapState = {
  routeData: FormData | null;
  lastRouteData: FormData | null;
  isDestinationLocked: boolean;
  routeResponse: RouteResponse | null;
  isLoading: boolean;
  error: string | null;
  isInfoPanelCollapsed: boolean;
  isSelectingOnMap: boolean;
  mobileActiveTab: MobileTab;
  isMobile: boolean;
  walkingSegments: WalkingSegment[];
  selectedGapId: string | null;
  activeTab: TabType;
  showNotification: boolean;
}

export type MapAction =
  | { type: 'SET_ROUTE_DATA'; payload: FormData | null }
  | { type: 'SET_LAST_ROUTE_DATA'; payload: FormData | null }
  | { type: 'SET_DESTINATION_LOCKED'; payload: boolean }
  | { type: 'SET_ROUTE_RESPONSE'; payload: RouteResponse | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INFO_PANEL_COLLAPSED'; payload: boolean }
  | { type: 'SET_SELECTING_ON_MAP'; payload: boolean }
  | { type: 'SET_MOBILE_ACTIVE_TAB'; payload: MobileTab }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'SET_WALKING_SEGMENTS'; payload: WalkingSegment[] }
  | { type: 'SET_SELECTED_GAP_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_SHOW_NOTIFICATION'; payload: boolean }
  | { type: 'INITIALIZE_FROM_TICKET'; payload: FormData }
  | { type: 'INITIALIZE_FROM_CUSTOM_ROUTE'; payload: FormData }
  | { type: 'INITIALIZE_FROM_BUILDER'; payload: FormData }
  | { type: 'UPDATE_ROUTE_DATA'; payload: FormData }
  | { type: 'RESET_ALL' }
  | { type: 'HANDLE_ROUTE_UPDATE_START'; payload: FormData }
  | { type: 'HANDLE_ROUTE_UPDATE_SUCCESS'; payload: RouteResponse }
  | { type: 'HANDLE_ROUTE_UPDATE_ERROR'; payload: string };