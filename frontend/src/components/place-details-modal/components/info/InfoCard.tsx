import type { InfoCardProps } from '../../types';
import styles from '../../PlaceDetailsModal.module.css';

export const InfoCard = ({ icon, title, children }: InfoCardProps) => {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoHeader}>
        {icon}
        <span>{title}</span>
      </div>
      <div className={styles.infoContent}>{children}</div>
    </div>
  );
};
