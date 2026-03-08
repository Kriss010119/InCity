import { Clock } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import type { PlaceHeaderProps } from '../../types';
import styles from '../../PlaceDetailsModal.module.css';

export const PlaceHeader = ({ name, estimatedTime }: PlaceHeaderProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{name}</h2>
      <div className={styles.subtitle}>
        <div className={styles.visitTime}>
          <Clock size={16} />
          <span>
            {t('placeDetails.recommendedTime')}: <strong>{estimatedTime} {t('placeDetails.min')}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};