import { usePlaceDetails } from '../../../../../hooks/usePlaceDetails';
import type { AttractionCardProps } from '../types';
import styles from '../../InfoPanel.module.css';
import { getCategoryColor } from '../../../../../utils/categoryUtils';
import { useState } from 'react';

export const AttractionCard = ({ place, onClick }: AttractionCardProps) => {
  const { details, isLoading } = usePlaceDetails(place);
  const [imageError, setImageError] = useState(false);
  
  const getImageUrl = (): string | null => {
    if (!imageError && details.images && details.images.length > 0) {
      return details.images[0];
    }
    const imageTag = place.tags.find(tag => tag.startsWith('image='));
    if (imageTag && !imageError) {
      return imageTag.split('=')[1];
    }
    return null;
  };

  const getAddress = (): string => {
    if (details.address) {
      return details.address;
    }
    const street = place.tags.find(tag => tag.startsWith('addr:street='))?.split('=')[1];
    const house = place.tags.find(tag => tag.startsWith('addr:housenumber='))?.split('=')[1];
    if (street && house) {
      return `${street}, ${house}`;
    }
    if (street) {
      return street;
    }
    return '';
  };

  const imageUrl = getImageUrl();
  const address = getAddress();
  const categoryColor = getCategoryColor(place.category);

  return (
    <div 
      className={styles.attractionCard} 
      onClick={() => onClick(place)}
    >
      <div className={styles.attractionImageContainer}>
        {imageUrl && !isLoading ? (
          <img 
            src={imageUrl} 
            alt={place.name}
            className={styles.attractionImage}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.attractionImagePlaceholder}>
            {isLoading ? '...' : 'Фото'}
          </div>
        )}
      </div>
      
      <div className={styles.attractionInfo}>
        <h4 className={styles.attractionName}>{place.name}</h4>
        
        <div className={styles.attractionMeta}>
          <span 
            className={styles.attractionCategory}
            style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
          >
            {place.subcategory || place.category}
          </span>
          
          <span className={styles.attractionTime}>
            {place.estimatedVisitMinutes} мин
          </span>
        </div>
        
        {address && (
          <div className={styles.attractionAddress}>
            {address}
          </div>
        )}
        
        {details.wikipediaExtract && (
          <p className={styles.attractionExcerpt}>
            {details.wikipediaExtract.length > 100 
              ? details.wikipediaExtract.substring(0, 100) + '...' 
              : details.wikipediaExtract}
          </p>
        )}
      </div>
    </div>
  );
};