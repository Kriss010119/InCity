import { mapAttractionsToBackend, MAIN_CATEGORIES, EVENT_TYPES } from '../filterConstants';

describe('filterConstants', () => {
  describe('mapAttractionsToBackend', () => {
    test('преобразует музейные категории', () => {
      const result = mapAttractionsToBackend(['historical', 'art', 'nature']);
      expect(result.main).toContain('museum');
      expect(result.sub).toContain('historical');
      expect(result.sub).toContain('art');
      expect(result.sub).toContain('nature');
    });

    test('преобразует парковые категории', () => {
      const result = mapAttractionsToBackend(['urban', 'natural']);
      expect(result.main).toContain('park-and-garden');
      expect(result.sub).toContain('urban');
      expect(result.sub).toContain('natural');
    });

    test('преобразует архитектурные категории', () => {
      const result = mapAttractionsToBackend(['historic-architecture', 'castles']);
      expect(result.main).toContain('architecture');
    });

    test('возвращает пустые массивы для неизвестных категорий', () => {
      const result = mapAttractionsToBackend(['unknown']);
      expect(result.main).toEqual([]);
      expect(result.sub).toEqual([]);
    });

    test('удаляет дубликаты main категорий', () => {
      const result = mapAttractionsToBackend(['historical', 'art']);
      expect(result.main).toContain('museum');
      expect(new Set(result.main).size).toBe(1);
    });

    test('mapAttractionsToBackend обрабатывает все категории', () => {
      const allCategories = [
        'historical',
        'art',
        'nature',
        'war',
        'gallery',
        'general-museum',
        'historic-architecture',
        'castles',
        'urban',
        'natural',
        'sculpture',
        'memorials',
        'fountains',
        'academic',
        'concert-hall',
        'cinema-hall',
      ];
      const result = mapAttractionsToBackend(allCategories);
      expect(result.main.length).toBeGreaterThan(0);
    });

    test('MAIN_CATEGORIES содержит все иконки', () => {
      for (const category of MAIN_CATEGORIES) {
        expect(category.icon).toBeDefined();
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
      }
    });
  });

  describe('MAIN_CATEGORIES', () => {
    test('содержит 11 категорий', () => {
      expect(MAIN_CATEGORIES.length).toBe(11);
    });

    test('каждая категория имеет id, name, icon и options', () => {
      MAIN_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(Array.isArray(category.options)).toBe(true);
      });
    });
  });

  describe('EVENT_TYPES', () => {
    test('содержит 8 типов событий', () => {
      expect(EVENT_TYPES.options.length).toBe(8);
    });

    test('каждый тип события имеет id, name, icon', () => {
      EVENT_TYPES.options.forEach((option) => {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('name');
        expect(option).toHaveProperty('icon');
      });
    });
  });
});
