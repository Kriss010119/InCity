import type { FormData } from '../types';
import type { TicketDetails } from '../types';

export const geocodeCity = async (city: string): Promise<{ lat: number; lng: number } | null> => {
  if (!city.trim()) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&countrycodes=ru`,
      { headers: { 'User-Agent': 'InCityApp/1.0' } },
    );
    const data = await response.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const applyTicketToFormData = (
  ticketNumber: string,
  ticketDetails: TicketDetails,
): Partial<FormData> => {
  if (ticketDetails.orderType === 'train') {
    const city =
      ticketDetails.details.arrivalStationCode === '2000000' ? 'Москва' : 'Санкт-Петербург';
    const lat = city === 'Москва' ? 55.7558 : 59.9343;
    const lng = city === 'Москва' ? 37.6173 : 30.3351;
    return {
      to: city,
      date: ticketDetails.details.departureDate,
      destinationLat: lat,
      destinationLng: lng,
      destinationName: city,
      useTicket: true,
    };
  } else if (ticketDetails.orderType === 'hotel') {
    return {
      to: ticketDetails.details.hotelName,
      date: ticketDetails.details.checkIn.split('T')[0],
      destinationLat: ticketDetails.details.coordinates.latitude,
      destinationLng: ticketDetails.details.coordinates.longitude,
      destinationName: ticketDetails.details.hotelName,
      useTicket: true,
    };
  }
  return {};
};
