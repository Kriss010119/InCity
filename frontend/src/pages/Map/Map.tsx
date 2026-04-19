import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { Header, InfoPanel, RouteUpdateNotification, MapPanel, InputPanel } from '../../components';
import { buildRouteFromOrder, buildRouteFromPoint } from '../../api/routeApi';
import { MobileTabBar, type MobileTab } from '../../components/MobileTabBar/MobileTabBar';

import { useTicket } from '../../context/TicketContext';
import type { FormData } from '../../components/Panels/input-panel/helpers/types';
import type { RouteResponse, VisitPoint } from '../../types/types';
import styles from './Map.module.css';

export const Map = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [routeData, setRouteData] = useState<FormData | null>(null);
  const [lastRouteData, setLastRouteData] = useState<FormData | null>(null);
  const [isDestinationLocked, setIsDestinationLocked] = useState(false);
  const [routeResponse, setRouteResponse] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('input');
  const [isMobile, setIsMobile] = useState(false);
  
  const location = useLocation();
  const { ticketData, clearTicketData } = useTicket();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      console.log('📱 Is mobile:', mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (routeResponse && isMobile) {
      console.log('🗺️ Route received, switching to map tab');
      setMobileActiveTab('map');
    }
  }, [routeResponse, isMobile]);

  useEffect(() => {
    console.log('📱 Mobile active tab changed to:', mobileActiveTab);
  }, [mobileActiveTab]);

  const handleResetLock = () => {
    setRouteData(null);
    setLastRouteData(null);
    setRouteResponse(null);
    setIsDestinationLocked(false);
    setError(null);
    setShowNotification(false);
    setIsSelectingOnMap(false);
    clearTicketData();
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
    console.log('🔄 Mobile tab changing to:', tab);
    setMobileActiveTab(tab);
  };

  const getInputPanelClass = () => {
    if (!isMobile) return '';
    console.log('📱 Getting input panel class, activeTab:', mobileActiveTab);
    return mobileActiveTab === 'input' ? styles.active : styles.hidden;
  };

  const getInfoPanelClass = () => {
    if (!isMobile) return '';
    console.log('📱 Getting info panel class, activeTab:', mobileActiveTab);
    return mobileActiveTab === 'info' ? styles.active : styles.hidden;
  };

  const showMapFullscreen = isMobile && mobileActiveTab === 'map';

   useEffect(() => {
    if (isMobile) {
      setMobileActiveTab('input');
    }
  }, [isMobile]);

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