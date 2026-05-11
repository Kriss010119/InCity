import {
  getMetroLineColor,
  getMetroLineName,
  getMetroLineInfo,
  detectMetroCity,
  MOSCOW_METRO_LINES,
  SAINT_PETERSBURG_METRO_LINES,
} from '../metroConstants';

describe('metroConstants', () => {
  describe('getMetroLineColor', () => {
    test('возвращает цвет для линии метро Москвы', () => {
      expect(getMetroLineColor('1', 'moscow')).toBe('#E4292C');
      expect(getMetroLineColor('2', 'moscow')).toBe('#3E9A4F');
      expect(getMetroLineColor('3', 'moscow')).toBe('#2673B0');
      expect(getMetroLineColor('5', 'moscow')).toBe('#A86E3B');
    });

    test('возвращает цвет для линии метро СПб', () => {
      expect(getMetroLineColor('1', 'spb')).toBe('#E31E24');
      expect(getMetroLineColor('2', 'spb')).toBe('#0066B4');
      expect(getMetroLineColor('3', 'spb')).toBe('#6BB43C');
    });

    test('возвращает цвет для Екатеринбурга', () => {
      expect(getMetroLineColor('1', 'ekaterinburg')).toBe('#E31E24');
    });

    test('возвращает цвет для Новосибирска', () => {
      expect(getMetroLineColor('1', 'novosibirsk')).toBe('#E31E24');
      expect(getMetroLineColor('2', 'novosibirsk')).toBe('#0066B4');
    });

    test('возвращает цвет по умолчанию для другого города', () => {
      expect(getMetroLineColor('1', 'other')).toBe('#bf5151ff');
    });

    test('обрабатывает алиасы линий', () => {
      expect(getMetroLineColor('8a', 'moscow')).toBe('#E94B3C');
      expect(getMetroLineColor('11a', 'moscow')).toBe('#7BB3B3');
    });
  });

  describe('getMetroLineName', () => {
    test('возвращает название для Москвы', () => {
      expect(getMetroLineName('1', 'moscow')).toBe('Сокольническая');
      expect(getMetroLineName('2', 'moscow')).toBe('Замоскворецкая');
      expect(getMetroLineName('5', 'moscow')).toBe('Кольцевая');
    });

    test('возвращает название для СПб', () => {
      expect(getMetroLineName('1', 'spb')).toBe('Кировско-Выборгская');
      expect(getMetroLineName('2', 'spb')).toBe('Московско-Петроградская');
    });

    test('возвращает название по умолчанию для неизвестной линии', () => {
      expect(getMetroLineName('999', 'moscow')).toBe('Линия 999');
    });
  });

  describe('getMetroLineInfo', () => {
    test('возвращает полную информацию о линии', () => {
      const info = getMetroLineInfo('1', 'moscow');
      expect(info).toEqual({
        number: '1',
        name: 'Сокольническая',
        color: '#E4292C',
      });
    });

    test('возвращает null для неизвестной линии', () => {
      expect(getMetroLineInfo('999', 'moscow')).toBeNull();
    });
  });

  describe('detectMetroCity', () => {
    test('определяет Москву по координатам', () => {
      expect(detectMetroCity('', { lat: 55.7558, lng: 37.6173 })).toBe('moscow');
      expect(detectMetroCity('', { lat: 55.8, lng: 37.6 })).toBe('moscow');
    });

    test('определяет СПб по координатам', () => {
      expect(detectMetroCity('', { lat: 59.9343, lng: 30.3351 })).toBe('spb');
      expect(detectMetroCity('', { lat: 60.0, lng: 30.3 })).toBe('spb');
    });

    test('определяет Екатеринбург по координатам', () => {
      expect(detectMetroCity('', { lat: 56.8, lng: 60.6 })).toBe('ekaterinburg');
    });

    test('определяет Новосибирск по координатам', () => {
      expect(detectMetroCity('', { lat: 55.0, lng: 82.9 })).toBe('novosibirsk');
    });

    test('определяет Нижний Новгород по координатам', () => {
      expect(detectMetroCity('', { lat: 56.3, lng: 44.0 })).toBe('nizhnynovgorod');
    });

    test('определяет Самару по координатам', () => {
      expect(detectMetroCity('', { lat: 53.2, lng: 50.1 })).toBe('samara');
    });

    test('определяет Казань по координатам', () => {
      expect(detectMetroCity('', { lat: 55.8, lng: 49.1 })).toBe('kazan');
    });

    test('возвращает "other" для координат вне городов', () => {
      expect(detectMetroCity('', { lat: 0, lng: 0 })).toBe('other');
      expect(detectMetroCity('', { lat: 90, lng: 0 })).toBe('other');
    });
  });

  describe('массивы линий метро', () => {
    test('MOSCOW_METRO_LINES содержит все основные линии', () => {
      expect(MOSCOW_METRO_LINES.length).toBeGreaterThan(10);
      expect(MOSCOW_METRO_LINES.find((l) => l.number === '1')?.name).toBe('Сокольническая');
      expect(MOSCOW_METRO_LINES.find((l) => l.number === '5')?.name).toBe('Кольцевая');
    });

    test('SAINT_PETERSBURG_METRO_LINES содержит 5 линий', () => {
      expect(SAINT_PETERSBURG_METRO_LINES.length).toBe(5);
      expect(SAINT_PETERSBURG_METRO_LINES.find((l) => l.number === '1')?.name).toBe(
        'Кировско-Выборгская',
      );
    });
  });
});
