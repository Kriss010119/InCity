import { useLocale } from '../../../../../hooks';
import { AttractionCard } from './AttractionCard';
import type { VisitPoint } from '../../../../../types/types';
import styles from './AttractionCard.module.css';

interface AttractionsTabProps {
  visitPoints: VisitPoint[];
  onAttractionClick: (place: VisitPoint) => void;
  onPlaceSelect: (place: VisitPoint) => void;
}

export const AttractionsTab = ({ 
  visitPoints, 
  onAttractionClick,
  onPlaceSelect 
}: AttractionsTabProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.attractionsTab}>
      <h3 className={styles.title}>{t('infoPanel.attractions')}</h3>
      <p className={styles.attractionsCount}>
        {visitPoints.length} {t('infoPanel.attractionsCount')}
      </p>
      
      <div className={styles.attractionsList}>
        {visitPoints.map((point) => (
          <AttractionCard 
            key={point.id} 
            place={point} 
            onClick={(place) => {
              onPlaceSelect(place);
              onAttractionClick(place);
            }}
          />
        ))}
      </div>
    </div>
  );
};