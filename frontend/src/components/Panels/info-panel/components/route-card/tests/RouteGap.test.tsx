/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteGap } from '../RouteGap';

describe('RouteGap', () => {
  const mockGap = {
    startNode: { name: 'Охотный Ряд', latitude: 55.757, longitude: 37.617 },
    endNode: { name: 'Площадь Революции', latitude: 55.756, longitude: 37.618 },
    transport: 'metro',
    routeNumber: '1',
    nodesVisited: [
      { name: 'Лубянка', nodeId: 2 },
      { name: 'Кузнецкий Мост', nodeId: 3 },
    ],
  };
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderGap = (isSelected = false) => {
    return render(
      <RouteGap gap={mockGap as any} gapId="0-0" isSelected={isSelected} onSelect={mockOnSelect} />,
    );
  };

  test('отображает тип транспорта', () => {
    renderGap();
    expect(screen.getByText(/Сокольническая, линия/i)).toBeInTheDocument();
  });

  test('вызывает onSelect при клике', () => {
    renderGap();
    const card = screen.getByText('Охотный Ряд').closest('[data-gap-id="0-0"]');
    expect(card).toBeInTheDocument();
    fireEvent.click(card!);
    expect(mockOnSelect).toHaveBeenCalled();
  });

  test('отображает начальную остановку', () => {
    renderGap();
    expect(screen.getByText('Охотный Ряд')).toBeInTheDocument();
  });

  test('отображает конечную остановку', () => {
    renderGap();
    expect(screen.getByText('Площадь Революции')).toBeInTheDocument();
  });

  test('отображает промежуточные остановки', () => {
    renderGap();
    expect(screen.getByText('Лубянка')).toBeInTheDocument();
    expect(screen.getByText('Кузнецкий Мост')).toBeInTheDocument();
  });
});
