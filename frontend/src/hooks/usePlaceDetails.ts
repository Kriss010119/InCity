import { useState, useEffect } from 'react';
import { usePlaceCache } from '../context/PlaceCacheContext';
import type { VisitPoint } from '../types';

type PlaceDetails = {
  description?: string;
  images?: string[];
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  wikidata?: string;
  wikipedia?: string;
  wikipediaExtract?: string;
  wikipediaImage?: string;
  wikipediaUrl?: string;
  imageLicense?: string;
  imageAuthor?: string;
  source?: 'cache' | 'wikipedia' | 'wikidata' | 'osm';
};

const getWikimediaDirectUrl = (url: string): string | null => {
  try {
    if (url.includes('Special:FilePath')) return url;

    let fileName = '';
    const patterns = [
      /File:(.+?)(?:\||$)/,
      /\/wiki\/(?:File:|Special:FilePath\/)?(.+?)(?:\?|$)/,
      /\/([^/]+\.(?:jpg|jpeg|png|gif|svg))(?:\?|$)/i,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        fileName = match[1];
        break;
      }
    }
    if (!fileName) return url;

    fileName = decodeURIComponent(fileName).replace(/File:/g, '').trim();
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;
  } catch (e) {
    console.warn('Failed to parse Wikimedia URL:', url, e);
    return null;
  }
};

export const usePlaceDetails = (place: VisitPoint | null) => {
  const [details, setDetails] = useState<PlaceDetails>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCachedData, setCachedData } = usePlaceCache();
  const getTagValue = (tags: string[] | undefined, key: string): string | undefined => {
    if (!tags) return undefined;
    const tag = tags.find((t) => t.startsWith(key + '='));
    return tag?.split('=')[1];
  };

  useEffect(() => {
    if (!place) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchDetails = async () => {
      const cached = getCachedData(place.id);
      if (cached) {
        if (isMounted) {
          setDetails({ ...cached.details, source: 'cache' });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tags = place.tags || [];

        const parsedDetails: PlaceDetails = {
          address:
            getTagValue(tags, 'addr:full') ||
            `${getTagValue(tags, 'addr:street') || ''} ${getTagValue(tags, 'addr:housenumber') || ''}`.trim() ||
            getTagValue(tags, 'address'),
          phone: getTagValue(tags, 'phone') || getTagValue(tags, 'contact:phone'),
          website: getTagValue(tags, 'website') || getTagValue(tags, 'contact:website'),
          openingHours: getTagValue(tags, 'opening_hours'),
          wikidata: getTagValue(tags, 'wikidata'),
          wikipedia: getTagValue(tags, 'wikipedia'),
          source: 'osm',
        };

        const images: string[] = [];
        tags.forEach((tag) => {
          if (tag.startsWith('image=') || tag.startsWith('image:')) {
            const value = tag.split('=')[1];
            if (value) {
              const directUrl = getWikimediaDirectUrl(value);
              if (directUrl) images.push(directUrl);
            }
          }
        });

        if (parsedDetails.wikipedia) {
          await fetchWikipediaData(parsedDetails, images, abortController.signal);
        } else if (parsedDetails.wikidata) {
          await fetchWikidataData(parsedDetails, images, abortController.signal);
        }

        if (isMounted) {
          setCachedData(place.id, parsedDetails, images);
          setDetails(parsedDetails);
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

  const fetchWikipediaData = async (parsedDetails: PlaceDetails, images: string[], signal: AbortSignal) => {
    if (!parsedDetails.wikipedia) return;

    try {
      let wikiLang = 'ru';
      let wikiTitle = parsedDetails.wikipedia;

      if (parsedDetails.wikipedia.includes(':')) {
        const parts = parsedDetails.wikipedia.split(':');
        wikiLang = parts[0];
        wikiTitle = parts[1];
      }

      const response = await fetch(
        `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
        { signal, headers: { Accept: 'application/json', 'User-Agent': 'InCity/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        parsedDetails.wikipediaExtract = data.extract;
        parsedDetails.wikipediaUrl = data.content_urls?.desktop?.page;
        parsedDetails.source = 'wikipedia';

        if (data.thumbnail?.source && images.length === 0) {
          const thumbnailUrl = data.thumbnail.source;
          let highQualityUrl = thumbnailUrl;

          if (thumbnailUrl.includes('/thumb/')) {
            highQualityUrl = thumbnailUrl.replace('/thumb/', '/');
            const lastSlashIndex = highQualityUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const fileNamePart = highQualityUrl.substring(lastSlashIndex + 1);
              const cleanFileName = fileNamePart.replace(/^\d+px-/, '');
              highQualityUrl = highQualityUrl.substring(0, lastSlashIndex + 1) + cleanFileName;
            }
          }

          const fileNameMatch = thumbnailUrl.match(/\/([^/]+?)(?:\/\d+px-|$)/);
          if (fileNameMatch) {
            const fileName = fileNameMatch[1];
            const wikimediaUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=2000`;
            parsedDetails.images = [wikimediaUrl, highQualityUrl];
          } else {
            parsedDetails.images = [highQualityUrl];
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Failed to fetch Wikipedia data:', error);
      }
    }
  };

  const fetchWikidataData = async (parsedDetails: PlaceDetails, images: string[], signal: AbortSignal) => {
    if (!parsedDetails.wikidata) return;

    try {
      const response = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${parsedDetails.wikidata}.json`,
        { signal, headers: { Accept: 'application/json', 'User-Agent': 'InCity/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        const entity = data.entities[parsedDetails.wikidata];

        const imageClaim = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (imageClaim && images.length === 0) {
          const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageClaim)}?width=2000`;
          parsedDetails.images = [imageUrl];
          parsedDetails.source = 'wikidata';
        }

        const description = entity.descriptions?.ru?.value;
        if (description && !parsedDetails.wikipediaExtract) {
          parsedDetails.description = description;
        }

        const wikiLinks = entity.sitelinks;
        if (wikiLinks?.ruwiki?.title && !parsedDetails.wikipedia) {
          parsedDetails.wikipedia = `ru:${wikiLinks.ruwiki.title}`;
          await fetchWikipediaData(parsedDetails, images, signal);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Failed to fetch Wikidata data:', error);
      }
    }
  };

  return { details, isLoading, error };
};