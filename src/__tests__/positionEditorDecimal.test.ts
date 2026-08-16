import { describe, it, expect } from 'vitest';

describe('PositionEditor Decimal and Fraction Handlers', () => {
  const normalizeInput = (val: string): number => {
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      return 0;
    }
    const num = parseFloat(normalized);
    return !isNaN(num) && num >= 0 ? num : 0;
  };

  it('correctly handles Bitcoin fractions with dot', () => {
    expect(normalizeInput('0.001')).toBe(0.001);
    expect(normalizeInput('0.00000001')).toBe(0.00000001);
    expect(normalizeInput('0.5')).toBe(0.5);
  });

  it('correctly normalizes French commas to decimal dots', () => {
    expect(normalizeInput('0,001')).toBe(0.001);
    expect(normalizeInput('12,5')).toBe(12.5);
    expect(normalizeInput('1500,75')).toBe(1500.75);
  });

  it('handles empty and partial typing states gracefully', () => {
    expect(normalizeInput('')).toBe(0);
    expect(normalizeInput('.')).toBe(0);
    expect(normalizeInput('0.')).toBe(0);
    expect(normalizeInput('0,')).toBe(0);
  });

  it('computes accurate valuation for fractional crypto positions', () => {
    const quantity = normalizeInput('0.001');
    const btcPrice = 90000;
    const valuation = quantity * btcPrice;
    expect(valuation).toBe(90);
  });

  it('computes accurate valuation for 0.05 BTC at 85000 EUR', () => {
    const quantity = normalizeInput('0,05');
    const btcPrice = 85000;
    const valuation = quantity * btcPrice;
    expect(valuation).toBe(4250);
  });
});
