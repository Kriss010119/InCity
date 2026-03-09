import { CheckCircle } from 'lucide-react';
import type { SuccessMessageProps } from '../types';
import styles from '../TicketInput.module.css';

export const SuccessMessage = ({ message }: SuccessMessageProps) => {
  return (
    <div className={styles.successMessage}>
      <CheckCircle size={14} />
      <span>{message}</span>
    </div>
  );
};