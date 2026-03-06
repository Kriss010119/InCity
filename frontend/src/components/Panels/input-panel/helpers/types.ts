import type { JSX } from "react";

export type FormData = {
  to: string;
  date: string;
  transport: string[];
  attractions: string[];
  events: string[];
  duration?: 'very-short' | 'short' | 'medium' | 'long';
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  useTicket?: boolean;
}

export type InputPanelProps = {
  onRouteUpdate: (data: FormData) => void;
  onFormChange: () => void;
  onSearch: (data: FormData) => void;
  onReset?: () => void;
  initialData?: FormData | null;
  isDestinationLocked?: boolean;
  setIsDestinationLocked?: (locked: boolean) => void;
}

export type TransportOption = {
  id: string;
  name: string;
  icon: JSX.Element;
}

export type CheckboxOption = {
  id: string;
  name: string;
}