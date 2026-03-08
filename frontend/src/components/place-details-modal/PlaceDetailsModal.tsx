import { useState, useEffect, useMemo, startTransition } from 'react';
import { usePlaceDetails } from '../../hooks/usePlaceDetails';
import type { VisitPoint } from '../../types/types';
import { 
  ModalOverlay, ModalContainer, ImageGallery,
  CategoryBadge, PlaceHeader, LoadingState,
  ErrorState, Description, InfoGrid,
  ActionButtons
} from './components';
import styles from './PlaceDetailsModal.module.css';
import { getWikimediaDirectUrl } from '../../utils/categoryUtils';

type PlaceDetailsModalProps = {
  place: VisitPoint | null;
  onClose: () => void;
};

export const PlaceDetailsModal = ({ place, onClose }: PlaceDetailsModalProps) => {
  const [currentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const { details, isLoading, error } = usePlaceDetails(place);

  const images = useMemo(() => {
    if (!place) return [];
    
    const imageSet = new Set<string>();
    
    place.tags?.forEach(tag => {
      if (tag.startsWith('image=')) {
        const value = tag.substring(6);
        const directUrl = getWikimediaDirectUrl(value);
        if (directUrl) imageSet.add(directUrl);
      }
      
      if (tag.startsWith('wikimedia_commons=')) {
        const value = tag.substring(18);
        const directUrl = getWikimediaDirectUrl(value);
        if (directUrl) imageSet.add(directUrl);
      }
      
      if (tag.startsWith('image:')) {
        const value = tag.split('=')[1];
        if (value) {
          const directUrl = getWikimediaDirectUrl(value);
          if (directUrl) imageSet.add(directUrl);
        }
      }
    });
    
    details.images?.forEach(img => imageSet.add(img));
    
    return Array.from(imageSet);
  }, [place, details.images]);

  useEffect(() => {
    startTransition(() => {
      setImageError({});
    });
  }, [place?.id]);

  if (!place) return null;

  const availableImages = images.filter(img => !imageError[img]);

  const handleImageError = (imageUrl: string) => {
    console.log('Image failed to load:', imageUrl);
    setImageError(prev => ({ ...prev, [imageUrl]: true }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContainer>
        <div className={styles.imageGallery}>
          <ImageGallery 
            images={availableImages}
            placeName={place.name}
            currentIndex={currentImageIndex}
            onError={handleImageError}
          />
          
          <CategoryBadge category={place.category} subcategory={place.subcategory} />
        </div>

        <div className={styles.content}>
          <PlaceHeader name={place.name} estimatedTime={place.estimatedVisitMinutes} />

          {isLoading && <LoadingState source={details.source} />}
          {error && <ErrorState error={error} />}

          {(details.wikipediaExtract || details.description) && (
            <Description 
              text={details.wikipediaExtract || details.description || ''}
              wikipediaUrl={details.wikipediaUrl}
            />
          )}

          <InfoGrid place={place} details={details} />

          <div className={styles.actions}>
            <ActionButtons 
              website={details.website} 
              wikipediaUrl={details.wikipediaUrl}
            />
          </div>
        </div>
      </ModalContainer>
    </ModalOverlay>
  );
};