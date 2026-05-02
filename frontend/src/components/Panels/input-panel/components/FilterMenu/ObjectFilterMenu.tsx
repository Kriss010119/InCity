import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, X } from 'lucide-react';
import { Portal } from '../../../../portal/Portal';
import { OBJECT_CATEGORIES } from '../../../../../constants/filterConstants.tsx';
import styles from './FilterMenu.module.css';

type ObjectFilterMenuProps = {
  selectedFilters: string[];
  onFilterChange: (filterIds: string[]) => void;
};

export const ObjectFilterMenu = ({ selectedFilters, onFilterChange }: ObjectFilterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 480;
      
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
    if (isOpen) {
      setMenuPosition(null);
    }
  };

  const handleFilterToggle = (filterId: string) => {
    const newSelected = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId];
    onFilterChange(newSelected);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const selectedCount = selectedFilters.length;

  return (
    <div className={styles.filterMenuContainer}>
      <button
        ref={buttonRef}
        className={`${styles.filterButton} ${isOpen ? styles.active : ''} ${selectedCount > 0 ? styles.hasSelection : ''}`}
        onClick={toggleMenu}
        type="button"
      >
        <Building2 size={16} />
        <span>Объекты</span>
        {selectedCount > 0 && (
          <span className={styles.filterBadge}>{selectedCount}</span>
        )}
        <ChevronDown size={14} className={`${styles.filterChevron} ${isOpen ? styles.rotated : ''}`} />
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
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <div className={styles.filterMenuHeader}>
              <h4>Типы объектов</h4>
              {selectedCount > 0 && (
                <button className={styles.clearAllButton} onClick={clearAllFilters}>
                  <X size={14} />
                  <span>Очистить все</span>
                </button>
              )}
            </div>

            <div className={styles.filterMenuContent}>
              {OBJECT_CATEGORIES.map(category => (
                <div key={category.id} className={styles.filterCategory}>
                  <div className={styles.filterCategoryTitle}>
                    {category.icon && <span className={styles.categoryIcon}>{category.icon}</span>}
                    <span>{category.name}</span>
                  </div>
                  <div className={styles.filterOptions}>
                    {category.options.map(option => (
                      <label key={option.id} className={styles.filterOption}>
                        <input
                          type="checkbox"
                          checked={selectedFilters.includes(option.id)}
                          onChange={() => handleFilterToggle(option.id)}
                          className={styles.filterCheckbox}
                        />
                        {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                        <span className={styles.filterOptionName}>{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Portal>
      )}

      {selectedCount > 0 && (
        <div className={styles.selectedFiltersPreview}>
          {selectedFilters.slice(0, 5).map(id => {
            let option = null;
            for (const category of OBJECT_CATEGORIES) {
              const found = category.options.find(o => o.id === id);
              if (found) {
                option = found;
                break;
              }
            }
            return option ? (
              <span key={id} className={styles.selectedFilterTag}>
                {option.icon && <span className={styles.tagIcon}>{option.icon}</span>}
                {option.name}
                <button onClick={() => handleFilterToggle(id)} className={styles.removeFilterTag}>
                  <X size={12} />
                </button>
              </span>
            ) : null;
          })}
          {selectedCount > 5 && (
            <span className={styles.moreFilters}>+{selectedCount - 5}</span>
          )}
        </div>
      )}
    </div>
  );
};