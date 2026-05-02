// RouteTab.tsx
import { Clock, MapPin, Navigation, Repeat } from 'lucide-react';
import { RouteSection } from './RouteSection';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';
import type { RouteResponse, WalkingSegment } from '../../../../../types';
import { useEffect, useMemo } from 'react';

type RouteTabProps = {
  routeResponse: RouteResponse;
  walkingSegments?: WalkingSegment[];
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
};

export const RouteTab = ({ 
  routeResponse, 
  walkingSegments = [], 
  selectedGapId, 
  onSelectGap 
}: RouteTabProps) => {
  const { t } = useLocale();
  
  const travelTime = routeResponse.sections.reduce(
    (acc, s) => acc + s.estimatedTimeInMinutes, 0
  );
  
  const visitTime = routeResponse.visitPoints.reduce(
    (acc, group) => 
      acc + 
      (group.mainAttraction.estimatedVisitMinutes || 0) +
      group.otherAttractions.reduce((sum, p) => sum + (p.estimatedVisitMinutes || 0), 0),
    0
  );
  
  const totalTime = (travelTime + visitTime) / 60;
  const totalTransfers = routeResponse.sections.reduce(
    (acc, s) => acc + s.numberOfTransfers, 0
  );
  
  const totalPoints = routeResponse.visitPoints.reduce(
    (acc, group) => acc + 1 + group.otherAttractions.length, 0
  );

  const walkingSegmentsBySection = useMemo(() => {
    const grouped: Record<number, WalkingSegment[]> = {};
    walkingSegments.forEach(segment => {
      const idx = segment.sectionIndex;
      if (!grouped[idx]) grouped[idx] = [];
      grouped[idx].push(segment);
    });

    // Переносим финальный возврат (sectionIndex = -1) в последнюю секцию
    const lastSectionIndex = routeResponse.sections.length - 1;
    if (lastSectionIndex >= 0 && grouped[-1]) {
      if (!grouped[lastSectionIndex]) {
        grouped[lastSectionIndex] = [];
      }
      grouped[lastSectionIndex].push(...grouped[-1]);
      delete grouped[-1];
    }

    return grouped;
  }, [walkingSegments, routeResponse.sections.length]);

  useEffect(() => {
    if (selectedGapId) {
      // Небольшая задержка, чтобы DOM успел обновиться после переключения вкладок
      const timer = setTimeout(() => {
        const element = document.getElementById(selectedGapId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-flash');
          setTimeout(() => element.classList.remove('highlight-flash'), 500);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedGapId]);

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
          <span className={styles.value}>{totalPoints}</span>
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
              <RouteSection 
                key={index} 
                section={section} 
                sectionIndex={index}
                selectedGapId={selectedGapId}
                onSelectGap={onSelectGap}
                walkingSegments={walkingSegmentsBySection[index] || []}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};