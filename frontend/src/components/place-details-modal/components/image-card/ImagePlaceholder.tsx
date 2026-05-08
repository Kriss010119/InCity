import { Building2 } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import type { ImagePlaceholderProps } from '../../types';
import styles from '../../PlaceDetailsModal.module.css';

export const ImagePlaceholder = ({ icon, hasImageTag }: ImagePlaceholderProps) => {
  const { t } = useLocale();

  return (
    <div className={styles.imagePlaceholder}>
      {icon || <Building2 size={64} />}
      <span>{t('placeDetails.imageNotFound')}</span>
      {hasImageTag && (
        <span className={styles.placeholderSubtext}>{t('placeDetails.imageFromTags')}</span>
      )}
    </div>
  );
};
