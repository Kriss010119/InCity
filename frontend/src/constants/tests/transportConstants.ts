import {
  getTransportColor,
  getTransportLabel,
  getTransportIcon,
  TRANSPORT_COLORS,
  TRANSPORT_LABELS,
} from '../transportConstants';

describe('transportConstants', () => {
  describe('getTransportColor', () => {
    test('возвращает цвет для метро', () => {
      const color = getTransportColor('metro', '1', 'Сокольники', {
        lat: 55.7558,
        lng: 37.6173,
        routeNumber: '1',
      });
      expect(color).toBe('#E4292C');
    });

    test('возвращает цвет для автобуса', () => {
      expect(getTransportColor('bus')).toBe('#7276ffff');
    });

    test('возвращает цвет для трамвая', () => {
      expect(getTransportColor('tram')).toBe('#6fbf4c');
    });

    test('возвращает цвет для троллейбуса', () => {
      expect(getTransportColor('trolleybus')).toBe('#8e44ad');
    });

    test('возвращает цвет для пешего перехода', () => {
      expect(getTransportColor('walk')).toBe('#b8b8b8ff');
    });

    test('возвращает серый для неизвестного транспорта', () => {
      expect(getTransportColor('unknown')).toBe('#888888');
    });
  });

  describe('getTransportLabel', () => {
    test('возвращает название для метро', () => {
      const label = getTransportLabel('metro', '1', 'Сокольники', {
        lat: 55.7558,
        lng: 37.6173,
        routeNumber: '1',
      });
      expect(label).toContain('Сокольническая');
    });

    test('возвращает название для автобуса', () => {
      expect(getTransportLabel('bus')).toBe('Автобус');
    });

    test('возвращает название для трамвая', () => {
      expect(getTransportLabel('tram')).toBe('Трамвай');
    });

    test('возвращает название для пешего перехода', () => {
      expect(getTransportLabel('walk')).toBe('Пешком');
    });
  });

  describe('getTransportIcon', () => {
    test('возвращает иконку для метро', () => {
      const Icon = getTransportIcon('metro');
      expect(Icon).toBeDefined();
    });

    test('возвращает иконку для автобуса', () => {
      const Icon = getTransportIcon('bus');
      expect(Icon).toBeDefined();
    });

    test('возвращает Bus как fallback', () => {
      const Icon = getTransportIcon('unknown');
      expect(Icon).toBeDefined();
    });
  });

  describe('TRANSPORT_COLORS', () => {
    test('содержит цвета для всех видов транспорта', () => {
      expect(TRANSPORT_COLORS.metro).toBe('#bf5151ff');
      expect(TRANSPORT_COLORS.bus).toBe('#7276ffff');
      expect(TRANSPORT_COLORS.tram).toBe('#6fbf4c');
      expect(TRANSPORT_COLORS.trolleybus).toBe('#8e44ad');
      expect(TRANSPORT_COLORS.walk).toBe('#b8b8b8ff');
    });
  });

  describe('TRANSPORT_LABELS', () => {
    test('содержит названия для всех видов транспорта', () => {
      expect(TRANSPORT_LABELS.metro).toBe('Метро');
      expect(TRANSPORT_LABELS.bus).toBe('Автобус');
      expect(TRANSPORT_LABELS.tram).toBe('Трамвай');
      expect(TRANSPORT_LABELS.trolleybus).toBe('Троллейбус');
      expect(TRANSPORT_LABELS.walk).toBe('Пешком');
    });
  });
});
