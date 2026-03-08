import { Globe } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import styles from '../../PlaceDetailsModal.module.css';

interface ActionButtonsProps {
  website?: string;
  wikipediaUrl?: string;
}

export const ActionButtons = ({ website, wikipediaUrl }: ActionButtonsProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.links}>
      {website && (
        <a 
          href={website} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.linkButton}
        >
          <Globe size={18} />
          {t('placeDetails.officialSite')}
        </a>
      )}
      
      {wikipediaUrl && (
        <a 
          href={wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.linkButton} ${styles.outline}`}
        >
          <Globe size={18} />
          {t('placeDetails.wikipedia')}
        </a>
      )}
    </div>
  );
};