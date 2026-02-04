import React from 'react';
import { RouteProvider } from '../context/RouteContext';
import { ThemeProvider } from '../context/ThemeContext';

type AppProviderProps = {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <RouteProvider>
        {children}
      </RouteProvider>
    </ThemeProvider>
  );
}