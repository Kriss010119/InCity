import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { Header, InfoPanel, RouteUpdateNotification, MapPanel, InputPanel } from '../../components';
import { buildRouteFromOrder, buildRouteFromPoint } from '../../api/routeApi';
import { MobileTabBar, type MobileTab } from '../../components/MobileTabBar/MobileTabBar';

import { useTicket } from '../../context/TicketContext';
import type { FormData } from '../../components/Panels/input-panel/helpers/types';
import type { RouteResponse, VisitPoint } from '../../types/types';
import styles from './Map.module.css';

import { ALL_FILTER_OPTIONS } from '../../components/Panels/input-panel/helpers/filterConstants';

const STORAGE_KEYS = {
  ROUTE_DATA: 'map_route_data',
  ROUTE_RESPONSE: 'map_route_response',
  IS_DESTINATION_LOCKED: 'map_is_destination_locked',
  IS_INFO_PANEL_COLLAPSED: 'map_is_info_panel_collapsed',
  LAST_ROUTE_DATA: 'map_last_route_data',
};


const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromStorage = <T,>(key: string): T | null => {
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

const expandCategoriesToSubOptions = (categoryIds: string[]): string[] => {
  if (!categoryIds.length) return [];
  return ALL_FILTER_OPTIONS
    .filter(opt => categoryIds.includes(opt.category!))
    .map(opt => opt.id);
};

export const Map = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [routeData, setRouteData] = useState<FormData | null>(() => {
    const saved = loadFromStorage<FormData>(STORAGE_KEYS.ROUTE_DATA);
    return saved || null;
  });
  const [lastRouteData, setLastRouteData] = useState<FormData | null>(() => {
    const saved = loadFromStorage<FormData>(STORAGE_KEYS.LAST_ROUTE_DATA);
    return saved || null;
  });
  const [isDestinationLocked, setIsDestinationLocked] = useState(() => {
    const saved = loadFromStorage<boolean>(STORAGE_KEYS.IS_DESTINATION_LOCKED);
    return saved || false;
  });
  const [routeResponse, setRouteResponse] = useState<RouteResponse | null>(() => {
    const saved = loadFromStorage<RouteResponse>(STORAGE_KEYS.ROUTE_RESPONSE);
    return saved || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(() => {
    const saved = loadFromStorage<boolean>(STORAGE_KEYS.IS_INFO_PANEL_COLLAPSED);
    return saved || false;
  });
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('input');
  const [isMobile, setIsMobile] = useState(false);
  
  const location = useLocation();
  const { ticketData, clearTicketData } = useTicket();

  useEffect(() => {
    if (routeData) {
      saveToStorage(STORAGE_KEYS.ROUTE_DATA, routeData);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROUTE_DATA);
    }
  }, [routeData]);

  useEffect(() => {
    if (lastRouteData) {
      saveToStorage(STORAGE_KEYS.LAST_ROUTE_DATA, lastRouteData);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_ROUTE_DATA);
    }
  }, [lastRouteData]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.IS_DESTINATION_LOCKED, isDestinationLocked);
  }, [isDestinationLocked]);

  useEffect(() => {
    if (routeResponse) {
      saveToStorage(STORAGE_KEYS.ROUTE_RESPONSE, routeResponse);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROUTE_RESPONSE);
    }
  }, [routeResponse]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.IS_INFO_PANEL_COLLAPSED, isInfoPanelCollapsed);
  }, [isInfoPanelCollapsed]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ROUTE_DATA);
    localStorage.removeItem(STORAGE_KEYS.ROUTE_RESPONSE);
    localStorage.removeItem(STORAGE_KEYS.IS_DESTINATION_LOCKED);
    localStorage.removeItem(STORAGE_KEYS.LAST_ROUTE_DATA);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (routeResponse && isMobile) {
      setMobileActiveTab('map');
    }
  }, [routeResponse, isMobile]);

  const handleResetLock = () => {
    setRouteData(null);
    setLastRouteData(null);
    setRouteResponse(null);
    setIsDestinationLocked(false);
    setError(null);
    setShowNotification(false);
    setIsSelectingOnMap(false);
    clearTicketData();
    clearSavedData();
    if (isMobile) {
      setMobileActiveTab('input');
    }
  };

  const handleDestinationSelect = async (lat: number, lng: number, address?: string) => {
    if (!lat && !lng) {
      setRouteData(prev => prev ? {
        ...prev,
        destinationLat: undefined,
        destinationLng: undefined,
        destinationName: undefined,
        to: '',
      } : null);
      return;
    }

    const updatedRouteData: FormData = {
      to: address || `Точка на карте (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      date: routeData?.date || '',
      transport: routeData?.transport || ['metro', 'bus'],
      attractions: routeData?.attractions || [],
      events: routeData?.events || [],
      duration: routeData?.duration || 'medium',
      destinationLat: lat,
      destinationLng: lng,
      destinationName: address || `Точка на карте`,
      useTicket: false
    };
    
    setRouteData(updatedRouteData);
    setLastRouteData(updatedRouteData);
    setIsDestinationLocked(false);
    setIsSelectingOnMap(false);
    handleMapSelectModeChange(false); 
    
    if (updatedRouteData.date) {
      await handleRouteUpdate(updatedRouteData);
    }
  };

  const handleRouteUpdate = useCallback(async (data: FormData) => {
    console.log('🎯 handleRouteUpdate received data:', data);
    
    setRouteData(data);
    setLastRouteData(data);
    setShowNotification(false);
    setError(null);
    
    if (data.to && data.date) {
      if (!data.destinationLat || !data.destinationLng) {
        console.error('❌ Missing coordinates for destination');
        setError('Не указаны координаты точки назначения. Используйте выбор на карте или введите адрес через автодополнение.');
        return;
      }
      
      console.log('📡 Sending request to buildRoute');
      setIsLoading(true);
      try {
        let response;
        
        if (data.useTicket && ticketData?.ticketDetails?.orderType === 'train') {
          const arrivalCode = ticketData.ticketDetails.details.arrivalStationCode;
          response = await buildRouteFromOrder(
            arrivalCode,
            data.date,
            data.duration || 'medium',
            data.transport,
            data.attractions,
            data.events
          );
        } else {
          response = await buildRouteFromPoint(data);
        }
        
        console.log('✅ Route response received:', response);
        setRouteResponse(response);
      } catch (err) {
        console.error('❌ Error building route:', err);
        setError(err instanceof Error ? err.message : 'Ошибка при построении маршрута');
        // При ошибке очищаем сохраненный маршрут
        localStorage.removeItem(STORAGE_KEYS.ROUTE_RESPONSE);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('⚠️ Missing to or date', { to: data.to, date: data.date });
    }
  }, [ticketData]);

  useEffect(() => {
    if (location.state?.autoFill && ticketData?.ticketDetails) {
      const { ticketDetails } = ticketData;
      
      const initialFormData: FormData = {
        to: ticketDetails.orderType === 'train'
          ? (ticketDetails.details.arrivalStationCode === '2000000' ? 'Москва' : 'Санкт-Петербург')
          : ticketDetails.details.hotelName,
        date: ticketDetails.orderType === 'train'
          ? ticketDetails.details.departureDate
          : ticketDetails.details.checkIn.split('T')[0],
        transport: ['metro', 'bus'],
        attractions: [],
        events: [],
        duration: 'medium',
        destinationLat: ticketDetails.orderType === 'hotel' 
          ? ticketDetails.details.coordinates.latitude 
          : undefined,
        destinationLng: ticketDetails.orderType === 'hotel'
          ? ticketDetails.details.coordinates.longitude
          : undefined,
        destinationName: ticketDetails.orderType === 'hotel'
          ? ticketDetails.details.hotelName
          : undefined,
        useTicket: true
      };

      setRouteData(initialFormData);
      setLastRouteData(initialFormData);
      setIsDestinationLocked(true);
      
      handleRouteUpdate(initialFormData);
      
      window.history.replaceState({}, document.title);
    }

    if (location.state?.customRoute && location.state?.autoFill) {
      const { customRoute } = location.state;
      
      const initialFormData: FormData = {
        to: customRoute.to,
        date: customRoute.date,
        transport: customRoute.transport,
        attractions: customRoute.attractions,
        events: customRoute.events || [],
        duration: customRoute.duration,
        destinationLat: customRoute.destinationLat,
        destinationLng: customRoute.destinationLng,
        destinationName: customRoute.destinationName,
        useTicket: customRoute.useTicket
      };

      setRouteData(initialFormData);
      setLastRouteData(initialFormData);
      setIsDestinationLocked(true);
      
      handleRouteUpdate(initialFormData);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, ticketData, handleRouteUpdate]);

  const handleFormChange = () => {
    if (lastRouteData) setShowNotification(true);
  };

  const handleUpdateRoute = () => {
    if (routeData) handleRouteUpdate(routeData);
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  const handleAttractionClick = (place: VisitPoint) => {
    console.log('Attraction clicked:', place);
  };

  const handleInfoPanelCollapse = (collapsed: boolean) => {
    setIsInfoPanelCollapsed(collapsed);
  };

  const handleInputPanelUpdate = (data: FormData) => {
    setRouteData(data);
    setLastRouteData(data);
    if (data.destinationLat && !data.useTicket) {
      setIsDestinationLocked(false);
    }
  };

  const handleMapSelectModeChange = (isSelecting: boolean) => {
    setIsSelectingOnMap(isSelecting);
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileActiveTab(tab);
  };

  const getInputPanelClass = () => {
    if (!isMobile) return '';
    return mobileActiveTab === 'input' ? styles.active : styles.hidden;
  };

  const getInfoPanelClass = () => {
    if (!isMobile) return '';
    return mobileActiveTab === 'info' ? styles.active : styles.hidden;
  };

  const showMapFullscreen = isMobile && mobileActiveTab === 'map';

  useEffect(() => {
    if (isMobile) {
      setMobileActiveTab('input');
    }
  }, [isMobile]);

  

  useEffect(() => {
    const builderData = location.state?.builderFormData as FormData | undefined;
    if (builderData) {
      const expandedAttractions = expandCategoriesToSubOptions(builderData.attractions || []);
      const finalData = {
        ...builderData,
        attractions: expandedAttractions,
      };
      setRouteData(finalData);
      setLastRouteData(finalData);
      handleRouteUpdate(finalData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleRouteUpdate]);

  return (
    <>
      <Header />
      <div className={`${styles.mapPage} ${isInfoPanelCollapsed && !isMobile ? styles.infoHidden : styles.infoVisible} ${isMobile ? styles.mobileLayout : ''}`}>
        
        <div className={`${styles.inputPanelWrapper} ${getInputPanelClass()}`}>
          <InputPanel 
            onRouteUpdate={handleInputPanelUpdate}
            onSearch={handleRouteUpdate}  
            onFormChange={handleFormChange}
            onReset={handleResetLock}
            initialData={routeData}
            isDestinationLocked={isDestinationLocked}
            isSelectingOnMap={isSelectingOnMap}
            setIsDestinationLocked={setIsDestinationLocked}
            onMapSelectModeChange={handleMapSelectModeChange}
            onDestinationSelect={handleDestinationSelect}
          />
        </div>
        
        <div className={`${styles.mapContainer} ${showMapFullscreen ? styles.mapFullscreen : ''}`}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <MapPanel 
            destinationLat={routeData?.destinationLat}
            destinationLng={routeData?.destinationLng}
            destinationName={routeData?.destinationName}
            isHotelTicket={!!routeData?.destinationLat && routeData?.useTicket === true}
            routeResponse={routeResponse}
            isLoading={isLoading}
            isInfoPanelCollapsed={isInfoPanelCollapsed}
            isSelectingMode={isSelectingOnMap}
            onDestinationSelect={handleDestinationSelect}
          />
          
          <RouteUpdateNotification
            show={showNotification}
            onUpdate={handleUpdateRoute}
            onDismiss={handleDismissNotification}
          />
        </div>
        
        <div className={`${styles.infoPanelWrapper} ${getInfoPanelClass()}`}>
          <InfoPanel 
            routeResponse={routeResponse}
            isLoading={isLoading}
            onAttractionClick={handleAttractionClick}
            onCollapseChange={handleInfoPanelCollapse}
          />
        </div>

        {isMobile && (
          <MobileTabBar 
            activeTab={mobileActiveTab}
            onTabChange={handleMobileTabChange}
            hasRouteData={!!routeResponse}
          />
        )}
      </div>
      
    </>
  );
};