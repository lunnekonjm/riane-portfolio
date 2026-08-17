import { describe, it, expect } from 'vitest';
import { formatDCAElapsedTime } from '@/utils/dateUtils';

describe('dateUtils', () => {
  it('should return empty string on empty input', () => {
    expect(formatDCAElapsedTime('')).toBe('');
  });

  it('should return future message on future date', () => {
    const futureDate = '2099-01-01';
    expect(formatDCAElapsedTime(futureDate)).toBe('⏳ Début des versements à venir');
  });

  it('should format past date correctly', () => {
    const result = formatDCAElapsedTime('2024-01-05');
    expect(result).toContain('⏳ Début des versements il y a');
    expect(result).toContain('versement');
  });
});
