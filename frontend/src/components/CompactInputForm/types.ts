export type FormData = {
  ticketNumber: string;
  destinationCity: string;
  travelDate: string;
  transport: string[];          
  duration: string | null;
  attractions: string[];     
  events: string[];
};

export const initialState: FormData = {
  ticketNumber: '',
  destinationCity: '',
  travelDate: '',
  transport: [],
  duration: null,
  attractions: [],
  events: [],
};