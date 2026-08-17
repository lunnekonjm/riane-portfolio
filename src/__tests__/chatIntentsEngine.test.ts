import { describe, it, expect } from 'vitest';
import { detectLineFrequency, extractActionableIntents } from '@/engines/chatIntentsEngine';

describe('chatIntentsEngine', () => {
  it('should detect frequencies correctly from text', () => {
    expect(detectLineFrequency('Versement de 6000 €/an')).toBe('annual');
    expect(detectLineFrequency('Plan annuel 1200 euros par an')).toBe('annual');
    expect(detectLineFrequency('1500 €/trimestre')).toBe('quarterly');
    expect(detectLineFrequency('500 € par semestre')).toBe('semestrial');
    expect(detectLineFrequency('500 €/mois')).toBe('monthly');
  });

  it('should extract actionable DCA and weight intents from synthesis', () => {
    const mockPositions = [
      { ticker: 'GPEA.PA', name: 'Amundi PEA MSCI World', envelope: 'PEA', targetWeight: 0.35, monthlyDCA: 800 },
      { ticker: 'PUST.PA', name: 'Amundi PEA Nasdaq 100', envelope: 'PEA', targetWeight: 0.15, monthlyDCA: 150 },
      { ticker: 'COHR', name: 'Coherent Corp', envelope: 'CTO', targetWeight: 0.05, monthlyDCA: 100 },
    ];

    const synthesis = `
### Recommandations d'allocation et DCA :
- GPEA (Amundi PEA World) : 950 €/mois (45%)
- PUST (Amundi Nasdaq) : 200 €/mois (15%)
- Coherent (COHR) : 2000 €/an (5%)
    `;

    const result = extractActionableIntents('Quelle allocation me conseilles-tu ?', synthesis, mockPositions);

    expect(result.dcaAction).not.toBeNull();
    expect(result.dcaAction?.changes.length).toBeGreaterThanOrEqual(2);

    const gpeaDca = result.dcaAction?.changes.find((c) => c.ticker === 'GPEA.PA');
    expect(gpeaDca).toBeDefined();
    expect(gpeaDca?.newValue).toBe(950);

    const cohrDca = result.dcaAction?.changes.find((c) => c.ticker === 'COHR');
    expect(cohrDca).toBeDefined();
    expect(cohrDca?.newValue).toBe(2000);
    expect(cohrDca?.frequency).toBe('annual');

    expect(result.weightAction).not.toBeNull();
    const gpeaWeight = result.weightAction?.changes.find((c) => c.ticker === 'GPEA.PA');
    expect(gpeaWeight?.newValue).toBe(0.45);
  });
});
