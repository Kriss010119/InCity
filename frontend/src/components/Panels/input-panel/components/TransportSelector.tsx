import { Navigation } from 'lucide-react';
import { TRANSPORT_OPTIONS } from '../helpers/constants';
import styles from '../InputPanel.module.css';

type TransportSelectorProps = {
  selected: string[];
  onToggle: (transportId: string) => void;
}

export const TransportSelector = ({ selected, onToggle }: TransportSelectorProps) => {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <Navigation size={16} />
        <span>Транспорт</span>
      </label>
      <div className={styles.transportGrid}>
        {TRANSPORT_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`${styles.transportButton} ${
              selected.includes(option.id) ? styles.active : ''
            }`}
            onClick={() => onToggle(option.id)}
          >
            {option.icon}
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};