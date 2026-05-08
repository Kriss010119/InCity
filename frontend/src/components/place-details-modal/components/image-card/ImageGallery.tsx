import type { ImageGalleryProps } from '../../types';
import styles from '../../PlaceDetailsModal.module.css';
import { ImagePlaceholder } from './ImagePlaceholder';

export const ImageGallery = ({ images, placeName, currentIndex, onError }: ImageGalleryProps) => {
  if (images.length === 0) {
    return <ImagePlaceholder icon={null} hasImageTag={false} />;
  }

  return (
    <div className={styles.imageGallery}>
      <img
        key={images[currentIndex]}
        src={images[currentIndex]}
        alt={placeName}
        className={styles.mainImage}
        onError={() => onError(images[currentIndex])}
        loading="lazy"
      />
    </div>
  );
};
