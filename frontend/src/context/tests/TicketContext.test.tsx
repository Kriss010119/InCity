/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketProvider, useTicket } from '../TicketContext';

const TestComponent = () => {
  const { ticketData, setTicketData, clearTicketData } = useTicket();
  return (
    <div>
      <span data-testid="ticket-number">{ticketData?.ticketNumber || 'none'}</span>
      <button
        onClick={() => setTicketData({ ticketNumber: 'TR-123456', ticketDetails: {} as any })}
      >
        Set Ticket
      </button>
      <button onClick={clearTicketData}>Clear Ticket</button>
    </div>
  );
};

describe('TicketContext', () => {
  test('начинается с null', () => {
    render(
      <TicketProvider>
        <TestComponent />
      </TicketProvider>,
    );
    expect(screen.getByTestId('ticket-number')).toHaveTextContent('none');
  });

  test('setTicketData обновляет данные билета', () => {
    render(
      <TicketProvider>
        <TestComponent />
      </TicketProvider>,
    );
    const setButton = screen.getByText('Set Ticket');
    fireEvent.click(setButton);
    expect(screen.getByTestId('ticket-number')).toHaveTextContent('TR-123456');
  });

  test('clearTicketData очищает данные билета', () => {
    render(
      <TicketProvider>
        <TestComponent />
      </TicketProvider>,
    );
    const setButton = screen.getByText('Set Ticket');
    fireEvent.click(setButton);
    expect(screen.getByTestId('ticket-number')).toHaveTextContent('TR-123456');

    const clearButton = screen.getByText('Clear Ticket');
    fireEvent.click(clearButton);
    expect(screen.getByTestId('ticket-number')).toHaveTextContent('none');
  });

  test('useTicket выбрасывает ошибку вне провайдера', () => {
    expect(() => render(<TestComponent />)).toThrow('useTicket must be used within TicketProvider');
  });
});
