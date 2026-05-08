export type FormData = {
  to: string;
  date: string;
  transport: string[];
  attractions: string[];
  events: string[];
  duration?: 'very-short' | 'short' | 'medium' | 'long' | null;
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  useTicket?: boolean;
};

export type InputPanelProps = {
  onRouteUpdate: (data: FormData) => void;
  onFormChange: () => void;
  onSearch: (data: FormData) => void;
  onReset?: () => void;
  initialData?: FormData | null;
  isDestinationLocked?: boolean;
  isSelectingOnMap?: boolean;
  setIsDestinationLocked?: (locked: boolean) => void;
  onMapSelectModeChange?: (isSelecting: boolean) => void;
  onDestinationSelect?: (lat: number, lng: number, address?: string) => void;
};

export type TransportOption = {
  id: string;
  name: string;
  icon?: React.ReactNode;
};

export type CheckboxOption = {
  id: string;
  name: string;
};
