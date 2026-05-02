import { useState } from 'react';
import { Loader } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { PlaceDetailsModal } from '../../place-details-modal/PlaceDetailsModal';
import styles from './InfoPanel.module.css';
import type { InfoPanelProps, TabType, VisitPoint } from '../../../types';

import type { WalkingSegment } from '../../../types';
import { AttractionsTab } from './components/attraction-card/AttractionsTab';
import { InfoPanelHeader } from './components/info-card/InfoPanelHeader';
import { InfoPanelTabs } from './components/info-card/InfoPanelTabs';
import { RouteTab } from './components/route-card/RouteTab';

interface ExtendedInfoPanelProps extends InfoPanelProps {
  walkingSegments?: WalkingSegment[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
}

export const InfoPanel = ({ 
  routeResponse, 
  walkingSegments = [],
  isLoading, 
  onAttractionClick,
  onCollapseChange,
  selectedGapId,
  onSelectGap,
  activeTab,
  onTabChange,
}: ExtendedInfoPanelProps) => {
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
    <div className={`${styles.panel} ${isCollapsed ? styles.panelHidden : ''}`}>
      <InfoPanelHeader isCollapsed={isCollapsed} onCollapse={handleCollapse} />

      {!isCollapsed && (
        <>
          {showContent ? (
            <>
              <InfoPanelTabs activeTab={activeTab} onTabChange={onTabChange} />
              {activeTab === 'route' ? (
                <RouteTab 
                  routeResponse={routeResponse} 
                  walkingSegments={walkingSegments}
                  selectedGapId={selectedGapId}
                  onSelectGap={onSelectGap}
                />
              ) : (
                <AttractionsTab 
                  visitPointGroups={routeResponse.visitPoints}
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
          ) : (
            <>
              <h3 className={styles.title}>{t('infoPanel.routeInfo')}</h3>
              <p className={styles.emptyState}>{t('infoPanel.emptyState')}</p>
            </>
          )}
        </>
      )}

      {selectedPlace && (
        <PlaceDetailsModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </div>
  );
};