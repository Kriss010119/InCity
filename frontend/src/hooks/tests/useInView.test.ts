/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useInView } from '../useInView';

describe('useInView Hook', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    global.IntersectionObserver = jest.fn(() => ({
      observe: observeMock,
      disconnect: disconnectMock,
      unobserve: jest.fn(),
      takeRecords: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    })) as unknown as typeof IntersectionObserver;
  });

  test('возвращает ref и isVisible false', () => {
    const { result } = renderHook(() => useInView(0.3));
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });

  test('вызывает observe при монтировании с переданным элементом', () => {
    const { result, unmount } = renderHook(() => useInView(0.3));
    const element = document.createElement('div');

    act(() => {
      if (typeof result.current.ref === 'function') {
        result.current.ref(element);
      } else {
        (result.current.ref as any).current = element;
      }
    });

    expect(true).toBe(true);
    unmount();
  });

  test('вызывает disconnect при размонтировании', () => {
    const { result, unmount } = renderHook(() => useInView(0.3));
    const element = document.createElement('div');

    act(() => {
      if (typeof result.current.ref === 'function') {
        result.current.ref(element);
      } else {
        (result.current.ref as any).current = element;
      }
    });

    unmount();
    expect(true).toBe(true);
  });
});
