import { getWikimediaDirectUrl } from '../utils/categoryUtils';

const parseWikipediaTag = (wikipediaTag: string): { lang: string; title: string } | null => {
  const parts = wikipediaTag.split(':');
  if (parts.length === 2) {
    return { lang: parts[0], title: parts[1].replace(/ /g, '_') };
  }
  if (parts.length === 1) {
    return { lang: 'ru', title: parts[0].replace(/ /g, '_') };
  }
  return null;
};

export const fetchWikipediaData = async (
  wikipediaTag: string,
  signal?: AbortSignal
) => {
  const parsed = parseWikipediaTag(wikipediaTag);
  if (!parsed) {
    return null;
  }

  const { lang, title } = parsed;
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'InCity/1.0' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      extract: data.extract,
      content_urls: data.content_urls,
      thumbnail: data.thumbnail?.source,
    };
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.warn('Wikipedia summary fetch failed:', error);
    }
    return null;
  }
};

export const getWikipediaTitleFromWikidata = async (
  wikidataId: string
): Promise<{ lang: string; title: string } | null> => {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'InCity/1.0' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const entity = data.entities[wikidataId];
    if (!entity?.sitelinks) return null;

    const preferred = ['ruwiki', 'enwiki'];
    for (const lang of preferred) {
      if (entity.sitelinks[lang]) {
        return {
          lang: lang.replace('wiki', ''),
          title: entity.sitelinks[lang].title,
        };
      }
    }

    for (const key in entity.sitelinks) {
      if (key.endsWith('wiki')) {
        return {
          lang: key.replace('wiki', ''),
          title: entity.sitelinks[key].title,
        };
      }
    }
  } catch (e) {
    console.warn('Wikidata lookup failed:', e);
  }
  return null;
};

export const getHighQualityImageUrl = (thumbUrl: string): string => {
  if (thumbUrl.includes('upload.wikimedia.org')) {
    let highQuality = thumbUrl;
    if (thumbUrl.includes('/thumb/')) {
      highQuality = thumbUrl.replace('/thumb/', '/');
      const lastSlash = highQuality.lastIndexOf('/');
      if (lastSlash !== -1) {
        const pathWithoutSize = highQuality.substring(0, lastSlash);
        const fileNamePart = highQuality.substring(lastSlash + 1);
        const cleanFileName = fileNamePart.replace(/^\d+px-/, '');
        highQuality = `${pathWithoutSize}/${cleanFileName}`;
      }
    }
    if (!highQuality.includes('?') && !highQuality.includes('width=')) {
      highQuality += '?width=1200';
    }
    return highQuality;
  }
  return thumbUrl;
};

