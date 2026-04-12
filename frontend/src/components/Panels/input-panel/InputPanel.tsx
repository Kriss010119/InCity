import { useEffect, useState } from 'react';
import { useTicket } from '../../../context/TicketContext';
import { 
  ActionButtons, DatePicker, DestinationInput, 
  TicketSection, TransportSelector, DurationSelector,
  ObjectFilterMenu, EventFilterMenu 
} from './components';
import type { FormData, InputPanelProps } from './helpers/types';
import styles from './InputPanel.module.css';

export const InputPanel = ({
  onRouteUpdate,
  onSearch,
  onFormChange,
  onReset,
  initialData,
  isDestinationLocked = false,
  setIsDestinationLocked,
  onMapSelectModeChange
}: InputPanelProps & { onMapSelectModeChange?: (isSelecting: boolean) => void }) => {
  const { ticketData, setTicketData, clearTicketData } = useTicket();
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    to: initialData?.to || '',
    date: initialData?.date || '',
    transport: initialData?.transport || ['metro', 'bus'],
    attractions: initialData?.attractions || [],
    events: initialData?.events || [],
    duration: initialData?.duration,
    useTicket: false
  });

  useEffect(() => {
    if (!initialData) return;
    setFormData(prev => ({
      ...prev,
      ...initialData
    }));
  }, [initialData]);

  useEffect(() => {
    if (ticketData?.ticketDetails) {
      setIsDestinationLocked?.(true);
      setFormData(prev => ({ ...prev, useTicket: true }));
    }
  }, [ticketData, setIsDestinationLocked]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    if (field === 'to' && isDestinationLocked) return;
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'to') {
        next.destinationLat = undefined;
        next.destinationLng = undefined;
        next.destinationName = undefined;
      }
      onRouteUpdate(next);
      return next;
    });
    onFormChange();
  };

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => {
      const nextFormData: FormData = {
        ...prev,
        to: address,
        destinationLat: lat,
        destinationLng: lng,
        destinationName: address,
      };
      onRouteUpdate(nextFormData);
      return nextFormData;
    });
    onFormChange();
  };

  const handleTransportToggle = (transportId: string) => {
    const newTransport = formData.transport.includes(transportId)
      ? formData.transport.filter(t => t !== transportId)
      : [...formData.transport, transportId];
    updateField('transport', newTransport);
  };

  const handleSearch = () => {
    onSearch(formData);
    setIsSelectingOnMap(false);
    onMapSelectModeChange?.(false);
  };

  const handleReset = () => {
    const resetData = {
      to: '',
      date: '',
      transport: ['metro', 'bus'],
      attractions: [],
      events: [],
      duration: undefined,
      destinationLat: undefined,
      destinationLng: undefined,
      destinationName: undefined,
      useTicket: false
    } satisfies FormData;
    
    setFormData(resetData);
    onRouteUpdate(resetData);
    onReset?.();
    setIsDestinationLocked?.(false);
    clearTicketData();
    setTicketNumber('');
    setTicketError('');
    setIsSelectingOnMap(false);
    onMapSelectModeChange?.(false);
  };

  const handleTicketApply = async () => {
    if (!ticketNumber.trim()) {
      setTicketError('Введите номер билета');
      return;
    }

    if (ticketNumber.includes('TR-')) {
      const ticketDetails = {
        orderType: 'train' as const,
        orderId: ticketNumber,
        createdAt: new Date().toISOString(),
        details: {
          departureStationCode: '2004000',
          arrivalStationCode: '2000000',
          departureDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          arrivalDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          departureTime: '08:30',
          arrivalTime: '12:45',
          passengers: 1
        }
      };

      setTicketData({
        ticketNumber,
        ticketDetails
      });

      const newFormData = {
        ...formData,
        to: 'Москва',
        date: ticketDetails.details.departureDate,
        destinationName: 'Москва',
        destinationLat: 55.7558,
        destinationLng: 37.6173,
        useTicket: true
      };

      setFormData(newFormData);
      onRouteUpdate(newFormData);
      setIsDestinationLocked?.(true);
      setTicketError('');
    } else if (ticketNumber.includes('HT-')) {
      const ticketDetails = {
        orderType: 'hotel' as const,
        orderId: ticketNumber,
        createdAt: new Date().toISOString(),
        details: {
          hotelName: 'Lotte Hotel Moscow',
          coordinates: {
            latitude: 55.7494,
            longitude: 37.5820
          },
          checkIn: new Date(Date.now() + 86400000).toISOString(),
          checkOut: new Date(Date.now() + 172800000).toISOString()
        }
      };

      setTicketData({
        ticketNumber,
        ticketDetails
      });

      const newFormData = {
        ...formData,
        to: 'Lotte Hotel Moscow',
        date: ticketDetails.details.checkIn.split('T')[0],
        destinationName: 'Lotte Hotel Moscow',
        destinationLat: ticketDetails.details.coordinates.latitude,
        destinationLng: ticketDetails.details.coordinates.longitude,
        useTicket: true
      };

      setFormData(newFormData);
      onRouteUpdate(newFormData);
      setIsDestinationLocked?.(true);
      setTicketError('');
    } else {
      setTicketError('Неверный формат билета');
    }
  };

  const handleTicketRemove = () => {
    clearTicketData();
    setIsDestinationLocked?.(false);
    setTicketNumber('');
    setTicketError('');
    
    setFormData(prev => ({
      ...prev,
      to: '',
      date: '',
      destinationLat: undefined,
      destinationLng: undefined,
      destinationName: undefined,
      useTicket: false
    }));
  };

  const handleMapSelectClick = () => {
    const newState = !isSelectingOnMap;
    setIsSelectingOnMap(newState);
    onMapSelectModeChange?.(newState);
    
    if (newState) {
      console.log('Режим выбора на карте активирован. Кликните на карту чтобы выбрать точку.');
    }
  };

  const isSearchDisabled = !formData.to || !formData.date;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Планирование маршрута</h3>
      
      <TicketSection
        ticketNumber={ticketNumber}
        setTicketNumber={setTicketNumber}
        ticketError={ticketError}
        onTicketApply={handleTicketApply}
        onTicketRemove={handleTicketRemove}
        isDestinationLocked={isDestinationLocked}
      />

      <DestinationInput
        value={formData.to}
        onChange={(value: string) => updateField('to', value)}
        isLocked={isDestinationLocked}
        placeholder={ticketData ? "Можно изменить вручную" : "Введите конечную точку"}
        onMapSelect={handleMapSelectClick}
        isSelectingOnMap={isSelectingOnMap}
        onAddressSelect={handleAddressSelect}
      />

      <DatePicker
        value={formData.date}
        onChange={(value) => updateField('date', value)}
        isEnabled={!formData.useTicket || !!ticketData}
      />

      <DurationSelector
        selected={formData.duration || ''}
        onChange={(duration: string | undefined) => updateField('duration', duration as FormData['duration'])}
      />

      <TransportSelector
        selected={formData.transport}
        onToggle={handleTransportToggle}
      />

      <ObjectFilterMenu 
        selectedFilters={formData.attractions}
        onFilterChange={(filters: string[]) => updateField('attractions', filters)}
      />
      
      <EventFilterMenu 
        selectedEvents={formData.events}
        onEventChange={(events: string[]) => updateField('events', events)}
      />

      <ActionButtons
        onSearch={handleSearch}
        onReset={handleReset}
        isSearchDisabled={isSearchDisabled}
      />
    </div>
  );
};
