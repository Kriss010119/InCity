import { Info } from 'lucide-react';
import styles from '../../PlaceDetailsModal.module.css';

type ErrorStateProps = {
  error: string;
};

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className={styles.error}>
      <Info size={16} />
      <span>{error}</span>
    </div>
  );
};