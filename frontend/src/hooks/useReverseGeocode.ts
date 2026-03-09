import { useCallback } from 'react';

export const useReverseGeocode = () => {
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }
      
      const address = data.address;
      if (address) {
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.house_number) parts.push(address.house_number);
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }
        if (parts.length > 0) return parts.join(', ');
      }
      
      return `Точка на карте (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `Точка на карте (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  }, []);

  return { reverseGeocode };
};