import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DestinationInput } from './DestinationInput';

global.fetch = jest.fn();

describe('DestinationInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnMapSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test('отображает поле ввода с placeholder', () => {
    render(<DestinationInput value="" onChange={mockOnChange} placeholder="Введите город" />);
    expect(screen.getByPlaceholderText('Введите город')).toBeInTheDocument();
  });

  test('вызывает onChange при вводе текста', async () => {
    render(<DestinationInput value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Москва');
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('блокирует ввод при isLocked=true', () => {
    render(<DestinationInput value="Заблокировано" onChange={mockOnChange} isLocked={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('вызывает onMapSelect при нажатии кнопки выбора на карте', () => {
    render(<DestinationInput value="" onChange={mockOnChange} onMapSelect={mockOnMapSelect} />);
    const mapButton = screen.getByText('Выбрать на карте');
    fireEvent.click(mapButton);
    expect(mockOnMapSelect).toHaveBeenCalled();
  });

  test('очищает поле при нажатии на крестик', async () => {
    render(<DestinationInput value="Москва" onChange={mockOnChange} />);
    const clearButton = screen.getByRole('button', { name: /очистить/i });
    fireEvent.click(clearButton);
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
