import { render, screen, fireEvent } from '@testing-library/react';
import { InfoPanelTabs } from '../InfoPanelTabs';

describe('InfoPanelTabs', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTabs = (activeTab: 'route' | 'attractions' = 'route') => {
    return render(<InfoPanelTabs activeTab={activeTab} onTabChange={mockOnTabChange} />);
  };

  test('отображает две вкладки', () => {
    renderTabs();
    expect(screen.getByText('Маршрут')).toBeInTheDocument();
    expect(screen.getByText('Достопримечательности')).toBeInTheDocument();
  });

  test('вызывает onTabChange при клике на вкладку "Достопримечательности"', () => {
    renderTabs('route');
    const attractionsTab = screen.getByText('Достопримечательности');
    fireEvent.click(attractionsTab);
    expect(mockOnTabChange).toHaveBeenCalledWith('attractions');
  });

  test('вызывает onTabChange при клике на вкладку "Маршрут"', () => {
    renderTabs('attractions');
    const routeTab = screen.getByText('Маршрут');
    fireEvent.click(routeTab);
    expect(mockOnTabChange).toHaveBeenCalledWith('route');
  });
});
