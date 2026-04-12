import { useEffect, useState, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Portal } from '../../../../portal/Portal';
import { WEEKDAYS } from '../../helpers/constants';
import styles from './DatePicker.module.css';

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  isEnabled: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export const DatePicker = ({ 
  value, 
  onChange, 
  isEnabled,
  onOpen,
  onClose
}: DatePickerProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 7 : firstDay;
  };

  const calculatePosition = () => {
    const dateInput = document.querySelector(`.${styles.dateInput}`);
    if (dateInput) {
      const rect = dateInput.getBoundingClientRect();
      const calendarWidth = 320;
      let left = rect.right + 12;
      
      if (left + calendarWidth > window.innerWidth) {
        left = rect.left - calendarWidth - 12;
      }
      
      return {
        top: rect.top + rect.height / 2,
        left: left,
      };
    }
    return null;
  };

  useEffect(() => {
    const handleResize = () => {
      if (showCalendar) {
        const pos = calculatePosition();
        setCalendarPosition(pos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showCalendar]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const selectedDate = new Date(year, month, day);
    const yearStr = selectedDate.getFullYear();
    const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${yearStr}-${monthStr}-${dayStr}`;
    
    onChange(formattedDate);
    setShowCalendar(false);
    setCalendarPosition(null);
    onClose?.();
  };

  const handleDateClick = () => {
    if (isEnabled) {
      const pos = calculatePosition();
      setCalendarPosition(pos);
      setShowCalendar(true);
      onOpen?.();
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isSelectedDay = (day: number) => {
    if (!value) return false;
    const [year, month, dayStr] = value.split('-').map(Number);
    return year === currentMonth.getFullYear() && 
           month === currentMonth.getMonth() + 1 &&
           day === dayStr;
  };

  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <Calendar size={16} />
        <span>Дата</span>
      </label>
      <div className={styles.datePickerWrapper}>
        <div 
          className={`${styles.dateInput} ${!isEnabled ? styles.inputDisabled : ''}`}
          onClick={handleDateClick}
        >
          <span className={value ? styles.dateValue : styles.datePlaceholder}>
            {value ? formatDateDisplay(value) : 'Выберите дату'}
          </span>
          <Calendar size={16} className={styles.calendarIcon} />
        </div>
        
        {showCalendar && calendarPosition && (
          <Portal>
            <div 
              className={styles.calendarOverlay} 
              onClick={() => {
                setShowCalendar(false);
                setCalendarPosition(null);
                onClose?.();
              }} 
            />
            <div 
              className={styles.calendarDropdown} 
              ref={calendarRef}
              style={{
                top: `${calendarPosition.top}px`,
                left: `${calendarPosition.left}px`,
              }}
            >
              <div className={styles.calendarHeader}>
                <button onClick={handlePrevMonth} className={styles.calendarNav}>
                  <ChevronLeft size={18} />
                </button>
                <span className={styles.calendarMonth}>
                  {currentMonth.toLocaleDateString('ru-RU', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <button onClick={handleNextMonth} className={styles.calendarNav}>
                  <ChevronRight size={18} />
                </button>
              </div>
              
              <div className={styles.calendarWeekdays}>
                {WEEKDAYS.map(day => (
                  <div key={day} className={styles.weekday}>{day}</div>
                ))}
              </div>
              
              <div className={styles.calendarDays}>
                {Array.from({ length: getFirstDayOfMonth(currentMonth) - 1 }, (_, i) => (
                  <div key={`empty-${i}`} className={styles.emptyDay} />
                ))}
                
                {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = isSelectedDay(day);
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  
                  return (
                    <div
                      key={day}
                      className={`${styles.calendarDay} 
                        ${isToday ? styles.today : ''}
                        ${isSelected ? styles.selected : ''}
                        ${isPast ? styles.past : ''}
                      `}
                      onClick={() => !isPast && handleDateSelect(day)}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
};