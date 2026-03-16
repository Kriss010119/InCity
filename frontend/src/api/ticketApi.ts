import axios from 'axios';
import type { TicketDetails } from '../types/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  timeout: 10000,
});

export const fetchTicketDetails = async (ticketNumber: string): Promise<TicketDetails> => {
  try {
    const response = await api.get(`/tickets/${ticketNumber}`);
    return response.data;
  } catch (error) {
    if (ticketNumber.includes('TR-')) {
      return {
        orderType: 'train',
        orderId: ticketNumber,
        createdAt: new Date().toISOString(),
        details: {
          departureStationCode: '2004000',
          arrivalStationCode: '2000000',
          departureDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          arrivalDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          departureTime: '08:30',
          arrivalTime: '12:45',
          passengers: 1
        }
      };
    } else if (ticketNumber.includes('HT-')) {
      return {
        orderType: 'hotel',
        orderId: ticketNumber,
        createdAt: new Date().toISOString(),
        details: {
          hotelName: 'Lotte Hotel Moscow',
          coordinates: {
            latitude: 55.7494,
            longitude: 37.5820
          },
          checkIn: new Date(Date.now() + 86400000).toISOString(),
          checkOut: new Date(Date.now() + 172800000).toISOString()
        }
      };
    }
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Ошибка при загрузке данных билета');
    }
    throw error;
  }
};