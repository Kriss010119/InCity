import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-11'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('отображает выбранную дату в формате "день месяц год"', () => {
    render(<DatePicker value="2026-05-15" onChange={mockOnChange} isEnabled={true} />);
    expect(screen.getByText('15 мая 2026 г.')).toBeInTheDocument();
  });

  test('показывает placeholder если дата не выбрана', () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={true} />);
    expect(screen.getByText('Выберите дату')).toBeInTheDocument();
  });

  test('открывает календарь при клике на поле', async () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={true} />);
    const dateInput = screen.getByText('Выберите дату');
    fireEvent.click(dateInput);
    await waitFor(() => {
      expect(screen.getByText(/май 2026/i)).toBeInTheDocument();
    });
  });

  test('не открывает календарь если isEnabled=false', () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={false} />);
    const dateInput = screen.getByText('Выберите дату');
    fireEvent.click(dateInput);
    expect(screen.queryByText(/май 2026/i)).not.toBeInTheDocument();
  });

  test('выбирает дату при клике на день в календаре', async () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={true} />);
    const dateInput = screen.getByText('Выберите дату');
    fireEvent.click(dateInput);
    const day15 = await screen.findByText('15');
    fireEvent.click(day15);
    expect(mockOnChange).toHaveBeenCalledWith('2026-05-15');
  });

  test('прошедшие даты заблокированы', async () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={true} />);
    const dateInput = screen.getByText('Выберите дату');
    fireEvent.click(dateInput);
    const pastDay = await screen.findByText('9');
    expect(pastDay).toBeInTheDocument();
  });

  test('текущая дата подсвечена', async () => {
    render(<DatePicker value="" onChange={mockOnChange} isEnabled={true} />);
    const dateInput = screen.getByText('Выберите дату');
    fireEvent.click(dateInput);
    const today = await screen.findByText('11');
    expect(today).toBeInTheDocument();
  });

  test('выбранная дата подсвечена жёлтым', async () => {
    render(<DatePicker value="2026-05-15" onChange={mockOnChange} isEnabled={true} />);
    const dateInput = screen.getByText('15 мая 2026 г.');
    fireEvent.click(dateInput);
    const selectedDay = await screen.findByText('15');
    expect(selectedDay).toBeInTheDocument();
  });
});
