import { createContext, useState, useContext, type ReactNode } from 'react';
import type { TicketData } from '../types';

type TicketContextType = {
  ticketData: TicketData | null;
  setTicketData: (data: TicketData | null) => void;
  clearTicketData: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [ticketData, setTicketData] = useState<TicketData | null>(() => {
    const saved = localStorage.getItem('ticketData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetTicketData = (data: TicketData | null) => {
    setTicketData(data);
    if (data) {
      localStorage.setItem('ticketData', JSON.stringify(data));
    } else {
      localStorage.removeItem('ticketData');
    }
  };

  const clearTicketData = () => {
    setTicketData(null);
    localStorage.removeItem('ticketData');
  };

  return (
    <TicketContext.Provider
      value={{
        ticketData,
        setTicketData: handleSetTicketData,
        clearTicketData,
        isLoading,
        setIsLoading,
        error,
        setError,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTicket = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicket must be used within TicketProvider');
  }
  return context;
};
