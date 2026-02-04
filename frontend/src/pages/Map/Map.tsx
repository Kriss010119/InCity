import { useState } from 'react';
import { Footer, Header, InfoPanel, InputPanel, RouteUpdateNotification, SimpleMap } from '../../components';
import styles from './Map.module.css';
import { type FormData } from '../../types/types';


export const Map = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [routeData, setRouteData] = useState<FormData | null>(null);
  const [lastRouteData, setLastRouteData] = useState<FormData | null>(null);

  const handleRouteUpdate = (data: FormData) => {
    setRouteData(data);
    setLastRouteData(data);
    setShowNotification(false);
  };

  const handleFormChange = () => {
    if (lastRouteData) setShowNotification(true);
  };

  const handleUpdateRoute = () => {
    if (routeData) handleRouteUpdate(routeData);
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <Header />
      <div className={styles.mapPage}>
        <InputPanel 
          onRouteUpdate={handleRouteUpdate}
          onFormChange={handleFormChange}
        />
        
        <div className={styles.mapContainer}>
          <SimpleMap />
          
          <RouteUpdateNotification
            show={showNotification}
            onUpdate={handleUpdateRoute}
            onDismiss={handleDismissNotification}
          />
        </div>
        
        <InfoPanel routeData={routeData} />
      </div>
      <Footer />
    </>
  );
};