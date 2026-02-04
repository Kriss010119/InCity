import React, { createContext, useState, type ReactNode } from 'react';
import { type RouteStateType } from '../types/types';

const initialState: RouteStateType = {
  from: null,
  to: null,
  places: []
};

interface RouteContextType {
  route: RouteStateType;
  setRoute: React.Dispatch<React.SetStateAction<RouteStateType>>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const RouteContext = createContext<RouteContextType | undefined>(undefined);

interface RouteProviderProps {
  children: ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps) {
  const [route, setRoute] = useState<RouteStateType>(initialState);

  const value = React.useMemo(() => ({
    route,
    setRoute
  }), [route]);

  return (
    <RouteContext.Provider value={value}>
      {children}
    </RouteContext.Provider>
  );
}