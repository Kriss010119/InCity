import { useState, useEffect } from 'react';
import { buildFullPlaceDetails } from '../api/wikipediaService';
import type { VisitPoint, PlaceDetails } from '../types';
import { usePlaceCache } from '../context/PlaceCacheContext';

export const usePlaceDetails = (place: VisitPoint | null) => {
  const [details, setDetails] = useState<PlaceDetails>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCachedData, setCachedData } = usePlaceCache();

  useEffect(() => {
    if (!place) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchDetails = async () => {
      const cached = getCachedData(place.id);
      if (cached) {
        if (isMounted) {
          setDetails({
            ...cached.details,
            images: cached.images || [],
            source: 'cache',
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { details: parsedDetails, images } = await buildFullPlaceDetails(
          place.tags || [],
          abortController.signal,
        );

        if (isMounted) {
          setCachedData(place.id, parsedDetails, images);
          setDetails({ ...parsedDetails, images });
        }
      } catch (err) {
        if (isMounted && err instanceof Error && err.name !== 'AbortError') {
          setError('Не удалось загрузить дополнительную информацию');
          console.error('Error fetching place details:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [place, getCachedData, setCachedData]);

  return { details, isLoading, error };
};
