import React from 'react';
import { RouteProvider } from '../context/RouteContext';
import { ThemeProvider } from '../context/ThemeContext';
import { TicketProvider } from '../context/TicketContext';
import { PlaceCacheProvider } from '../context/PlaceCacheContext';

type AppProviderProps = {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <TicketProvider>
        <PlaceCacheProvider>
          <RouteProvider>
            {children}
          </RouteProvider>
        </PlaceCacheProvider>
      </TicketProvider>
    </ThemeProvider>
  );
}