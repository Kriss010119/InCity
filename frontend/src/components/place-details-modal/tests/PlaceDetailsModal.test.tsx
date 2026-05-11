/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { PlaceDetailsModal } from '../PlaceDetailsModal';

jest.mock('../../../hooks/usePlaceDetails', () => ({
  usePlaceDetails: () => ({
    details: {
      description: 'Красная площадь — главная площадь Москвы',
      images: ['https://example.com/red-square.jpg'],
      address: 'Красная площадь, 1',
      phone: '+7 495 123-45-67',
      website: 'https://example.com',
      openingHours: 'Ежедневно, круглосуточно',
      wikipediaUrl: 'https://ru.wikipedia.org/wiki/Красная_площадь',
    },
    isLoading: false,
    error: null,
  }),
}));

const mockPlace = {
  id: 1,
  name: 'Красная площадь',
  latitude: 55.7537,
  longitude: 37.6199,
  category: 'Достопримечательности',
  subcategory: 'Площадь',
  estimatedVisitMinutes: 60,
  tags: ['addr:street=Красная площадь'],
  osmType: 'node',
  square: null,
};

describe('PlaceDetailsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (place = mockPlace) => {
    return render(<PlaceDetailsModal place={place as any} onClose={mockOnClose} />);
  };

  test('отображает название места', () => {
    renderModal();
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
  });

  test('отображает категорию', () => {
    renderModal();
    expect(screen.getByText('Достопримечательности • Площадь')).toBeInTheDocument();
  });

  test('отображает время осмотра', () => {
    renderModal();
    expect(screen.getByText('60 мин')).toBeInTheDocument();
  });

  test('отображает описание', () => {
    renderModal();
    expect(screen.getByText('Красная площадь — главная площадь Москвы')).toBeInTheDocument();
  });
});
