import { AlertCircle } from 'lucide-react';
import styles from './RouteUpdateNotification.module.css';
import { useLocale } from '../../hooks';

type RouteUpdateNotificationProps = {
  show: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

export const RouteUpdateNotification = ({
  show,
  onUpdate,
  onDismiss,
}: RouteUpdateNotificationProps) => {
  const { t } = useLocale();

  if (!show) return null;

  return (
    <div className={styles.notification}>
      <AlertCircle size={20} />
      <div className={styles.content}>
        <div className={styles.text}>{t('notification.routeChanged')}</div>
        <div className={styles.actions}>
          <button onClick={onUpdate} className={styles.updateButton}>
            {t('notification.update')}
          </button>
          <button onClick={onDismiss} className={styles.dismissButton}>
            {t('notification.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
