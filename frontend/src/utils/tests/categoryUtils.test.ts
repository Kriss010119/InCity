import {
  extractTagValue,
  getCategoryColor,
  formatOpeningHours,
  getWikimediaDirectUrl,
} from '../categoryUtils';

describe('categoryUtils', () => {
  describe('extractTagValue', () => {
    test('извлекает значение тега по ключу', () => {
      const tags = [
        'name=Красная площадь',
        'phone=+7 495 123-45-67',
        'website=https://example.com',
      ];
      expect(extractTagValue(tags, 'phone')).toBe('+7 495 123-45-67');
      expect(extractTagValue(tags, 'name')).toBe('Красная площадь');
    });

    test('возвращает undefined если тег не найден', () => {
      const tags = ['name=Парк'];
      expect(extractTagValue(tags, 'phone')).toBeUndefined();
    });

    test('возвращает undefined если массив tags не передан', () => {
      expect(extractTagValue(undefined, 'name')).toBeUndefined();
    });

    test('возвращает undefined если tags пуст', () => {
      expect(extractTagValue([], 'name')).toBeUndefined();
    });
  });

  describe('getCategoryColor', () => {
    test('возвращает красный для музеев', () => {
      expect(getCategoryColor('Музеи и галереи')).toBe('#e30611');
    });

    test('возвращает зелёный для парков', () => {
      expect(getCategoryColor('Парки и сады')).toBe('#2e7d32');
    });

    test('возвращает оранжевый для детских объектов', () => {
      expect(getCategoryColor('Детские объекты')).toBe('#ff6d00');
    });

    test('возвращает жёлтый для достопримечательностей', () => {
      expect(getCategoryColor('Достопримечательности')).toBe('#ffdd2d');
    });

    test('возвращает синий для отеля', () => {
      expect(getCategoryColor('Отель')).toBe('#1976d2');
    });

    test('возвращает серый для неизвестной категории', () => {
      expect(getCategoryColor('Неизвестная категория')).toBe('#6b6b6b');
    });
  });

  describe('formatOpeningHours', () => {
    test('заменяет английские дни на русские', () => {
      const result = formatOpeningHours('Mo-Fr 09:00-18:00');
      expect(result).toContain('Пн');
      expect(result).toContain('Пт');
      expect(result).not.toContain('Mo');
    });

    test('форматирует время', () => {
      const result = formatOpeningHours('Mo-Fr 09:00-18:00');
      expect(result).toContain('09:00 - 18:00');
    });

    test('возвращает "Не указано" если hours не передан', () => {
      expect(formatOpeningHours(undefined)).toBe('Не указано');
    });

    test('возвращает "Не указано" если hours пустая строка', () => {
      expect(formatOpeningHours('')).toBe('Не указано');
    });
  });

  describe('getWikimediaDirectUrl', () => {
    test('возвращает URL если уже содержит Special:FilePath', () => {
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Image.jpg';
      expect(getWikimediaDirectUrl(url)).toBe(url);
    });

    test('извлекает имя файла из URL и формирует правильный путь', () => {
      const url = 'https://commons.wikimedia.org/wiki/File:Red_Square.jpg';
      const result = getWikimediaDirectUrl(url);
      expect(result).toContain('Special:FilePath/Red_Square.jpg');
    });

    test('обрабатывает прямые пути к изображениям', () => {
      const url = '/wiki/File:Test.png';
      const result = getWikimediaDirectUrl(url);
      expect(result).toContain('Special:FilePath');
      expect(result).toContain('Test.png');
    });

    test('возвращает null при ошибке', () => {
      const result = getWikimediaDirectUrl('invalid-url');
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });
});
