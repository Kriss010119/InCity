import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CompactInputForm.module.css';

const ATTRACTION_CATEGORIES = [
  { id: 'museum', name: 'Музеи', icon: '' },
  { id: 'park-and-garden', name: 'Парки и сады', icon: '' },
  { id: 'architecture', name: 'Архитектура', icon: '' },
  { id: 'monument', name: 'Памятники', icon: '' },
  { id: 'theatre', name: 'Театры и концерты', icon: '' },
  { id: 'religious', name: 'Религиозные объекты', icon: '' },
  { id: 'science-education', name: 'Наука и образование', icon: '' },
  { id: 'gastronomy', name: 'Гастрономия', icon: '' },
  { id: 'contemporary-art', name: 'Современное искусство', icon: '' },
  { id: 'famous-people', name: 'Знаменитые люди', icon: '' },
  { id: 'children', name: 'Детские объекты', icon: '' },
];

const EVENTS = [
  { id: 'cinema', name: 'Кинопоказы', icon: '' },
  { id: 'exhibitions', name: 'Выставки', icon: '' },
  { id: 'concerts', name: 'Концерты', icon: '' },
  { id: 'festivals', name: 'Фестивали', icon: '' },
  { id: 'fairs', name: 'Ярмарки', icon: '' },
  { id: 'business', name: 'Бизнес-ивенты', icon: '' },
  { id: 'kids_events', name: 'Детские события', icon: '' },
  { id: 'charity', name: 'Благотворительность', icon: '' },
];

const TRANSPORT_OPTIONS = [
  { id: 'bus', name: 'Автобус' },
  { id: 'tram', name: 'Трамвай' },
  { id: 'trolleybus', name: 'Троллейбус' },
  { id: 'metro', name: 'Метро' },
];

const DURATION_OPTIONS = [
  { id: 'very_short', name: 'Очень короткий (до 2 ч)' },
  { id: 'short', name: 'Короткий (2–3 ч)' },
  { id: 'medium', name: 'Средний (3–6 ч)' },
  { id: 'long', name: 'Долгий (от 6 ч)' },
];

type FormData = {
  ticketNumber: string;
  destinationCity: string;
  travelDate: string;
  transport: string[];          
  duration: string | null;
  attractions: string[];     
  events: string[];
};

const initialState: FormData = {
  ticketNumber: '',
  destinationCity: '',
  travelDate: '',
  transport: [],
  duration: null,
  attractions: [],
  events: [],
};

