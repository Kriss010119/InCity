import { MapPin } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import styles from '../MapPanel.module.css';

type MapHintProps = {
  isSelectingMode: boolean;
};

export const MapHint = ({ isSelectingMode }: MapHintProps) => {
  const { t } = useLocale();

  if (!isSelectingMode) return null;

  return (
    <div className={styles.mapSelectingHint}>
      <MapPin size={16} />
      <span>{t('map.selectingMode')}</span>
    </div>
  );
};
