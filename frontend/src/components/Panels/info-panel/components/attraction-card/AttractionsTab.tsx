import { useLocale } from '../../../../../hooks';
import { AttractionCard } from './AttractionCard';
import type { VisitPointGroup, VisitPoint } from '../../../../../types/types';
import styles from './AttractionCard.module.css';

interface AttractionsTabProps {
  visitPointGroups: VisitPointGroup[];
  onAttractionClick: (place: VisitPoint) => void;
  onPlaceSelect: (place: VisitPoint) => void;
}

export const AttractionsTab = ({ 
  visitPointGroups, 
  onAttractionClick,
  onPlaceSelect 
}: AttractionsTabProps) => {
  const { t } = useLocale();
  
  const totalPoints = visitPointGroups.reduce(
    (acc, group) => acc + 1 + group.otherAttractions.length,
    0
  );

  return (
    <div className={styles.attractionsTab}>
      <h3 className={styles.title}>{t('infoPanel.attractions')}</h3>
      <p className={styles.attractionsCount}>
        {totalPoints} {t('infoPanel.attractionsCount')}
      </p>
      
      <div className={styles.attractionsList}>
        {visitPointGroups.map((group, idx) => (
          <div key={idx} className={styles.attractionGroup}>
            <AttractionCard 
              place={group.mainAttraction}
              onClick={(place) => {
                onPlaceSelect(place);
                onAttractionClick(place);
              }}
              isMain={true}
            />
            {group.otherAttractions.map((place) => (
              <AttractionCard 
                key={place.id}
                place={place}
                onClick={(place) => {
                  onPlaceSelect(place);
                  onAttractionClick(place);
                }}
                isMain={false}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};