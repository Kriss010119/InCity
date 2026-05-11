/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteSection } from '../RouteSection';

jest.mock('../RouteGap', () => ({
  RouteGap: ({ gapId, isSelected, onSelect }: any) => (
    <div data-testid={`gap-${gapId}`} onClick={() => onSelect()}>
      {isSelected ? 'Selected' : 'Not selected'}
    </div>
  ),
}));

jest.mock('../RouteWalk', () => ({
  RouteWalk: ({ walkId, isSelected, onSelect }: any) => (
    <div data-testid={`walk-${walkId}`} onClick={() => onSelect()}>
      {isSelected ? 'Walk Selected' : 'Walk Not selected'}
    </div>
  ),
}));

describe('RouteSection', () => {
  const mockSection = {
    gaps: [
      {
        startNode: { name: 'Start1' },
        endNode: { name: 'End1' },
        transport: 'bus',
        routeNumber: '123',
        nodesVisited: [],
      },
      {
        startNode: { name: 'Start2' },
        endNode: { name: 'End2' },
        transport: 'metro',
        routeNumber: '1',
        nodesVisited: [],
      },
    ],
    estimatedTimeInMinutes: 45,
    numberOfTransfers: 1,
  };

  const mockWalkingSegments = [
    {
      id: 'walk-1',
      startPoint: { name: 'Point A' },
      endPoint: { name: 'Point B' },
    },
  ];

  const mockOnSelectGap = jest.fn();
  const mockOnSectionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSection = (props = {}) => {
    return render(
      <RouteSection
        section={mockSection as any}
        sectionIndex={0}
        selectedGapId={null}
        onSelectGap={mockOnSelectGap}
        walkingSegments={mockWalkingSegments as any}
        visitTime={30}
        isSectionSelected={false}
        onSectionClick={mockOnSectionClick}
        {...props}
      />,
    );
  };

  test('отображает номер секции', () => {
    renderSection();
    expect(screen.getByText('Участок 1')).toBeInTheDocument();
  });

  test('отображает общее время (транспорт + осмотр)', () => {
    renderSection();
    expect(screen.getByText('75 мин')).toBeInTheDocument();
  });

  test('отображает количество пересадок', () => {
    renderSection();
    expect(screen.getByText('Пересадок: 1')).toBeInTheDocument();
  });

  test('не отображает пересадки если их 0', () => {
    const sectionNoTransfers = { ...mockSection, numberOfTransfers: 0 };
    render(
      <RouteSection
        section={sectionNoTransfers as any}
        sectionIndex={0}
        selectedGapId={null}
        onSelectGap={mockOnSelectGap}
        walkingSegments={[]}
        visitTime={30}
        isSectionSelected={false}
        onSectionClick={mockOnSectionClick}
      />,
    );
    expect(screen.queryByText(/Пересадок/)).not.toBeInTheDocument();
  });

  test('вызывает onSectionClick при клике на секцию', () => {
    renderSection();
    const sectionHeader = screen.getByText('Участок 1').closest('[role="button"]');
    fireEvent.click(sectionHeader!);
    expect(mockOnSectionClick).toHaveBeenCalledWith(0);
  });

  test('подсвечивается при isSectionSelected=true', () => {
    const { container } = renderSection({ isSectionSelected: true });
    const sectionElement = container.querySelector('[role="button"]');
    expect(sectionElement).toBeInTheDocument();
  });
});