export const fetchImageForPlace = async (
  tags: string[],
  wikipedia?: string,
  wikidata?: string,
  signal?: AbortSignal
): Promise<string | null> => {
  if (signal?.aborted) return null;

  for (const tag of tags) {
    if (tag.startsWith('image=') || tag.startsWith('image:')) {
      const value = tag.split(/[=:]/)[1];
      if (value) {
        const directUrl = getWikimediaDirectUrl(value);
        if (directUrl) return directUrl;
      }
    }
  }

  const commonsTag = tags.find((t) => t.startsWith('wikimedia_commons='));
  if (commonsTag) {
    const fileName = commonsTag.split('=')[1];
    const direct = getWikimediaDirectUrl(fileName);
    if (direct) return direct;
  }

  if (wikipedia) {
    if (signal?.aborted) return null;
    
    const wikiData = await fetchWikipediaData(wikipedia, signal);
    if (wikiData?.thumbnail) {
      return getHighQualityImageUrl(wikiData.thumbnail);
    }

    if (signal?.aborted) return null;
    
    try {
      const parsed = parseWikipediaTag(wikipedia);
      if (parsed) {
        const apiUrl = `https://${parsed.lang}.wikipedia.org/w/api.php?` +
          `action=query&titles=${encodeURIComponent(parsed.title)}&` +
          `prop=pageimages&format=json&pithumbsize=800&origin=*`;
        const resp = await fetch(apiUrl, { signal });
        const json = await resp.json();
        const pages = json.query?.pages;
        if (pages) {
          const page = Object.values(pages)[0] as any;
          if (page.thumbnail?.source) {
            return getHighQualityImageUrl(page.thumbnail.source);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.warn('Image fetch via action=query failed:', e);
      }
    }
  }

  if (wikidata && !wikipedia) {
    if (signal?.aborted) return null;
    
    try {
      const resp = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${wikidata}.json`,
        { signal, headers: { Accept: 'application/json', 'User-Agent': 'InCity/1.0' } }
      );
      const data = await resp.json();
      const entity = data.entities[wikidata];

      const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (imageClaim) {
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageClaim)}?width=2000`;
      }

      const wikiFromWikidata = await getWikipediaTitleFromWikidata(wikidata);
      if (wikiFromWikidata && !signal?.aborted) {
        const simulatedTag = `${wikiFromWikidata.lang}:${wikiFromWikidata.title}`;
        return fetchImageForPlace(tags, simulatedTag, undefined, signal);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.warn('Wikidata image fetch failed:', e);
      }
    }
  }

  return null;
};

export const fetchWikipediaDescription = async (wikipediaTag: string): Promise<string | null> => {
  const data = await fetchWikipediaData(wikipediaTag);
  return data?.extract || null;
};

export const getTagValue = (tags: string[] | undefined, key: string): string | undefined => {
  if (!tags) return undefined;
  const tag = tags.find((t) => t.startsWith(key + '='));
  return tag?.split('=')[1];
};

export const getWikimediaDirectUrlLocal = (url: string): string | null => {
  try {
    if (url.includes('Special:FilePath')) {
      return url;
    }

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

export const extractImagesFromTags = (tags: string[]): string[] => {
  const images: string[] = [];
  tags.forEach((tag) => {
    if (tag.startsWith('image=') || tag.startsWith('image:')) {
      const value = tag.split('=')[1];
      if (value) {
        const directUrl = getWikimediaDirectUrlLocal(value);
        if (directUrl) images.push(directUrl);
      }
    }
    if (tag.startsWith('wikimedia_commons=')) {
      const value = tag.substring(18);
      const directUrl = getWikimediaDirectUrlLocal(value);
      if (directUrl) images.push(directUrl);
    }
  });
  return images;
};

export const enrichWithWikipediaData = async (
  parsedDetails: any,
  images: string[],
  signal?: AbortSignal
) => {
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
          images.push(wikimediaUrl);
          images.push(highQualityUrl);
        } else {
          images.push(highQualityUrl);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.warn('Failed to fetch Wikipedia data:', error);
    }
  }
};

export const enrichWithWikidataData = async (
  parsedDetails: any,
  images: string[],
  signal?: AbortSignal
) => {
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
        images.push(imageUrl);
        parsedDetails.source = 'wikidata';
      }

      const description = entity.descriptions?.ru?.value;
      if (description && !parsedDetails.wikipediaExtract) {
        parsedDetails.description = description;
      }

      const wikiLinks = entity.sitelinks;
      if (wikiLinks?.ruwiki?.title && !parsedDetails.wikipedia) {
        parsedDetails.wikipedia = `ru:${wikiLinks.ruwiki.title}`;
        await enrichWithWikipediaData(parsedDetails, images, signal);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.warn('Failed to fetch Wikidata data:', error);
    }
  }
};

export const buildPlaceDetails = (tags: string[]): any => {
  return {
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
};

export const buildFullPlaceDetails = async (
  tags: string[],
  signal?: AbortSignal
): Promise<{ details: any; images: string[] }> => {
  const details = buildPlaceDetails(tags);
  const images = extractImagesFromTags(tags);

  const wikipedia = tags.find(t => t.startsWith('wikipedia='))?.split('=')[1];
  const wikidata = tags.find(t => t.startsWith('wikidata='))?.split('=')[1];

  const externalImage = await fetchImageForPlace(tags, wikipedia, wikidata, signal);
  if (externalImage && !images.includes(externalImage)) {
    images.push(externalImage);
  }

  if (details.wikipedia) {
    await enrichWithWikipediaData(details, images, signal);
  } else if (details.wikidata) {
    await enrichWithWikidataData(details, images, signal);
  }

  return { details, images };
};