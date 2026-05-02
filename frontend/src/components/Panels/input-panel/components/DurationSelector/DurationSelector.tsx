import { Clock } from 'lucide-react';
import { DURATION_OPTIONS } from '../../../../../constants/filterConstants.tsx';
import styles from './DurationSelector.module.css';

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
            <span>{option.name}</span>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};