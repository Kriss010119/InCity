import { Star, CalendarDays } from 'lucide-react';
import type { CheckboxOption } from '../helpers/types';
import styles from '../InputPanel.module.css';

type CheckboxGroupProps = {
  title: string;
  icon: 'star' | 'calendar';
  options: CheckboxOption[];
  selected: string[];
  onToggle: (id: string) => void;
}

const ICONS = {
  star: Star,
  calendar: CalendarDays
};

export const CheckboxGroup = ({
  title,
  icon,
  options,
  selected,
  onToggle
}: CheckboxGroupProps) => {
  const Icon = ICONS[icon];

  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <Icon size={16} />
        <span>{title}</span>
      </label>
      <div className={styles.checkboxGrid}>
        {options.map(option => (
          <label key={option.id} className={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
              className={styles.checkbox}
            />
            <span className={styles.checkboxLabel}>{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};