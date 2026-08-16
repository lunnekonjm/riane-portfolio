import { describe, it, expect } from 'vitest';
import {
  generateDefaultPayslipRgpdMasks,
  sanitizeSensitiveFinancialText,
} from '../services/ai/redactorEngine';

describe('RedactorEngine (RGPD Data Protection)', () => {
  it('should generate standard bounding box masks for payslip OCR', () => {
    const masks = generateDefaultPayslipRgpdMasks();
    expect(masks.length).toBe(4);
    expect(masks.map((m) => m.id)).toContain('rgpd-nir');
    expect(masks.map((m) => m.id)).toContain('rgpd-iban-bank');
  });

  it('should sanitize French NIR (Social Security Number) correctly', () => {
    const rawText = 'Salarié: Jean Dupont, NIR: 1 89 05 75 123 456 78, Né le 12/05/1989';
    const result = sanitizeSensitiveFinancialText(rawText);
    expect(result.redactedText).toContain('[NIR_MASQUÉ]');
    expect(result.redactedText).not.toContain('1 89 05 75 123 456 78');
    expect(result.detectedEntitiesCount).toBeGreaterThanOrEqual(1);
  });

  it('should sanitize IBAN from banking coordinates', () => {
    const rawText = 'Virement vers compte: FR7630003000400000000000045 BoursoBank';
    const result = sanitizeSensitiveFinancialText(rawText);
    expect(result.redactedText).toContain('[IBAN_MASQUÉ]');
    expect(result.redactedText).not.toContain('FR7630003000400000000000045');
  });

  it('should sanitize SIRET and emails and phone numbers', () => {
    const rawText = 'Contact employeur: RH@entreprise.fr - 06 12 34 56 78 - SIRET: 123 456 789 00012';
    const result = sanitizeSensitiveFinancialText(rawText);
    expect(result.redactedText).toContain('[EMAIL_MASQUÉ]');
    expect(result.redactedText).toContain('[TEL_MASQUÉ]');
    expect(result.redactedText).toContain('[SIRET_MASQUÉ]');
  });

  it('should handle empty or null-like inputs gracefully', () => {
    expect(sanitizeSensitiveFinancialText('').redactedText).toBe('');
    expect(sanitizeSensitiveFinancialText('').detectedEntitiesCount).toBe(0);
  });
});
