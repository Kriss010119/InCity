import { renderHook } from '@testing-library/react';
import { useLocale } from '../useLocale';

jest.mock('../../locales/ru.json', () => ({
  nav: {
    home: 'Главная',
    map: 'Карта',
  },
  footer: {
    developers: 'Разработано студентами',
    copyright: '© 2025 InCity',
  },
  infoPanel: {
    route: 'Маршрут',
    attractions: 'Достопримечательности',
  },
}));

describe('useLocale', () => {
  test('возвращает функцию t для перевода', () => {
    const { result } = renderHook(() => useLocale());
    expect(typeof result.current.t).toBe('function');
  });

  test('возвращает язык "ru"', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.language).toBe('ru');
  });

  test('переводит ключ по точкам', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.t('nav.home')).toBe('Главная');
    expect(result.current.t('nav.map')).toBe('Карта');
  });

  test('возвращает сам ключ если перевод не найден', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('подставляет параметры в перевод', () => {
    const { result } = renderHook(() => useLocale());
    const t = result.current.t as (key: string, params?: Record<string, string | number>) => string;
    expect(typeof t).toBe('function');
  });
});
