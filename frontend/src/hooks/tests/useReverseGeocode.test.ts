import { renderHook } from '@testing-library/react';
import { useReverseGeocode } from '../useReverseGeocode';

global.fetch = jest.fn();

describe('useReverseGeocode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('возвращает функцию reverseGeocode', () => {
    const { result } = renderHook(() => useReverseGeocode());
    expect(typeof result.current.reverseGeocode).toBe('function');
  });

  test('возвращает адрес при успешном запросе', async () => {
    const mockAddress = 'Москва, Красная площадь, 1';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        display_name: mockAddress,
        address: { road: 'Красная площадь', house_number: '1', city: 'Москва' },
      }),
    });

    const { result } = renderHook(() => useReverseGeocode());
    const address = await result.current.reverseGeocode(55.7537, 37.6199);

    expect(address).toBe(mockAddress);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse'),
    );
  });

  test('формирует адрес из компонентов если display_name отсутствует', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: { road: 'Красная площадь', house_number: '1', city: 'Москва' },
      }),
    });

    const { result } = renderHook(() => useReverseGeocode());
    const address = await result.current.reverseGeocode(55.7537, 37.6199);

    expect(address).toContain('Красная площадь');
    expect(address).toContain('Москва');
  });

  test('возвращает сообщение с координатами при ошибке', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReverseGeocode());
    const address = await result.current.reverseGeocode(55.7537, 37.6199);

    expect(address).toContain('Точка на карте');
    expect(address).toContain('55.7537');
  });
});
