import { Search } from 'lucide-react';
import styles from '../InputPanel.module.css';

type ActionButtonsProps = {
  onSearch: () => void;
  onReset: () => void;
  isSearchDisabled: boolean;
}

export const ActionButtons = ({ onSearch, onReset, isSearchDisabled }: ActionButtonsProps) => {
  return (
    <div className={styles.buttonGroup}>
      <button 
        onClick={onSearch}
        className={styles.searchButton}
        disabled={isSearchDisabled}
      >
        <Search size={16} />
        Построить маршрут
      </button>

      <button 
        onClick={onReset}
        className={styles.resetButton}
      >
        Сбросить
      </button>
    </div>
  );
};