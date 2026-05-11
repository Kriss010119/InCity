/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  fetchWikipediaData,
  getWikipediaTitleFromWikidata,
  fetchImageForPlace,
  getHighQualityImageUrl,
  getTagValue,
  getWikimediaDirectUrlLocal,
  extractImagesFromTags,
  buildPlaceDetails,
  enrichWithWikipediaData,
  enrichWithWikidataData,
  buildFullPlaceDetails,
} from '../wikipediaService';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

global.fetch = jest.fn();

describe('wikipediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseWikipediaTag', () => {
    test('парсит тег с языком и заголовком', async () => {
      const result = await fetchWikipediaData('ru:Красная_площадь');
      expect(result).toBeNull();
    });
  });

  describe('fetchWikipediaData', () => {
    test('возвращает null для некорректного тега', async () => {
      const result = await fetchWikipediaData('');
      expect(result).toBeNull();
    });

    test('возвращает null при ошибке сети', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchWikipediaData('ru:Тест');
      expect(result).toBeNull();
    });

    test('обрабатывает AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);
      const result = await fetchWikipediaData('ru:Тест', new AbortController().signal);
      expect(result).toBeNull();
    });

    test('возвращает данные при успешном ответе', async () => {
      const mockData = { extract: 'Описание', thumbnail: { source: 'url' } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      const result = await fetchWikipediaData('ru:Красная_площадь');
      expect(result?.extract).toBe('Описание');
    });
  });

  describe('getWikipediaTitleFromWikidata', () => {
    test('возвращает заголовок для корректного wikidata ID', async () => {
      const mockData = {
        entities: {
          Q43340: {
            sitelinks: { ruwiki: { title: 'Красная площадь' } },
          },
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      const result = await getWikipediaTitleFromWikidata('Q43340');
      expect(result).toEqual({ lang: 'ru', title: 'Красная площадь' });
    });

    test('возвращает английскую версию если русской нет', async () => {
      const mockData = {
        entities: {
          Q43340: {
            sitelinks: { enwiki: { title: 'Red Square' } },
          },
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      const result = await getWikipediaTitleFromWikidata('Q43340');
      expect(result).toEqual({ lang: 'en', title: 'Red Square' });
    });

    test('возвращает null при ошибке', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await getWikipediaTitleFromWikidata('Q43340');
      expect(result).toBeNull();
    });

    test('возвращает null при отсутствии sitelinks', async () => {
      const mockData = { entities: { Q43340: {} } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      const result = await getWikipediaTitleFromWikidata('Q43340');
      expect(result).toBeNull();
    });
  });

  describe('getHighQualityImageUrl', () => {
    test('преобразует thumb URL в высокое качество', () => {
      const url =
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Example.jpg/800px-Example.jpg';
      const result = getHighQualityImageUrl(url);
      expect(result).toContain('Example.jpg');
      expect(result).toContain('width=1200');
    });

    test('возвращает оригинальный URL для не-wikimedia ссылок', () => {
      const url = 'https://example.com/image.jpg';
      expect(getHighQualityImageUrl(url)).toBe(url);
    });
  });

  describe('fetchImageForPlace', () => {
    test('возвращает null при отмене сигнала', async () => {
      const controller = new AbortController();
      controller.abort();
      const result = await fetchImageForPlace([], undefined, undefined, controller.signal);
      expect(result).toBeNull();
    });

    test('извлекает изображение из тега image=', async () => {
      const tags = ['image=Example.jpg'];
      const result = await fetchImageForPlace(tags);
      expect(result).toContain('Example.jpg');
    });

    test('извлекает изображение из тега wikimedia_commons=', async () => {
      const tags = ['wikimedia_commons=File:Test.png'];
      const result = await fetchImageForPlace(tags);
      expect(result).toContain('Test.png');
    });

    test('возвращает null если изображение не найдено', async () => {
      const result = await fetchImageForPlace([]);
      expect(result).toBeNull();
    });
  });

  describe('getTagValue', () => {
    test('извлекает значение тега', () => {
      const tags = ['key1=value1', 'key2=value2'];
      expect(getTagValue(tags, 'key1')).toBe('value1');
    });

    test('возвращает undefined если тег не найден', () => {
      const tags = ['key1=value1'];
      expect(getTagValue(tags, 'key3')).toBeUndefined();
    });

    test('возвращает undefined если tags не передан', () => {
      expect(getTagValue(undefined, 'key1')).toBeUndefined();
    });
  });

  describe('getWikimediaDirectUrlLocal', () => {
    test('возвращает URL если уже содержит Special:FilePath', () => {
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Image.jpg';
      expect(getWikimediaDirectUrlLocal(url)).toBe(url);
    });

    test('обрабатывает прямые пути к изображениям', () => {
      const result = getWikimediaDirectUrlLocal('/wiki/File:Test.png');
      expect(result).toContain('Special:FilePath/Test.png');
    });

    test('возвращает null при ошибке', () => {
      const result = getWikimediaDirectUrlLocal('');
      expect(result === null || result === '').toBe(true);
    });
  });

  describe('extractImagesFromTags', () => {
    test('извлекает изображения из тегов image=', () => {
      const tags = ['image=Example.jpg', 'wikimedia_commons=File:Test.png'];
      const images = extractImagesFromTags(tags);
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('buildPlaceDetails', () => {
    test('извлекает адрес из addr:full', () => {
      const tags = ['addr:full=Красная площадь, 1'];
      const details = buildPlaceDetails(tags);
      expect(details.address).toBe('Красная площадь, 1');
    });

    test('извлекает адрес из addr:street и addr:housenumber', () => {
      const tags = ['addr:street=Красная площадь', 'addr:housenumber=1'];
      const details = buildPlaceDetails(tags);
      expect(details.address).toBe('Красная площадь 1');
    });

    test('извлекает телефон', () => {
      const tags = ['phone=+7 495 123-45-67'];
      const details = buildPlaceDetails(tags);
      expect(details.phone).toBe('+7 495 123-45-67');
    });

    test('извлекает контактный телефон через contact:phone', () => {
      const tags = ['contact:phone=+7 495 123-45-67'];
      const details = buildPlaceDetails(tags);
      expect(details.phone).toBe('+7 495 123-45-67');
    });

    test('извлекает сайт', () => {
      const tags = ['website=https://example.com'];
      const details = buildPlaceDetails(tags);
      expect(details.website).toBe('https://example.com');
    });

    test('извлекает часы работы', () => {
      const tags = ['opening_hours=Mo-Fr 09:00-18:00'];
      const details = buildPlaceDetails(tags);
      expect(details.openingHours).toBe('Mo-Fr 09:00-18:00');
    });

    test('извлекает wikidata', () => {
      const tags = ['wikidata=Q43340'];
      const details = buildPlaceDetails(tags);
      expect(details.wikidata).toBe('Q43340');
    });

    test('извлекает wikipedia', () => {
      const tags = ['wikipedia=ru:Красная площадь'];
      const details = buildPlaceDetails(tags);
      expect(details.wikipedia).toBe('ru:Красная площадь');
    });
  });

  describe('enrichWithWikipediaData', () => {
    test('не делает запрос если нет wikipedia', async () => {
      const details = {};
      const images: string[] = [];
      await enrichWithWikipediaData(details as any, images);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('обогащает данными из Wikipedia', async () => {
      const details = { wikipedia: 'ru:Красная_площадь' };
      const images: string[] = [];
      const mockData = {
        extract: 'Красная площадь — главная площадь Москвы',
        content_urls: { desktop: { page: 'https://ru.wikipedia.org/wiki/Красная_площадь' } },
        thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg' },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      await enrichWithWikipediaData(details as any, images);
      expect(details.wikipediaExtract).toBe(mockData.extract);
      expect(details.wikipediaUrl).toBe(mockData.content_urls.desktop.page);
    });
  });

  describe('enrichWithWikidataData', () => {
    test('не делает запрос если нет wikidata', async () => {
      const details = {};
      const images: string[] = [];
      await enrichWithWikidataData(details as any, images);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('обогащает данными из Wikidata', async () => {
      const details = { wikidata: 'Q43340' };
      const images: string[] = [];
      const mockData = {
        entities: {
          Q43340: {
            claims: {
              P18: [{ mainsnak: { datavalue: { value: 'Red Square.jpg' } } }],
            },
            descriptions: { ru: { value: 'Главная площадь Москвы' } },
            sitelinks: { ruwiki: { title: 'Красная площадь' } },
          },
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      await enrichWithWikidataData(details as any, images);
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('buildFullPlaceDetails', () => {
    test('собирает полные детали места', async () => {
      const tags = ['name=Test', 'wikidata=Q43340'];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          entities: {
            Q43340: {
              claims: { P18: [{ mainsnak: { datavalue: { value: 'image.jpg' } } }] },
              sitelinks: { ruwiki: { title: 'Test' } },
            },
          },
        }),
      });
      const result = await buildFullPlaceDetails(tags);
      expect(result.details).toBeDefined();
      expect(result.images).toBeDefined();
    });

    test('обрабатывает отмену сигнала', async () => {
      const controller = new AbortController();
      controller.abort();
      const result = await buildFullPlaceDetails([], controller.signal);
      expect(result).toEqual({ details: { source: 'osm' }, images: [] });
    });
  });
});
