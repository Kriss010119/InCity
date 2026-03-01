import { useState } from 'react';
import { Loader } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { PlaceDetailsModal } from '../../place-details-modal/PlaceDetailsModal';
import styles from './InfoPanel.module.css';
import type { VisitPoint } from '../../../types/types';
import { AttractionsTab } from './components/attraction-card/AttractionsTab';
import { InfoPanelHeader } from './components/info-card/InfoPanelHeader';
import { InfoPanelTabs } from './components/info-card/InfoPanelTabs';
import { RouteTab } from './components/route-card/RouteTab';
import type { InfoPanelProps, TabType } from './components/types';

export const InfoPanel = ({ 
  routeResponse, 
  isLoading, 
  onAttractionClick,
  onCollapseChange 
}: InfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('route');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<VisitPoint | null>(null);
  const { t } = useLocale();

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const showContent = !isCollapsed && routeResponse;

  return (
    <>
      <div className={`${styles.panel} ${isCollapsed ? styles.panelHidden : ''}`}>
        <InfoPanelHeader isCollapsed={isCollapsed} onCollapse={handleCollapse} />

        {showContent ? (
          <>
            <InfoPanelTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'route' ? (
              <RouteTab routeResponse={routeResponse} />
            ) : (
              <AttractionsTab 
                visitPoints={routeResponse.visitPoints}
                onAttractionClick={onAttractionClick || (() => {})}
                onPlaceSelect={setSelectedPlace}
              />
            )}
          </>
        ) : isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader size={32} className={styles.spinner} />
            <p>{t('infoPanel.loading')}</p>
          </div>
        ) : !isCollapsed && (
          <>
            <h3 className={styles.title}>{t('infoPanel.routeInfo')}</h3>
            <p className={styles.emptyState}>
              {t('infoPanel.emptyState')}
            </p>
          </>
        )}
      </div>

      {selectedPlace && (
        <PlaceDetailsModal 
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </>
  );
};