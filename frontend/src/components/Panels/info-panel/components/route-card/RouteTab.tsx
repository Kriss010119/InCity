import { Clock, MapPin, Navigation, Repeat } from 'lucide-react';
import { RouteSection } from './RouteSection';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';
import type { RouteResponse } from '../../../../../types/types';

type RouteTabProps = {
  routeResponse: RouteResponse;
};

export const RouteTab = ({ routeResponse }: RouteTabProps) => {
  const { t } = useLocale();
  
  const travelTime = routeResponse.sections.reduce(
    (acc, s) => acc + s.estimatedTimeInMinutes, 0
  );
  
  const visitTime = routeResponse.visitPoints.reduce(
    (acc, point) => acc + (point.estimatedVisitMinutes || 0), 0
  );
  
  const totalTime = (travelTime + visitTime) / 60;

  const totalTransfers = routeResponse.sections.reduce(
    (acc, s) => acc + s.numberOfTransfers, 0
  );

  return (
    <>
      <h3 className={styles.title}>{t('infoPanel.routeInfo')}</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <Clock size={18} />
          <span className={styles.value}>{totalTime.toFixed(1)} {t('infoPanel.hours')}</span>
          <span className={styles.label}>{t('infoPanel.totalTime')}</span>
        </div>
        <div className={styles.stat}>
          <MapPin size={18} />
          <span className={styles.value}>{routeResponse.visitPoints.length}</span>
          <span className={styles.label}>{t('infoPanel.places')}</span>
        </div>
        <div className={styles.stat}>
          <Navigation size={18} />
          <span className={styles.value}>{routeResponse.sections.length}</span>
          <span className={styles.label}>{t('infoPanel.sections')}</span>
        </div>
        <div className={styles.stat}>
          <Repeat size={18} />
          <span className={styles.value}>{totalTransfers}</span>
          <span className={styles.label}>{t('infoPanel.transfers')}</span>
        </div>
      </div>

      {routeResponse.sections.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('infoPanel.detailedRoute')}</h4>
          <div className={styles.sections}>
            {routeResponse.sections.map((section, index) => (
              <RouteSection key={index} section={section} index={index} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};