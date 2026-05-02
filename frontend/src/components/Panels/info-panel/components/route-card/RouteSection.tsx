import { useMemo } from 'react';
import { RouteGap } from './RouteGap';
import { RouteWalk } from './RouteWalk';
import type { RouteSectionProps } from '../../../../../types';
import type { WalkingSegment } from '../../../../../types';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';

interface ExtendedRouteSectionProps {
  section: RouteSectionProps['section'];
  sectionIndex: number;
  selectedGapId?: string | null;
  onSelectGap?: (gapId: string | null) => void;
  walkingSegments?: WalkingSegment[];
  visitTime?: number;
}

export const RouteSection = ({ 
  section, 
  sectionIndex, 
  selectedGapId, 
  onSelectGap,
  walkingSegments = [],
  visitTime = 0,
}: ExtendedRouteSectionProps) => {
  const { t } = useLocale();

  const handleWalkClick = (walkId: string) => {
    onSelectGap?.(walkId);
  };

  const handleGapClick = (gapId: string) => {
    onSelectGap?.(gapId);
  };

  const getWalkOrder = (walkId: string, numGaps: number): number => {
    if (walkId === 'walk-final-return') {
      return numGaps * 2 + 1000;
    }
    if (walkId.startsWith('walk-to-section') || walkId.startsWith('walk-section')) {
      return 0;
    }
    if (walkId.startsWith('walk-transfer-')) {
      const parts = walkId.split('-');
      const transferIndex = parseInt(parts[parts.length - 1], 10);
      return transferIndex * 2 + 2;
    }
    if (walkId.startsWith('walk-transport-to-cluster')) {
      return numGaps * 2;
    }
    if (walkId.startsWith('walk-cluster-')) {
      const parts = walkId.split('-');
      const clusterIndex = parseInt(parts[parts.length - 1], 10);
      return numGaps * 2 + 1 + clusterIndex;
    }
    return 999;
  };

  const numGaps = section.gaps.length;
  const totalWalkTime = useMemo(() => {
    return walkingSegments.reduce((sum, walk) => sum + (walk.estimatedTime || 0), 0);
  }, [walkingSegments]);


  const totalSectionTime = section.estimatedTimeInMinutes + totalWalkTime + visitTime;

  const items: Array<
    | { type: 'gap'; gap: any; gapIndex: number; order: number; gapId: string }
    | { type: 'walk'; walk: WalkingSegment; order: number }
  > = [];

  section.gaps.forEach((gap, gapIndex) => {
    const gapId = `${sectionIndex}-${gapIndex}`;
    items.push({
      type: 'gap',
      gap,
      gapIndex,
      order: gapIndex * 2 + 1,
      gapId,
    });
  });

  walkingSegments.forEach(walk => {
    items.push({
      type: 'walk',
      walk,
      order: getWalkOrder(walk.id, numGaps),
    });
  });

  items.sort((a, b) => a.order - b.order);

  return (
    <div className={styles.sectionItem}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>
          {t('infoPanel.section')} {sectionIndex + 1}
        </span>
        <span className={styles.sectionTime}>
          {totalSectionTime} {t('infoPanel.min')}
        </span>
      </div>

      {section.numberOfTransfers > 0 && (
        <div className={styles.transferInfo}>
          {t('infoPanel.transfers')}: {section.numberOfTransfers}
        </div>
        
      )}

      <div className={styles.sectionGaps}>
        {items.map((item) => {
          if (item.type === 'gap') {
            const isSelected = selectedGapId === item.gapId;
            return (
              <RouteGap
                key={item.gapId}
                gap={item.gap}
                gapId={item.gapId}
                isSelected={isSelected}
                onSelect={() => handleGapClick(item.gapId)}
              />
            );
          } else {
            const walk = item.walk;
            return (
              <RouteWalk
                key={walk.id}
                walk={{
                  id: walk.id,
                  startPoint: walk.startPoint,
                  endPoint: walk.endPoint,
                  estimatedTime: walk.estimatedTime,
                }}
                walkId={walk.id}
                isSelected={selectedGapId === walk.id}
                onSelect={() => handleWalkClick(walk.id)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};