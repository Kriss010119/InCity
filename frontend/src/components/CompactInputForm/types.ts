export type FormData = {
  ticketNumber: string;
  destinationCity: string;
  travelDate: string;
  transport: string[];          
  attractions: string[];     
  events: string[];
  duration?: 'very-short' | 'short' | 'medium' | 'long' | null;
};

export const initialState: FormData = {
  ticketNumber: '',
  destinationCity: '',
  travelDate: '',
  transport: [],
  duration: 'medium',
  attractions: [],
  events: [],
};