import { render, screen, fireEvent } from '@testing-library/react';
import { RouteWalk } from '../RouteWalk';

describe('RouteWalk', () => {
  const mockWalk = {
    id: 'walk-1',
    startPoint: { name: 'Красная площадь', lat: 55.7537, lng: 37.6199 },
    endPoint: { name: 'Храм Василия Блаженного', lat: 55.7525, lng: 37.6231 },
    estimatedTime: 10,
  };
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWalk = (isSelected = false) => {
    return render(
      <RouteWalk walk={mockWalk} walkId="walk-1" isSelected={isSelected} onSelect={mockOnSelect} />,
    );
  };

  test('отображает начальную и конечную точки', () => {
    renderWalk();
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
    expect(screen.getByText('Храм Василия Блаженного')).toBeInTheDocument();
  });

  test('отображает иконку пешего перехода', () => {
    renderWalk();
    // Проверяем наличие иконки Footprints (через атрибут)
    const icon = document.querySelector('.lucide-footprints');
    expect(icon).toBeInTheDocument();
  });

  test('отображает время', () => {
    renderWalk();
    expect(screen.getByText(/10 мин/)).toBeInTheDocument();
  });

  test('вызывает onSelect при клике', () => {
    renderWalk();
    const card = screen.getByText('Красная площадь').closest('[data-gap-id="walk-1"]');
    expect(card).toBeInTheDocument();
    fireEvent.click(card!);
    expect(mockOnSelect).toHaveBeenCalled();
  });
});
