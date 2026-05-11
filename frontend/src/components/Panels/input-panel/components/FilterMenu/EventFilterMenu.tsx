import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { Portal } from '../../../../portal/Portal';
import { EVENT_TYPES } from '../../../../../constants/filterConstants';
import styles from './FilterMenu.module.css';

type EventFilterMenuProps = {
  selectedEvents: string[];
  onEventChange: (eventIds: string[]) => void;
};

export const EventFilterMenu = ({ selectedEvents, onEventChange }: EventFilterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 400;
      let left = rect.right + 12;
      if (left + menuWidth > window.innerWidth) {
        left = rect.left - menuWidth - 12;
      }
      return {
        top: rect.top + rect.height / 2,
        left: left,
      };
    }
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setMenuPosition(null);
      }
    };
    const handleResize = () => {
      if (isOpen) {
        const pos = calculatePosition();
        setMenuPosition(pos);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen) {
      const pos = calculatePosition();
      setMenuPosition(pos);
    }
    setIsOpen(!isOpen);
    if (isOpen) setMenuPosition(null);
  };

  const handleEventToggle = (eventId: string) => {
    const newSelected = selectedEvents.includes(eventId)
      ? selectedEvents.filter((id) => id !== eventId)
      : [...selectedEvents, eventId];
    onEventChange(newSelected);
  };

  const clearAllEvents = () => {
    onEventChange([]);
  };

  const selectedCount = selectedEvents.length;

  return (
    <div className={styles.filterMenuContainer}>
      <button
        ref={buttonRef}
        className={`${styles.filterButton} ${isOpen ? styles.active : ''} ${selectedCount > 0 ? styles.hasSelection : ''}`}
        onClick={toggleMenu}
        type="button"
      >
        <Calendar size={16} />
        <span>События</span>
        {selectedCount > 0 && <span className={styles.filterBadge}>{selectedCount}</span>}
        <ChevronDown
          size={14}
          className={`${styles.filterChevron} ${isOpen ? styles.rotated : ''}`}
        />
      </button>

      {isOpen && menuPosition && (
        <Portal>
          <div
            className={styles.filterMenuOverlay}
            onClick={() => {
              setIsOpen(false);
              setMenuPosition(null);
            }}
          />
          <div
            ref={menuRef}
            className={styles.filterMenu}
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className={styles.filterMenuHeader}>
              <h4>Типы событий</h4>
              {selectedCount > 0 && (
                <button className={styles.clearAllButton} onClick={clearAllEvents}>
                  <X size={14} />
                  <span>Очистить все</span>
                </button>
              )}
            </div>

            <div className={styles.filterMenuContent}>
              <div className={styles.filterCategory}>
                <div className={styles.filterCategoryTitle}>
                  <Calendar size={16} />
                  <span>Все события</span>
                </div>
                <div className={styles.filterOptions}>
                  {EVENT_TYPES.options.map((option) => (
                    <label key={option.id} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(option.id)}
                        onChange={() => handleEventToggle(option.id)}
                        className={styles.filterCheckbox}
                      />
                      {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                      <span className={styles.filterOptionName}>{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {selectedCount > 0 && (
        <div className={styles.selectedFiltersPreview}>
          {selectedEvents.slice(0, 5).map((id) => {
            const option = EVENT_TYPES.options.find((o) => o.id === id);
            return option ? (
              <span key={id} className={styles.selectedFilterTag}>
                {option.icon && <span className={styles.tagIcon}>{option.icon}</span>}
                {option.name}
                <button onClick={() => handleEventToggle(id)} className={styles.removeFilterTag}>
                  <X size={12} />
                </button>
              </span>
            ) : null;
          })}
          {selectedCount > 5 && <span className={styles.moreFilters}>+{selectedCount - 5}</span>}
        </div>
      )}
    </div>
  );
};
