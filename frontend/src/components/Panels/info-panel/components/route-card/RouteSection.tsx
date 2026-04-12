import { RouteGap } from './RouteGap';
import type { RouteSectionProps } from '../types';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';

export const RouteSection = ({ section, index }: RouteSectionProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.sectionItem}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>
          {t('infoPanel.section')} {index + 1}
        </span>
        <span className={styles.sectionTime}>
          {section.estimatedTimeInMinutes} {t('infoPanel.min')}
        </span>
      </div>

      {section.numberOfTransfers > 0 && (
        <div className={styles.transferInfo}>
          {t('infoPanel.transfers')}: {section.numberOfTransfers}
        </div>
      )}
      
      <div className={styles.sectionGaps}>
        {section.gaps.map((gap, gapIndex) => (
          <RouteGap key={gapIndex} gap={gap} />
        ))}
      </div>
      
      
    </div>
  );
};