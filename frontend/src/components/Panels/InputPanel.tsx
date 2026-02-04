import { useState } from 'react';
import { MapPin, Calendar, Train, Bus, Navigation, Star, CalendarDays } from 'lucide-react';
import styles from './InputPanel.module.css';

interface FormData {
  from: string;
  to: string;
  date: string;
  transport: string[];
  attractions: string[];
  events: string[];
}

interface InputPanelProps {
  onRouteUpdate: (data: FormData) => void;
  onFormChange: () => void;
}

export const InputPanel = ({ onRouteUpdate, onFormChange }: InputPanelProps) => {
  const [formData, setFormData] = useState<FormData>({
    from: '',
    to: '',
    date: '',
    transport: ['метро', 'автобус'],
    attractions: [],
    events: []
  });

  const transportOptions = [
    { id: 'metro', name: 'метро', icon: <Train size={16} /> },
    { id: 'bus', name: 'автобус', icon: <Bus size={16} /> },
    { id: 'tram', name: 'трамвай', icon: <Bus size={16} /> },
    { id: 'trolleybus', name: 'троллейбус', icon: <Bus size={16} /> },
    { id: 'train', name: 'поезд', icon: <Train size={16} /> },
    { id: 'electric', name: 'электричка', icon: <Train size={16} /> },
  ];

  const attractionsOptions = [
    { id: '1', name: 'Исторические места' },
    { id: '2', name: 'Музеи и галереи' },
    { id: '3', name: 'Парки и скверы' },
    { id: '4', name: 'Архитектурные памятники' },
    { id: '5', name: 'Театры и кино' },
    { id: '6', name: 'Рестораны и кафе' },
    { id: '7', name: 'Магазины и торговые центры' },
    { id: '8', name: 'Спортивные объекты' }
  ];

  const eventsOptions = [
    { id: '1', name: 'Концерты' },
    { id: '2', name: 'Выставки' },
    { id: '3', name: 'Фестивали' },
    { id: '4', name: 'Спортивные мероприятия' },
    { id: '5', name: 'Театральные постановки' },
    { id: '6', name: 'Киносеансы' },
    { id: '7', name: 'Лекции и мастер-классы' },
    { id: '8', name: 'Экскурсии' }
  ];

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onFormChange();
  };

  const handleTransportToggle = (transportName: string) => {
    const newTransport = formData.transport.includes(transportName)
      ? formData.transport.filter(t => t !== transportName)
      : [...formData.transport, transportName];
    updateField('transport', newTransport);
  };

  const handleAttractionToggle = (attractionId: string) => {
    const newAttractions = formData.attractions.includes(attractionId)
      ? formData.attractions.filter(id => id !== attractionId)
      : [...formData.attractions, attractionId];
    updateField('attractions', newAttractions);
  };

  const handleEventToggle = (eventId: string) => {
    const newEvents = formData.events.includes(eventId)
      ? formData.events.filter(id => id !== eventId)
      : [...formData.events, eventId];
    updateField('events', newEvents);
  };

  const handleSearch = () => {
    onRouteUpdate(formData);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Планирование маршрута</h3>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <MapPin size={16} />
          <span>Откуда</span>
        </label>
        <input
          type="text"
          value={formData.from}
          onChange={(e) => updateField('from', e.target.value)}
          placeholder="Начальная точка"
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <MapPin size={16} />
          <span>Куда</span>
        </label>
        <input
          type="text"
          value={formData.to}
          onChange={(e) => updateField('to', e.target.value)}
          placeholder="Конечная точка"
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <Calendar size={16} />
          <span>Дата</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => updateField('date', e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <Navigation size={16} />
          <span>Транспорт</span>
        </label>
        <div className={styles.transportGrid}>
          {transportOptions.map(option => (
            <button
              key={option.id}
              type="button"
              className={`${styles.transportButton} ${
                formData.transport.includes(option.name) ? styles.active : ''
              }`}
              onClick={() => handleTransportToggle(option.name)}
            >
              {option.icon}
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <Star size={16} />
          <span>Достопримечательности</span>
        </label>
        <div className={styles.checkboxGrid}>
          {attractionsOptions.map(option => (
            <label key={option.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={formData.attractions.includes(option.id)}
                onChange={() => handleAttractionToggle(option.id)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>{option.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <CalendarDays size={16} />
          <span>События</span>
        </label>
        <div className={styles.checkboxGrid}>
          {eventsOptions.map(option => (
            <label key={option.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={formData.events.includes(option.id)}
                onChange={() => handleEventToggle(option.id)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>{option.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSearch}
        className={styles.searchButton}
      >
        Построить маршрут
      </button>
    </div>
  );
};