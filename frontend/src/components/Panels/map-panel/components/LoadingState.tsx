import { Loader } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import styles from '../MapPanel.module.css';

export const LoadingState = () => {
  const { t } = useLocale();
  
  return (
    <div className={styles.loadingContainer}>
      <Loader size={48} className={styles.spinner} />
      <p>{t('map.loading')}</p>
    </div>
  );
};