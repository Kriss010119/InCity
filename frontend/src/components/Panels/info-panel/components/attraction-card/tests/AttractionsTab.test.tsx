/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { AttractionsTab } from '../AttractionsTab';

jest.mock('../AttractionCard', () => ({
  AttractionCard: ({ place, onClick }: any) => (
    <div data-testid={`attraction-${place.id}`} onClick={() => onClick(place)}>
      {place.name}
    </div>
  ),
}));

const mockVisitPointGroups = [
  {
    mainAttraction: {
      id: 1,
      name: 'Красная площадь',
      category: 'Достопримечательность',
      estimatedVisitMinutes: 60,
    },
    otherAttractions: [
      {
        id: 2,
        name: 'Храм Василия Блаженного',
        category: 'Архитектура',
        estimatedVisitMinutes: 30,
      },
      { id: 3, name: 'ГУМ', category: 'Торговый центр', estimatedVisitMinutes: 45 },
    ],
    estimatedTimeInMinutes: 135,
  },
  {
    mainAttraction: { id: 4, name: 'Парк Горького', category: 'Парк', estimatedVisitMinutes: 90 },
    otherAttractions: [],
    estimatedTimeInMinutes: 90,
  },
];

describe('AttractionsTab', () => {
  const mockOnAttractionClick = jest.fn();
  const mockOnPlaceSelect = jest.fn();

  const renderTab = () => {
    return render(
      <AttractionsTab
        visitPointGroups={mockVisitPointGroups as any}
        onAttractionClick={mockOnAttractionClick}
        onPlaceSelect={mockOnPlaceSelect}
      />,
    );
  };

  test('отображает заголовок', () => {
    renderTab();
    expect(screen.getByText('Достопримечательности')).toBeInTheDocument();
  });

  test('отображает общее количество мест', () => {
    renderTab();
    expect(screen.getByText(/4.*мест для посещения/i)).toBeInTheDocument();
  });

  test('отображает все достопримечательности', () => {
    renderTab();
    expect(screen.getByTestId('attraction-1')).toBeInTheDocument();
    expect(screen.getByTestId('attraction-2')).toBeInTheDocument();
    expect(screen.getByTestId('attraction-3')).toBeInTheDocument();
    expect(screen.getByTestId('attraction-4')).toBeInTheDocument();
  });

  test('вызывает onPlaceSelect при клике на достопримечательность', () => {
    renderTab();
    const attraction = screen.getByTestId('attraction-1');
    fireEvent.click(attraction);
    expect(mockOnPlaceSelect).toHaveBeenCalledWith(mockVisitPointGroups[0].mainAttraction);
  });
});
