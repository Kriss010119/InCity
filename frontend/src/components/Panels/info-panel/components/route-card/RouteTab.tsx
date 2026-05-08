import { Clock, MapPin, Navigation, Repeat } from 'lucide-react';
import { RouteSection } from './RouteSection';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';
import type { RouteResponse, WalkingSegment } from '../../../../../types';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { extractSectionIndexFromGapId } from './utils';

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
  onSelectGap,
}: RouteTabProps) => {
  const { t } = useLocale();
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const isInternalChange = useRef(false);
  const prevSelectedGapId = useRef<string | null | undefined>(undefined);

  const travelTime = routeResponse.sections.reduce((acc, s) => acc + s.estimatedTimeInMinutes, 0);

  const visitTime = useMemo(() => {
    return routeResponse.visitPoints.reduce(
      (acc, group) => acc + (group.estimatedTimeInMinutes || 0),
      0,
    );
  }, [routeResponse.visitPoints]);

  const totalTime = (travelTime + visitTime) / 60;

  const totalTransfers = routeResponse.sections.reduce((acc, s) => acc + s.numberOfTransfers, 0);

  const totalPoints = routeResponse.visitPoints.reduce(
    (acc, group) => acc + 1 + group.otherAttractions.length,
    0,
  );

  const walkingSegmentsBySection = useMemo(() => {
    const grouped: Record<number, WalkingSegment[]> = {};
    walkingSegments.forEach((segment) => {
      const idx = segment.sectionIndex;
      if (!grouped[idx]) grouped[idx] = [];
      grouped[idx].push(segment);
    });

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

  const getVisitTimeForSection = (sectionIndex: number): number => {
    const visitPoints = routeResponse.visitPoints;
    if (sectionIndex >= visitPoints.length) return 0;

    const group = visitPoints[sectionIndex];
    if (!group) return 0;

    return group.estimatedTimeInMinutes || 0;
  };

  const getSectionFromGapId = useCallback((gapId: string): number | null => {
    const sectionMatch = gapId.match(/^section-(\d+)$/);
    if (sectionMatch) {
      return parseInt(sectionMatch[1], 10);
    }
    const sectionIndex = extractSectionIndexFromGapId(gapId);
    return sectionIndex !== -1 ? sectionIndex : null;
  }, []);

  const handleSectionClick = useCallback(
    (sectionIndex: number) => {
      isInternalChange.current = true;

      if (selectedSection === sectionIndex) {
        setSelectedSection(null);
        onSelectGap?.(null);
      } else {
        setSelectedSection(sectionIndex);
        onSelectGap?.(`section-${sectionIndex}`);
      }
    },
    [selectedSection, onSelectGap],
  );

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (selectedGapId === prevSelectedGapId.current) {
      return;
    }

    prevSelectedGapId.current = selectedGapId;

    const frameId = requestAnimationFrame(() => {
      if (!selectedGapId) {
        setSelectedSection(null);
      } else {
        const section = getSectionFromGapId(selectedGapId);
        setSelectedSection(section);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [selectedGapId, getSectionFromGapId]);

  useEffect(() => {
    if (!selectedGapId) {
      return;
    }
    const timer = setTimeout(() => {
      const element = document.getElementById(selectedGapId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-flash');
        setTimeout(() => element.classList.remove('highlight-flash'), 500);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedGapId]);

  return (
    <>
      <h3 className={styles.title}>{t('infoPanel.routeInfo')}</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <Clock size={18} />
          <span className={styles.value}>
            {totalTime.toFixed(1)} {t('infoPanel.hours')}
          </span>
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
                visitTime={getVisitTimeForSection(index)}
                isSectionSelected={selectedSection === index}
                onSectionClick={handleSectionClick}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