const geocodeCity = async (city: string): Promise<{ lat: number; lng: number } | null> => {
  if (!city.trim()) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&countrycodes=ru`,
      { headers: { 'User-Agent': 'InCityApp/1.0' } }
    );
    const data = await response.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
};

const getTicketData = (ticketNumber: string): { city: string; date: string; lat: number; lng: number } | null => {
  if (ticketNumber.startsWith('TR-')) {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return { city: 'Москва', date, lat: 55.7558, lng: 37.6173 };
  }
  if (ticketNumber.startsWith('HT-')) {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return { city: 'Лотте Отель Москва', date, lat: 55.7494, lng: 37.5820 };
  }
  return null;
};

export const CompactInputForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialState);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 5;

  useEffect(() => {
    setError('');
    const ticket = formData.ticketNumber.trim();
    if (ticket && (ticket.startsWith('TR-') || ticket.startsWith('HT-'))) {
      const ticketInfo = getTicketData(ticket);
      if (ticketInfo) {
        setFormData(prev => ({
          ...prev,
          destinationCity: ticketInfo.city,
          travelDate: ticketInfo.date,
        }));
      }
    }
  }, [formData.ticketNumber]);

  const isStepValid = useCallback((step: number): boolean => {
    if (step === 0) {
      const ticketValid = /^(HT|TR)-\d{6}$/i.test(formData.ticketNumber.trim());
      const placeValid = formData.destinationCity.trim() !== '' && formData.travelDate !== '';
      return ticketValid || placeValid;
    }
    if (step === 1) return true;
    if (step === 2) return formData.duration !== null;
    return true;
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTransport = (id: string) => {
    setFormData(prev => ({
      ...prev,
      transport: prev.transport.includes(id)
        ? prev.transport.filter(t => t !== id)
        : [...prev.transport, id],
    }));
  };

  const toggleAttraction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attractions: prev.attractions.includes(id)
        ? prev.attractions.filter(a => a !== id)
        : [...prev.attractions, id],
    }));
  };

  const toggleEvent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(id)
        ? prev.events.filter(e => e !== id)
        : [...prev.events, id],
    }));
  };

  const goNext = () => {
    setError('');
    if (!isStepValid(currentStep)) {
      if (currentStep === 0) {
        setError('Укажите билет (HT-XXXXXX или TR-XXXXXX) либо город и дату');
      }
      else if (currentStep === 2) {
        setError('Выберите продолжительность маршрута');
      }
      return;
    }
    if (currentStep === totalSteps - 1) {
      handleBuild();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleBuild = async () => {
    setError('');

    if (!isStepValid(0) || !isStepValid(2)) {
      setError('Заполните обязательные поля (город/дата или билет, длительность)');
      return;
    }

    let city = formData.destinationCity;
    let date = formData.travelDate;
    let useTicket = false;
    let lat: number | undefined, lng: number | undefined;

    const ticket = formData.ticketNumber.trim();
    if (ticket && (ticket.startsWith('TR-') || ticket.startsWith('HT-'))) {
      const ticketInfo = getTicketData(ticket);
      if (ticketInfo) {
        city = ticketInfo.city;
        date = ticketInfo.date;
        lat = ticketInfo.lat;
        lng = ticketInfo.lng;
        useTicket = true;
      }
    }

    if (!useTicket) {
      setError('');
      if (!city || !date) {
        setError('Укажите город и дату');
        return;
      }
      setIsGeocoding(true);
      const coords = await geocodeCity(city);
      if (!coords) {
        setError('Не удалось определить координаты города. Уточните название.');
        setIsGeocoding(false);
        return;
      }
      lat = coords.lat;
      lng = coords.lng;
      setIsGeocoding(false);
    }

    const payload = {
      to: city,
      date: date,
      transport: formData.transport,
      attractions: formData.attractions, 
      events: formData.events,
      duration: formData.duration!,
      destinationLat: lat,
      destinationLng: lng,
      destinationName: city,
      useTicket: useTicket,
    };

    navigate('/map', { state: { builderFormData: payload } });
  };

  const renderSlide = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.slide}>
            <div className={styles.stepTitle}>Место назначения</div>
            <div className={styles.formGroup}>
              <label>Номер билета </label>
              <input
                type="text"
                className={styles.input}
                placeholder="HT-123456 или TR-654321"
                value={formData.ticketNumber}
                onChange={(e) => updateField('ticketNumber', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Город / место *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Москва"
                value={formData.destinationCity}
                onChange={(e) => updateField('destinationCity', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Дата поездки *</label>
              <input
                type="date"
                className={styles.input}
                value={formData.travelDate}
                onChange={(e) => updateField('travelDate', e.target.value)}
              />
            </div>
            <div className={styles.helperNote}>* Поля обязательны, если не указан билет</div>
            <div className={styles.errorInfo}>{error}</div>
          </div>
        );

      case 1:
        return (
          <div className={styles.slide}>
            <div className={styles.stepTitle}>Транспорт</div>
            <div className={styles.chipGroup}>
              {TRANSPORT_OPTIONS.map(opt => (
                <div
                  key={opt.id}
                  className={`${styles.chip} ${formData.transport.includes(opt.id) ? styles.selected : ''}`}
                  onClick={() => toggleTransport(opt.id)}
                >
                  {opt.name}
                </div>
              ))}
            </div>
            <div className={styles.helperNote}>Можно выбрать несколько</div>
            <div className={styles.errorInfo}>{error}</div>
          </div>
        );

      case 2:
        return (
          <div className={styles.slide}>
            <div className={styles.stepTitle}>Длительность маршрута</div>
            <div className={styles.chipGroup}>
              {DURATION_OPTIONS.map(opt => (
                <div
                  key={opt.id}
                  className={`${styles.chip} ${formData.duration === opt.id ? styles.selected : ''}`}
                  onClick={() => updateField('duration', opt.id)}
                >
                  {opt.name}
                </div>
              ))}
            </div>
            <div className={styles.errorInfo}>{error}</div>
          </div>
        );

      case 3:
        return (
          <div className={styles.slide}>
            <div className={styles.stepTitle}>Достопримечательности</div>
            <div className={styles.multiselectGroup}>
              {ATTRACTION_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`${styles.multiselectItem} ${formData.attractions.includes(cat.id) ? styles.selected : ''}`}
                  onClick={() => toggleAttraction(cat.id)}
                >
                  <span className={styles.itemIcon}>{cat.icon}</span> {cat.name}
                </div>
              ))}
            </div>
            <div className={styles.helperNote}>Можно выбрать несколько</div>
            <div className={styles.errorInfo}>{error}</div>
          </div>
        );

      case 4:
        return (
          <div className={styles.slide}>
            <div className={styles.stepTitle}>События</div>
            <div className={styles.multiselectGroup}>
              {EVENTS.map(ev => (
                <div
                  key={ev.id}
                  className={`${styles.multiselectItem} ${formData.events.includes(ev.id) ? styles.selected : ''}`}
                  onClick={() => toggleEvent(ev.id)}
                >
                  <span className={styles.itemIcon}>{ev.icon}</span> {ev.name}
                </div>
              ))}
            </div>
            <div className={styles.helperNote}>Можно выбрать несколько</div>
            <div className={styles.errorInfo}>{error}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.slidesArea}>
        <div className={styles.slidesTrack} style={{ transform: `translateX(-${currentStep * 100}%)` }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={idx} className={styles.slideWrapper}>
              {renderSlide()}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.navFooter}>
        <button className={styles.navBtn} onClick={goPrev} disabled={currentStep === 0}>
          Назад
        </button>
        <span className={styles.stepIndicator}>
          {currentStep + 1}/{totalSteps}
        </span>
        <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={goNext} disabled={isGeocoding}>
          {currentStep === totalSteps - 1 ? (isGeocoding ? 'Геокодирование...' : 'Построить') : 'Далее'}
        </button>
      </div>
    </div>
  );
};