import { render, screen, fireEvent } from '@testing-library/react';
import { DurationSelector } from './DurationSelector';

describe('DurationSelector Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает все 4 варианта продолжительности', () => {
    render(<DurationSelector selected="" onChange={mockOnChange} />);
    expect(screen.getByText('Очень короткий')).toBeInTheDocument();
    expect(screen.getByText('Короткий')).toBeInTheDocument();
    expect(screen.getByText('Средний')).toBeInTheDocument();
    expect(screen.getByText('Длинный')).toBeInTheDocument();
  });

  test('отображает описание для каждого варианта', () => {
    render(<DurationSelector selected="" onChange={mockOnChange} />);
    expect(screen.getByText('до 2 часов')).toBeInTheDocument();
    expect(screen.getByText('2-3 часа')).toBeInTheDocument();
    expect(screen.getByText('3-6 часов')).toBeInTheDocument();
    expect(screen.getByText('от 6 часов')).toBeInTheDocument();
  });

  test('подсвечивает выбранный вариант', () => {
    render(<DurationSelector selected="medium" onChange={mockOnChange} />);
    const mediumButton = screen.getByText('Средний').closest('button');
    expect(mediumButton).toBeInTheDocument();
  });

  test('вызывает onChange с правильным id при клике', () => {
    render(<DurationSelector selected="" onChange={mockOnChange} />);
    const longButton = screen.getByText('Длинный');
    fireEvent.click(longButton);
    expect(mockOnChange).toHaveBeenCalledWith('long');
  });
});
