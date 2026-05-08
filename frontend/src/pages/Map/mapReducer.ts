import { ALL_FILTER_OPTIONS } from '../../constants/filterConstants';
import { STORAGE_KEYS } from '../../constants/map';
import type { MapState, RouteResponse, MapAction, FormData } from '../../types';

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

export const expandCategoriesToSubOptions = (categoryIds: string[]): string[] => {
  if (!categoryIds.length) return [];
  return ALL_FILTER_OPTIONS.filter((opt) => categoryIds.includes(opt.category!)).map(
    (opt) => opt.id,
  );
};

export const getInitialState = (): MapState => ({
  routeData: loadFromStorage<FormData>(STORAGE_KEYS.ROUTE_DATA) || null,
  lastRouteData: loadFromStorage<FormData>(STORAGE_KEYS.LAST_ROUTE_DATA) || null,
  isDestinationLocked: loadFromStorage<boolean>(STORAGE_KEYS.IS_DESTINATION_LOCKED) || false,
  routeResponse: loadFromStorage<RouteResponse>(STORAGE_KEYS.ROUTE_RESPONSE) || null,
  isLoading: false,
  error: null,
  isInfoPanelCollapsed: loadFromStorage<boolean>(STORAGE_KEYS.IS_INFO_PANEL_COLLAPSED) || false,
  isSelectingOnMap: false,
  mobileActiveTab: 'input',
  isMobile: false,
  walkingSegments: [],
  selectedGapId: null,
  activeTab: 'route',
  showNotification: false,
});

export const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'SET_ROUTE_DATA':
      return { ...state, routeData: action.payload };

    case 'SET_LAST_ROUTE_DATA':
      return { ...state, lastRouteData: action.payload };

    case 'SET_DESTINATION_LOCKED':
      return { ...state, isDestinationLocked: action.payload };

    case 'SET_ROUTE_RESPONSE':
      return { ...state, routeResponse: action.payload, selectedGapId: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_INFO_PANEL_COLLAPSED':
      return { ...state, isInfoPanelCollapsed: action.payload };

    case 'SET_SELECTING_ON_MAP':
      return { ...state, isSelectingOnMap: action.payload };

    case 'SET_MOBILE_ACTIVE_TAB':
      return { ...state, mobileActiveTab: action.payload };

    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload };

    case 'SET_WALKING_SEGMENTS':
      return { ...state, walkingSegments: action.payload };

    case 'SET_SELECTED_GAP_ID':
      return { ...state, selectedGapId: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_SHOW_NOTIFICATION':
      return { ...state, showNotification: action.payload };

    case 'INITIALIZE_FROM_TICKET':
    case 'INITIALIZE_FROM_CUSTOM_ROUTE':
    case 'INITIALIZE_FROM_BUILDER':
      return {
        ...state,
        routeData: action.payload,
        lastRouteData: action.payload,
        isDestinationLocked: true,
      };

    case 'UPDATE_ROUTE_DATA':
      return {
        ...state,
        routeData: action.payload,
        lastRouteData: action.payload,
        showNotification: false,
        error: null,
      };

    case 'HANDLE_ROUTE_UPDATE_START':
      return {
        ...state,
        routeData: action.payload,
        lastRouteData: action.payload,
        showNotification: false,
        error: null,
        isLoading: true,
      };

    case 'HANDLE_ROUTE_UPDATE_SUCCESS':
      return {
        ...state,
        routeResponse: action.payload,
        selectedGapId: null,
        isLoading: false,
      };

    case 'HANDLE_ROUTE_UPDATE_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'RESET_ALL':
      return {
        ...getInitialState(),
        mobileActiveTab: state.isMobile ? 'input' : 'input',
        isMobile: state.isMobile,
      };

    default:
      return state;
  }
};
