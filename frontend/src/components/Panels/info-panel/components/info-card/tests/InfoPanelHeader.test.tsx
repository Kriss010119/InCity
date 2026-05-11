import { render, screen, fireEvent } from '@testing-library/react';
import { InfoPanelHeader } from '../InfoPanelHeader';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

describe('InfoPanelHeader', () => {
  const mockOnCollapse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  const renderHeader = (isCollapsed = false) => {
    return render(<InfoPanelHeader isCollapsed={isCollapsed} onCollapse={mockOnCollapse} />);
  };

  test('отображает кнопку сворачивания', () => {
    renderHeader(false);
    expect(screen.getByText('Скрыть')).toBeInTheDocument();
  });

  test('отображает кнопку разворачивания когда свёрнуто', () => {
    renderHeader(true);
    expect(screen.getByText('Развернуть')).toBeInTheDocument();
  });

  test('вызывает onCollapse при клике на кнопку', () => {
    renderHeader(false);
    const button = screen.getByText('Скрыть');
    fireEvent.click(button);
    expect(mockOnCollapse).toHaveBeenCalled();
  });

  test('не отображается на мобильных устройствах', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
    window.dispatchEvent(new Event('resize'));

    renderHeader(false);
    expect(screen.queryByText('Скрыть')).not.toBeInTheDocument();
  });
});
