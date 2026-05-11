import { render, screen, fireEvent } from '@testing-library/react';
import { TicketSection } from './TicketSection';
import { TicketProvider } from '../../../../../context/TicketContext';

describe('TicketSection Component', () => {
  const mockSetTicketNumber = jest.fn();
  const mockOnTicketApply = jest.fn();
  const mockOnTicketRemove = jest.fn();

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<TicketProvider>{ui}</TicketProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает поле ввода билета', () => {
    renderWithProvider(
      <TicketSection
        ticketNumber=""
        setTicketNumber={mockSetTicketNumber}
        ticketError=""
        onTicketApply={mockOnTicketApply}
        onTicketRemove={mockOnTicketRemove}
      />,
    );
    expect(screen.getByPlaceholderText('Введите номер билета')).toBeInTheDocument();
  });

  test('отображает кнопку "Применить"', () => {
    renderWithProvider(
      <TicketSection
        ticketNumber=""
        setTicketNumber={mockSetTicketNumber}
        ticketError=""
        onTicketApply={mockOnTicketApply}
        onTicketRemove={mockOnTicketRemove}
      />,
    );
    expect(screen.getByText('Применить')).toBeInTheDocument();
  });

  test('кнопка "Применить" активна только при введённом номере', () => {
    const { rerender } = renderWithProvider(
      <TicketSection
        ticketNumber=""
        setTicketNumber={mockSetTicketNumber}
        ticketError=""
        onTicketApply={mockOnTicketApply}
        onTicketRemove={mockOnTicketRemove}
      />,
    );
    expect(screen.getByText('Применить')).toBeDisabled();

    rerender(
      <TicketProvider>
        <TicketSection
          ticketNumber="TR-123456"
          setTicketNumber={mockSetTicketNumber}
          ticketError=""
          onTicketApply={mockOnTicketApply}
          onTicketRemove={mockOnTicketRemove}
        />
      </TicketProvider>,
    );
    expect(screen.getByText('Применить')).toBeEnabled();
  });

  test('отображает ошибку при некорректном билете', () => {
    renderWithProvider(
      <TicketSection
        ticketNumber=""
        setTicketNumber={mockSetTicketNumber}
        ticketError="Неверный формат билета"
        onTicketApply={mockOnTicketApply}
        onTicketRemove={mockOnTicketRemove}
      />,
    );
    expect(screen.getByText('Неверный формат билета')).toBeInTheDocument();
  });

  test('вызывает onTicketApply при нажатии на "Применить"', () => {
    renderWithProvider(
      <TicketSection
        ticketNumber="TR-123456"
        setTicketNumber={mockSetTicketNumber}
        ticketError=""
        onTicketApply={mockOnTicketApply}
        onTicketRemove={mockOnTicketRemove}
      />,
    );
    const applyButton = screen.getByText('Применить');
    fireEvent.click(applyButton);
    expect(mockOnTicketApply).toHaveBeenCalled();
  });
});
