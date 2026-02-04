import { AlertCircle } from 'lucide-react';
import styles from './RouteUpdateNotification.module.css';

interface RouteUpdateNotificationProps {
  show: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const RouteUpdateNotification = ({
  show,
  onUpdate,
  onDismiss
}: RouteUpdateNotificationProps) => {
  if (!show) return null;

  return (
    <div className={styles.notification}>
      <AlertCircle size={20} />
      <div className={styles.content}>
        <div className={styles.text}>Параметры маршрута изменились</div>
        <div className={styles.actions}>
          <button onClick={onUpdate} className={styles.updateButton}>
            Обновить маршрут
          </button>
          <button onClick={onDismiss} className={styles.dismissButton}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};