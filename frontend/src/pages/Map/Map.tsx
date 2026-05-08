import { useEffect, useCallback, useReducer, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { Header, InfoPanel, RouteUpdateNotification, MapPanel, InputPanel } from '../../components';
import { buildRouteFromOrder, buildRouteFromPoint } from '../../api/routeApi';
import { MobileTabBar, type MobileTab } from '../../components/MobileTabBar/MobileTabBar';
import { useTicket } from '../../context/TicketContext';
import type { VisitPoint, FormData } from '../../types';
import { extractWalkingSegmentsForInfoPanel } from '../../components/Panels/map-panel/utils';
import { STORAGE_KEYS } from '../../constants/map.ts';
import {
  mapReducer,
  getInitialState,
  saveToStorage,
  expandCategoriesToSubOptions,
} from './mapReducer.ts';

import styles from './Map.module.css';

export const Map = () => {
  const [state, dispatch] = useReducer(mapReducer, null, getInitialState);
  const location = useLocation();
  const { ticketData, clearTicketData } = useTicket();
  const isFirstRender = useRef(true);

  const {
    routeData,
    lastRouteData,
    isDestinationLocked,
    routeResponse,
    isLoading,
    error,
    isInfoPanelCollapsed,
    isSelectingOnMap,
    mobileActiveTab,
    isMobile,
    walkingSegments,
    selectedGapId,
    activeTab,
    showNotification,
  } = state;

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

  useEffect(() => {
    if (routeResponse && routeData?.destinationLat && routeData?.destinationLng) {
      const walks = extractWalkingSegmentsForInfoPanel(
        routeResponse,
        routeData.destinationLat,
        routeData.destinationLng,
      );
      dispatch({ type: 'SET_WALKING_SEGMENTS', payload: walks });
    }
  }, [routeResponse, routeData?.destinationLat, routeData?.destinationLng]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      dispatch({ type: 'SET_IS_MOBILE', payload: mobile });

      if (mobile && !isFirstRender.current) {
        dispatch({ type: 'SET_MOBILE_ACTIVE_TAB', payload: 'input' });
      }
      isFirstRender.current = false;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (routeResponse && isMobile) {
      dispatch({ type: 'SET_MOBILE_ACTIVE_TAB', payload: 'map' });
    }
  }, [routeResponse, isMobile]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ROUTE_DATA);
    localStorage.removeItem(STORAGE_KEYS.ROUTE_RESPONSE);
    localStorage.removeItem(STORAGE_KEYS.IS_DESTINATION_LOCKED);
    localStorage.removeItem(STORAGE_KEYS.LAST_ROUTE_DATA);
  }, []);

  const handleRouteUpdate = useCallback(
    async (data: FormData) => {
      console.log('📡 handleRouteUpdate received data:', data);

      if (!data.to || !data.date) {
        console.log('⚠️ Missing to or date', { to: data.to, date: data.date });
        return;
      }

      if (!data.destinationLat || !data.destinationLng) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            'Не указаны координаты точки назначения. Используйте выбор на карте или введите адрес через автодополнение.',
        });
        return;
      }

      dispatch({ type: 'HANDLE_ROUTE_UPDATE_START', payload: data });

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
            data.events,
          );
        } else {
          response = await buildRouteFromPoint(data);
        }

        console.log('     📡 Route response received:', response);
        dispatch({ type: 'HANDLE_ROUTE_UPDATE_SUCCESS', payload: response });
      } catch (err) {
        console.error('❌ Error building route:', err);
        dispatch({
          type: 'HANDLE_ROUTE_UPDATE_ERROR',
          payload: err instanceof Error ? err.message : 'Ошибка при построении маршрута',
        });
        localStorage.removeItem(STORAGE_KEYS.ROUTE_RESPONSE);
      }
    },
    [ticketData],
  );

  useEffect(() => {
    if (location.state?.autoFill && ticketData?.ticketDetails) {
      const { ticketDetails } = ticketData;

      const initialFormData: FormData = {
        to:
          ticketDetails.orderType === 'train'
            ? ticketDetails.details.arrivalStationCode === '2000000'
              ? 'Москва'
              : 'Санкт-Петербург'
            : ticketDetails.details.hotelName,
        date:
          ticketDetails.orderType === 'train'
            ? ticketDetails.details.departureDate
            : ticketDetails.details.checkIn.split('T')[0],
        transport: ['metro', 'bus'],
        attractions: [],
        events: [],
        duration: 'medium',
        destinationLat:
          ticketDetails.orderType === 'hotel'
            ? ticketDetails.details.coordinates.latitude
            : undefined,
        destinationLng:
          ticketDetails.orderType === 'hotel'
            ? ticketDetails.details.coordinates.longitude
            : undefined,
        destinationName:
          ticketDetails.orderType === 'hotel' ? ticketDetails.details.hotelName : undefined,
        useTicket: true,
      };

      dispatch({ type: 'INITIALIZE_FROM_TICKET', payload: initialFormData });
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
        useTicket: customRoute.useTicket,
      };

      dispatch({ type: 'INITIALIZE_FROM_CUSTOM_ROUTE', payload: initialFormData });
      handleRouteUpdate(initialFormData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, ticketData, handleRouteUpdate]);

  useEffect(() => {
    const builderData = location.state?.builderFormData as FormData | undefined;
    if (builderData) {
      const expandedAttractions = expandCategoriesToSubOptions(builderData.attractions || []);
      const finalData = {
        ...builderData,
        attractions: expandedAttractions,
      };
      dispatch({ type: 'INITIALIZE_FROM_BUILDER', payload: finalData });
      handleRouteUpdate(finalData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleRouteUpdate]);

  const handleResetLock = () => {
    dispatch({ type: 'RESET_ALL' });
    clearTicketData();
    clearSavedData();
  };

  const handleDestinationSelect = async (lat: number, lng: number, address?: string) => {
    if (!lat && !lng) {
      dispatch({
        type: 'SET_ROUTE_DATA',
        payload: routeData
          ? {
              ...routeData,
              destinationLat: undefined,
              destinationLng: undefined,
              destinationName: undefined,
              to: '',
            }
          : null,
      });
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
      useTicket: false,
    };

    dispatch({ type: 'SET_ROUTE_DATA', payload: updatedRouteData });
    dispatch({ type: 'SET_LAST_ROUTE_DATA', payload: updatedRouteData });
    dispatch({ type: 'SET_DESTINATION_LOCKED', payload: false });
    dispatch({ type: 'SET_SELECTING_ON_MAP', payload: false });

    if (updatedRouteData.date) {
      await handleRouteUpdate(updatedRouteData);
    }
  };

  const handleSelectGap = useCallback(
    (gapId: string | null) => {
      dispatch({ type: 'SET_SELECTED_GAP_ID', payload: gapId });
      if (gapId) {
        if (state.isInfoPanelCollapsed) {
          dispatch({ type: 'SET_INFO_PANEL_COLLAPSED', payload: false });
        }
        if (state.activeTab !== 'route') {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'route' });
        }
      }
    },
    [state.isInfoPanelCollapsed, state.activeTab],
  );

  const handleFormChange = () => {
    if (lastRouteData) {
      dispatch({ type: 'SET_SHOW_NOTIFICATION', payload: true });
    }
  };

  const handleUpdateRoute = () => {
    if (routeData) handleRouteUpdate(routeData);
  };

  const handleDismissNotification = () => {
    dispatch({ type: 'SET_SHOW_NOTIFICATION', payload: false });
  };

  const handleAttractionClick = (place: VisitPoint) => {
    console.log('Attraction clicked:', place);
  };

  const handleInfoPanelCollapse = (collapsed: boolean) => {
    dispatch({ type: 'SET_INFO_PANEL_COLLAPSED', payload: collapsed });
  };

  const handleInputPanelUpdate = (data: FormData) => {
    dispatch({ type: 'UPDATE_ROUTE_DATA', payload: data });
    if (data.destinationLat && !data.useTicket) {
      dispatch({ type: 'SET_DESTINATION_LOCKED', payload: false });
    }
  };

  const handleMapSelectModeChange = (isSelecting: boolean) => {
    dispatch({ type: 'SET_SELECTING_ON_MAP', payload: isSelecting });
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    dispatch({ type: 'SET_MOBILE_ACTIVE_TAB', payload: tab });
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

  return (
    <>
      <Header />
      <div
        className={`${styles.mapPage} ${isInfoPanelCollapsed && !isMobile ? styles.infoHidden : styles.infoVisible} ${isMobile ? styles.mobileLayout : ''}`}
      >
        <div className={`${styles.inputPanelWrapper} ${getInputPanelClass()}`}>
          <InputPanel
            onRouteUpdate={handleInputPanelUpdate}
            onSearch={handleRouteUpdate}
            onFormChange={handleFormChange}
            onReset={handleResetLock}
            initialData={routeData}
            isDestinationLocked={isDestinationLocked}
            isSelectingOnMap={isSelectingOnMap}
            setIsDestinationLocked={(locked) =>
              dispatch({ type: 'SET_DESTINATION_LOCKED', payload: locked })
            }
            onMapSelectModeChange={handleMapSelectModeChange}
            onDestinationSelect={handleDestinationSelect}
          />
        </div>

        <div className={`${styles.mapContainer} ${showMapFullscreen ? styles.mapFullscreen : ''}`}>
          {error && <div className={styles.errorMessage}>{error}</div>}

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
            selectedGapId={selectedGapId}
            onSelectGap={handleSelectGap}
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
            selectedGapId={selectedGapId}
            onSelectGap={handleSelectGap}
            walkingSegments={walkingSegments}
            activeTab={activeTab}
            onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}
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
