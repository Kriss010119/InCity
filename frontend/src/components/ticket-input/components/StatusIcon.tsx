import { Ticket, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import styles from '../TicketInput.module.css';
import type { StatusIconProps } from '../types';

export const StatusIcon = ({ status }: StatusIconProps) => {
  switch (status) {
    case 'validating':
      return <Loader size={20} className={styles.spinner} />;
    case 'success':
      return <CheckCircle size={20} className={styles.successIcon} />;
    case 'error':
      return <AlertCircle size={20} className={styles.errorIcon} />;
    default:
      return <Ticket size={20} className={styles.ticketIcon} />;
  }
};