import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlaceDetails } from '../usePlaceDetails';
import { PlaceCacheProvider } from '../../context/PlaceCacheContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PlaceCacheProvider>{children}</PlaceCacheProvider>
);

global.fetch = jest.fn();

describe('usePlaceDetails', () => {
  const mockPlace = {
    id: 1,
    name: 'Test Place',
    latitude: 0,
    longitude: 0,
    category: 'test',
    subcategory: 'test',
    square: 0,
    estimatedVisitMinutes: 30,
    osmType: 'node',
    tags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('возвращает isLoading=true при загрузке', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => usePlaceDetails(mockPlace), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  test('работает с null place', () => {
    const { result } = renderHook(() => usePlaceDetails(null), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.details).toBeDefined();
  });

  test('загружает данные', async () => {
    const mockData = { extract: 'Описание', thumbnail: { source: 'url' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePlaceDetails(mockPlace), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.details).toBeDefined();
  });
});
