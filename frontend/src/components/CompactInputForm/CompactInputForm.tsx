import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CompactInputForm.module.css';
import { TRANSPORT_OPTIONS, DURATION_OPTIONS, ATTRACTION_CATEGORIES, EVENTS } from './constants';
import { initialState, type FormData } from './types';
import { getTicketData, geocodeCity } from './helpers';

export const CompactInputForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialState);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 5;

  const isStepValid = useCallback((step: number): boolean => {
    if (step === 0) {
      const ticketValid = /^(HT|TR)-\d{6}$/i.test(formData.ticketNumber.trim());
      const placeValid = formData.destinationCity.trim() !== '' && formData.travelDate !== '';
      return ticketValid || placeValid;
    }
    if (step === 1) {
      return true;
    }
    if (step === 2) {
      return formData.duration !== null;
    }
    return true;
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTransport = (id: string) => {
    setFormData(prev => ({
      ...prev,
      transport: prev.transport.includes(id) ? prev.transport.filter(t => t !== id) : [...prev.transport, id],
    }));
  };

  const toggleAttraction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attractions: prev.attractions.includes(id) ? prev.attractions.filter(a => a !== id) : [...prev.attractions, id],
    }));
  };

  const toggleEvent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(id) ? prev.events.filter(e => e !== id) : [...prev.events, id],
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

  const handleTicketChange = (value: string) => {
    setError('');
    setFormData(prev => {
      const updated = { ...prev, ticketNumber: value };
      const trimmed = value.trim();
      if (trimmed && (trimmed.startsWith('TR-') || trimmed.startsWith('HT-'))) {
        const ticketInfo = getTicketData(trimmed);
        if (ticketInfo) {
          updated.destinationCity = ticketInfo.city;
          updated.travelDate = ticketInfo.date;
        }
      }
      return updated;
    });
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
                onChange={(e) => {
                  handleTicketChange(e.target.value)
                  updateField('ticketNumber', e.target.value)
                }}
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