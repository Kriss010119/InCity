import { Clock } from 'lucide-react';
import { DURATION_OPTIONS } from '../helpers/filterConstants';
import styles from '../InputPanel.module.css';

type DurationSelectorProps = {
  selected: string;
  onChange: (durationId: string) => void;
}

export const DurationSelector = ({ selected, onChange }: DurationSelectorProps) => {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <Clock size={16} />
        <span>Продолжительность</span>
      </label>
      <div className={styles.durationGrid}>
        {DURATION_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`${styles.durationButton} ${
              selected === option.id ? styles.active : ''
            }`}
            onClick={() => onChange(option.id)}
            title={option.description}
          >
            <Clock size={14} />
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};