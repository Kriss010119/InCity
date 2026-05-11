/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { AttractionCard } from '../AttractionCard';
import { PlaceCacheProvider } from '../../../../../../context/PlaceCacheContext';

const mockUsePlaceDetails = jest.fn();

jest.mock('../../../../../../hooks/usePlaceDetails', () => ({
  usePlaceDetails: () => mockUsePlaceDetails(),
}));

jest.mock('../../../../../../utils/categoryUtils', () => ({
  getCategoryColor: jest.fn().mockReturnValue('#e30611'),
}));

const mockPlace = {
  id: 1,
  name: 'Красная площадь',
  latitude: 55.7537,
  longitude: 37.6199,
  category: 'Достопримечательности',
  subcategory: 'Площадь',
  estimatedVisitMinutes: 60,
  tags: ['addr:street=Красная площадь', 'name=Красная площадь'],
  osmType: 'node',
  square: null,
};

describe('AttractionCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlaceDetails.mockReturnValue({
      details: { images: [], address: '', wikipediaExtract: '' },
      isLoading: false,
      error: null,
    });
  });

  const renderCard = (props = {}) => {
    return render(
      <PlaceCacheProvider>
        <AttractionCard place={mockPlace as any} onClick={mockOnClick} {...props} />
      </PlaceCacheProvider>,
    );
  };

  test('отображает название места', () => {
    renderCard();
    expect(screen.getAllByText('Красная площадь').length).toBeGreaterThan(0);
  });

  test('отображает категорию', () => {
    renderCard();
    expect(screen.getByText('Площадь')).toBeInTheDocument();
  });

  test('отображает время осмотра', () => {
    renderCard();
    expect(screen.getByText('60 мин')).toBeInTheDocument();
  });

  test('отображает адрес', () => {
    mockUsePlaceDetails.mockReturnValue({
      details: { images: [], address: 'Красная площадь, 1', wikipediaExtract: '' },
      isLoading: false,
      error: null,
    });
    renderCard();
    expect(screen.getByText('Красная площадь, 1')).toBeInTheDocument();
  });

  test('отображает описание из Wikipedia', () => {
    mockUsePlaceDetails.mockReturnValue({
      details: {
        images: [],
        address: '',
        wikipediaExtract: 'Красная площадь — главная площадь Москвы',
      },
      isLoading: false,
      error: null,
    });
    renderCard();
    expect(screen.getByText(/Красная площадь — главная площадь Москвы/)).toBeInTheDocument();
  });

  test('отображает изображение', () => {
    mockUsePlaceDetails.mockReturnValue({
      details: {
        images: ['https://example.com/image.jpg'],
        address: '',
        wikipediaExtract: '',
      },
      isLoading: false,
      error: null,
    });
    renderCard();
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('example.com');
  });

  test('показывает плейсхолдер при отсутствии изображения', () => {
    renderCard();
    expect(screen.getByText('Фото')).toBeInTheDocument();
  });
});
