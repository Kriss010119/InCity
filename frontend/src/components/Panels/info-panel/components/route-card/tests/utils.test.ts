import { extractSectionIndexFromGapId } from '../utils';

describe('route-card utils', () => {
  describe('extractSectionIndexFromGapId', () => {
    test('извлекает индекс из section-{n}', () => {
      expect(extractSectionIndexFromGapId('section-0')).toBe(0);
      expect(extractSectionIndexFromGapId('section-5')).toBe(5);
    });

    test('извлекает индекс из walk-to-section-{n}', () => {
      expect(extractSectionIndexFromGapId('walk-to-section-0')).toBe(0);
      expect(extractSectionIndexFromGapId('walk-to-section-3')).toBe(3);
    });

    test('извлекает индекс из walk-cluster-{n}-*', () => {
      expect(extractSectionIndexFromGapId('walk-cluster-0-0')).toBe(0);
      expect(extractSectionIndexFromGapId('walk-cluster-2-1')).toBe(2);
    });

    test('извлекает индекс из walk-transfer-{n}-*', () => {
      expect(extractSectionIndexFromGapId('walk-transfer-0-0')).toBe(0);
      expect(extractSectionIndexFromGapId('walk-transfer-4-2')).toBe(4);
    });

    test('извлекает индекс из walk-transport-to-cluster-{n}', () => {
      expect(extractSectionIndexFromGapId('walk-transport-to-cluster-0')).toBe(0);
      expect(extractSectionIndexFromGapId('walk-transport-to-cluster-5')).toBe(5);
    });

    test('извлекает индекс из walk-section-{n}', () => {
      expect(extractSectionIndexFromGapId('walk-section-1')).toBe(1);
      expect(extractSectionIndexFromGapId('walk-section-6')).toBe(6);
    });

    test('возвращает -1 для walk-final-return', () => {
      expect(extractSectionIndexFromGapId('walk-final-return')).toBe(-1);
    });

    test('возвращает -1 для невалидного gapId', () => {
      expect(extractSectionIndexFromGapId('invalid')).toBe(-1);
      expect(extractSectionIndexFromGapId('')).toBe(-1);
      expect(extractSectionIndexFromGapId('section-')).toBe(-1);
    });
  });
});
