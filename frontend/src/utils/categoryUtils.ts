export const extractTagValue = (tags: string[] | undefined, key: string): string | undefined => {
  if (!tags) return undefined;
  const tag = tags.find(t => t.startsWith(key + '='));
  return tag?.split('=')[1];
};

export const getWikimediaDirectUrl = (url: string): string | null => {
  try {
    if (url.includes('Special:FilePath')) return url;
    if (url.includes('wikimedia.org')) {
      const fileNameMatch = url.match(/\/wiki\/(?:File:|Special:FilePath\/)?(.+?)(?:\?|$)/) || url.match(/\/([^/]+\.(?:jpg|jpeg|png|gif|svg))(?:\?|$)/i);
      if (fileNameMatch) {
        let fileName = fileNameMatch[1];
        fileName = decodeURIComponent(fileName).replace(/File:/g, '').trim();
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;
      }
    }
    if (!url.startsWith('http')) {
      const fileName = url.replace(/File:/g, '').trim();
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;
    }
    return url;
  } catch (e) {
    console.warn('Failed to parse Wikimedia URL:', url, e);
    return null;
  }
};

export const formatOpeningHours = (hours?: string): string => {
  if (!hours) return 'Не указано';
  const days: Record<string, string> = {
    'Mo': 'Пн', 'Tu': 'Вт', 'We': 'Ср', 'Th': 'Чт', 
    'Fr': 'Пт', 'Sa': 'Сб', 'Su': 'Вс'
  };
  let formatted = hours;
  Object.entries(days).forEach(([eng, rus]) => {
    formatted = formatted.replace(new RegExp(eng, 'g'), rus);
  });
  formatted = formatted.replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/g, '$1 - $2');
  return formatted;
};

export const getSourceLabel = (source?: string): string => {
  switch(source) {
    case 'cache': return 'Из кэша';
    case 'wikipedia': return 'Wikipedia';
    case 'wikidata': return 'Wikidata';
    case 'osm': return 'OpenStreetMap';
    default: return '';
  }
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Музеи и галереи': '#e30611',
    'Парки и сады': '#2e7d32',
    'Детские объекты': '#ff6d00',
    'Достопримечательности': '#ffdd2d',
    'Отель': '#1976d2',
    'Рестораны': '#c2185b',
    'Театры': '#7b1fa2',
    'Зоопарки и аквариумы': '#ff6d00',
    'Музеи искусств': '#e30611',
    'Городские парки': '#2e7d32'
  };
  return colors[category] || '#6b6b6b';
};

export const validateTicketNumber = (value: string): boolean => {
  return value.trim().length >= 8 && /^[A-Za-z0-9-]+$/.test(value.trim());
};

export const normalizeTicketNumber = (value: string): string => {
  return value.trim().toUpperCase();
};

export const createRouteDataFromTicket = (ticketDetails: any) => {
  const routeData: any = { transport: [], attractions: [], events: [] };
  if (ticketDetails.orderType === 'train') {
    routeData.from = ticketDetails.details.departureStationCode === '2004000' ? 'Санкт-Петербург' : 'Москва';
    routeData.to = ticketDetails.details.arrivalStationCode === '2000000' ? 'Москва' : 'Санкт-Петербург';
    routeData.date = ticketDetails.details.departureDate;
  } else if (ticketDetails.orderType === 'hotel') {
    routeData.from = '';
    routeData.to = ticketDetails.details.hotelName;
    routeData.date = ticketDetails.details.checkIn.split('T')[0];
    routeData.destinationLat = ticketDetails.details.coordinates.latitude;
    routeData.destinationLng = ticketDetails.details.coordinates.longitude;
    routeData.destinationName = ticketDetails.details.hotelName;
  }
  return routeData;
};