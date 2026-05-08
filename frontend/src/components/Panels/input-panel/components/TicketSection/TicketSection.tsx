// components/InputPanel/TicketSection.tsx
import { Ticket, X } from 'lucide-react';
import { useTicket } from '../../../../../context/TicketContext';
import styles from './TicketSection.module.css';

type TicketSectionProps = {
  ticketNumber: string;
  setTicketNumber: (value: string) => void;
  ticketError: string;
  onTicketApply: () => void;
  onTicketRemove: () => void;
  isDestinationLocked?: boolean;
};

export const TicketSection = ({
  ticketNumber,
  setTicketNumber,
  ticketError,
  onTicketApply,
  onTicketRemove,
  isDestinationLocked,
}: TicketSectionProps) => {
  const { ticketData } = useTicket();

  return (
    <div className={styles.ticketSection}>
      <label className={styles.label}>
        <Ticket size={16} />
        <span>Билет Т-Путешествий</span>
      </label>

      {!ticketData ? (
        <div className={styles.ticketInputWrapper}>
          <input
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="Введите номер билета"
            className={styles.ticketInput}
            disabled={isDestinationLocked}
          />
          <button
            onClick={onTicketApply}
            className={styles.ticketApplyButton}
            disabled={!ticketNumber.trim() || isDestinationLocked}
          >
            Применить
          </button>
          {ticketError && <span className={styles.ticketError}>{ticketError}</span>}
        </div>
      ) : (
        <div className={styles.ticketActive}>
          <div className={styles.ticketInfo}>
            <span className={styles.ticketNumber}>{ticketData.ticketNumber}</span>
          </div>
          <button
            onClick={onTicketRemove}
            className={styles.ticketRemoveButton}
            title="Удалить билет"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
