import React from 'react';
import { RouteProvider } from '../context/RouteContext';
import { ThemeProvider } from '../context/ThemeContext';
import { TicketProvider } from '../context/TicketContext';
import { PlaceCacheProvider } from '../context/PlaceCacheContext';

type AppProviderProps = {
  children: React.ReactNode;
};

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <PlaceCacheProvider>
        <TicketProvider>
          <RouteProvider>{children}</RouteProvider>
        </TicketProvider>
      </PlaceCacheProvider>
    </ThemeProvider>
  );
}
