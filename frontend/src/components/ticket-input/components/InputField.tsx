import { StatusIcon } from './StatusIcon';
import type { InputFieldProps } from '../types';
import styles from '../TicketInput.module.css';

export const InputField = ({ 
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onClear,
  placeholder,
  disabled,
  status
}: InputFieldProps) => {
  return (
    <div className={styles.inputWrapper}>
      <StatusIcon status={status} />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={styles.ticketInput}
        disabled={disabled}
        aria-label={placeholder}
        autoComplete="off"
      />

      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClear}
          aria-label="Очистить"
        >
          ✕
        </button>
      )}
    </div>
  );
};