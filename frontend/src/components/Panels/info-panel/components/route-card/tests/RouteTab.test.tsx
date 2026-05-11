/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteTab } from '../RouteTab';

jest.mock('../RouteSection', () => ({
  RouteSection: ({ sectionIndex, isSectionSelected, onSectionClick }: any) => (
    <div data-testid={`section-${sectionIndex}`} onClick={() => onSectionClick?.(sectionIndex)}>
      {isSectionSelected ? 'Section Selected' : 'Section Not Selected'}
    </div>
  ),
}));

describe('RouteTab', () => {
  const mockRouteResponse = {
    sections: [
      { estimatedTimeInMinutes: 30, numberOfTransfers: 0, gaps: [] },
      { estimatedTimeInMinutes: 45, numberOfTransfers: 1, gaps: [] },
      { estimatedTimeInMinutes: 20, numberOfTransfers: 0, gaps: [] },
    ],
    visitPoints: [
      { estimatedTimeInMinutes: 60, mainAttraction: {}, otherAttractions: [] },
      { estimatedTimeInMinutes: 30, mainAttraction: {}, otherAttractions: [] },
      { estimatedTimeInMinutes: 45, mainAttraction: {}, otherAttractions: [] },
    ],
  };

  const mockOnSelectGap = jest.fn();

  const renderTab = (props = {}) => {
    return render(
      <RouteTab
        routeResponse={mockRouteResponse as any}
        walkingSegments={[]}
        selectedGapId={null}
        onSelectGap={mockOnSelectGap}
        {...props}
      />,
    );
  };

  test('отображает заголовок', () => {
    renderTab();
    expect(screen.getByText('Информация о маршруте')).toBeInTheDocument();
  });

  test('отображает общее время в часах', () => {
    renderTab();
    expect(screen.getByText(/3\.8.*ч/)).toBeInTheDocument();
  });

  test('отображает количество мест', () => {
    renderTab();
    const placesLabel = screen.getByText('Мест');
    const placesValue = placesLabel.previousElementSibling;
    expect(placesValue).toHaveTextContent('3');
  });

  test('отображает количество секций', () => {
    renderTab();
    const sectionsLabel = screen.getByText('Участков');
    const sectionsValue = sectionsLabel.previousElementSibling;
    expect(sectionsValue).toHaveTextContent('3');
  });

  test('отображает количество пересадок', () => {
    renderTab();
    const transfersLabel = screen.getByText('Пересадок');
    const transfersValue = transfersLabel.previousElementSibling;
    expect(transfersValue).toHaveTextContent('1');
  });

  test('отображает все секции', () => {
    renderTab();
    expect(screen.getByTestId('section-0')).toBeInTheDocument();
    expect(screen.getByTestId('section-1')).toBeInTheDocument();
    expect(screen.getByTestId('section-2')).toBeInTheDocument();
  });

  test('вызывает onSelectGap при клике на секцию', () => {
    renderTab();
    const section = screen.getByTestId('section-0');
    fireEvent.click(section);
    expect(mockOnSelectGap).toHaveBeenCalledWith('section-0');
  });
});
