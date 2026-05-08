import { Loader } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import styles from '../../PlaceDetailsModal.module.css';

interface LoadingStateProps {
  source?: string;
}

export const LoadingState = ({ source }: LoadingStateProps) => {
  const { t } = useLocale();

  return (
    <div className={styles.loading}>
      <Loader size={24} className={styles.spinner} />
      <span>
        {source === 'cache'
          ? t('placeDetails.loading.fromCache')
          : t('placeDetails.loading.loading')}
      </span>
    </div>
  );
};
