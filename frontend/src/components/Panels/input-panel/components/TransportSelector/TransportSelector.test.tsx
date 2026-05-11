import { render, screen, fireEvent } from '@testing-library/react';
import { TransportSelector } from './TransportSelector';

describe('TransportSelector Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает все 4 вида транспорта', () => {
    render(<TransportSelector selected={[]} onToggle={mockOnToggle} />);
    expect(screen.getByText('Метро')).toBeInTheDocument();
    expect(screen.getByText('Автобус')).toBeInTheDocument();
    expect(screen.getByText('Трамвай')).toBeInTheDocument();
    expect(screen.getByText('Троллейбус')).toBeInTheDocument();
  });

  test('подсвечивает выбранные виды транспорта', () => {
    render(<TransportSelector selected={['metro', 'bus']} onToggle={mockOnToggle} />);
    const metroButton = screen.getByText('Метро').closest('button');
    const busButton = screen.getByText('Автобус').closest('button');
    const tramButton = screen.getByText('Трамвай').closest('button');

    expect(metroButton).toBeInTheDocument();
    expect(busButton).toBeInTheDocument();
    expect(tramButton).toBeInTheDocument();
  });

  test('вызывает onToggle с правильным id при клике', () => {
    render(<TransportSelector selected={['metro']} onToggle={mockOnToggle} />);
    const busButton = screen.getByText('Автобус');
    fireEvent.click(busButton);
    expect(mockOnToggle).toHaveBeenCalledWith('bus');
  });

  test('удаляет транспорт из выбранных при повторном клике', () => {
    render(<TransportSelector selected={['metro', 'bus']} onToggle={mockOnToggle} />);
    const busButton = screen.getByText('Автобус');
    fireEvent.click(busButton);
    expect(mockOnToggle).toHaveBeenCalledWith('bus');
  });
});
