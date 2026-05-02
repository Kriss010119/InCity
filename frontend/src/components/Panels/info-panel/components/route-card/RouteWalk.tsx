import { Footprints } from 'lucide-react';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';

interface RouteWalkProps {
  walk: {
    id: string;
    startPoint: { name: string; lat: number; lng: number };
    endPoint: { name: string; lat: number; lng: number };
    estimatedTime?: number;
  };
  walkId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteWalk = ({ walk, walkId, isSelected, onSelect }: RouteWalkProps) => {
  const { t } = useLocale();
  
  return (
    <div 
      id={walkId}
      className={`${styles.gap} ${isSelected ? styles.active : ''} ${styles.walkGap}`}
      onClick={() => onSelect()}
      data-gap-id={walkId}
    >
      <div className={styles.gapHeader}>
        <div className={styles.gapTransport}>
          <Footprints size={16} className={styles.transportIcon} />
          <span className={styles.gapRouteNumber}>
            {t('infoPanel.walking')}
            {walk.estimatedTime && ` • ${walk.estimatedTime} ${t('infoPanel.min')}`}
          </span>
        </div>
      </div>
      
      <div className={styles.walkRoute}>
        <span className={styles.walkPoint}>{walk.startPoint.name}</span>
        <span className={styles.walkArrow}>→</span>
        <span className={styles.walkPoint}>{walk.endPoint.name}</span>
      </div>
    </div>
  );
};