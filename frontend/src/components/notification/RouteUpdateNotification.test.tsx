import { render, screen, fireEvent } from '@testing-library/react';
import { RouteUpdateNotification } from './RouteUpdateNotification';

describe('RouteUpdateNotification', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('не отображается когда show=false', () => {
    render(
      <RouteUpdateNotification show={false} onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />,
    );
    expect(screen.queryByText(/обновить/i)).not.toBeInTheDocument();
  });

  test('отображается когда show=true', () => {
    render(
      <RouteUpdateNotification show={true} onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByText('Параметры маршрута изменились')).toBeInTheDocument();
  });

  test('вызывает onUpdate при нажатии на кнопку "Обновить маршрут"', () => {
    render(
      <RouteUpdateNotification show={true} onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />,
    );
    const updateButton = screen.getByText('Обновить маршрут');
    fireEvent.click(updateButton);
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('вызывает onDismiss при нажатии на кнопку "Отмена"', () => {
    render(
      <RouteUpdateNotification show={true} onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />,
    );
    const dismissButton = screen.getByText('Отмена');
    fireEvent.click(dismissButton);
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});
