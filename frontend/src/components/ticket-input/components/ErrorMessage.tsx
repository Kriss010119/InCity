import { AlertCircle } from 'lucide-react';
import styles from '../TicketInput.module.css';
import type { ErrorMessageProps } from '../types';

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className={styles.errorMessage}>
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  );
};