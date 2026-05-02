export const geocodeCity = async (city: string): Promise<{ lat: number; lng: number } | null> => {
  if (!city.trim()) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&countrycodes=ru`,
      { headers: { 'User-Agent': 'InCityApp/1.0' } }
    );
    const data = await response.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
};

export const getTicketData = (ticketNumber: string): { city: string; date: string; lat: number; lng: number } | null => {
  if (ticketNumber.startsWith('TR-')) {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return { city: 'Москва', date, lat: 55.7558, lng: 37.6173 };
  }
  if (ticketNumber.startsWith('HT-')) {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return { city: 'Лотте Отель Москва', date, lat: 55.7494, lng: 37.5820 };
  }
  return null;
};