import { useLocale } from '../../../hooks/useLocale';
import type { SubmitButtonProps } from '../types';
import styles from '../TicketInput.module.css';

export const SubmitButton = ({ onClick, disabled, isChecking }: SubmitButtonProps) => {
  const { t } = useLocale();
  
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled}
      className={styles.submitButton}
    >
      {isChecking ? t('ticket.checking') : t('ticket.button')}
    </button>
  );
};