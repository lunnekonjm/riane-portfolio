/**
 * Moteur d'extraction des intentions actionnables depuis les réponses d'analyse IA.
 * Détecte les préconisations de DCA (€/mois, €/an, €/trimestre) et d'allocations cibles (%)
 * pour permettre l'application en 1-clic direct dans le portefeuille de l'utilisateur.
 */

export interface ActionableIntent {
  type: 'UPDATE_TARGET_WEIGHTS' | 'UPDATE_MONTHLY_DCA' | 'APPLY_REBALANCE';
  title: string;
  description: string;
  changes: Array<{
    ticker: string;
    label: string;
    field: 'targetWeight' | 'monthlyDCA' | 'annualBudget';
    frequency?: 'monthly' | 'quarterly' | 'semestrial' | 'annual';
    newValue: number;
    formattedValue: string;
  }>;
}

export interface ExtractedIntents {
  dcaAction: ActionableIntent | null;
  weightAction: ActionableIntent | null;
}

export function detectLineFrequency(line: string): 'monthly' | 'quarterly' | 'semestrial' | 'annual' {
  const lineLower = line.toLowerCase();

  if (
    lineLower.includes('/an') ||
    lineLower.includes('/ an') ||
    lineLower.includes('annuel') ||
    lineLower.includes('par an') ||
    lineLower.includes('€/an')
  ) {
    return 'annual';
  }
  if (
    lineLower.includes('/trimestre') ||
    lineLower.includes('trimestriel') ||
    lineLower.includes('par trimestre') ||
    lineLower.includes('€/trimestre')
  ) {
    return 'quarterly';
  }
  if (
    lineLower.includes('/semestre') ||
    lineLower.includes('semestriel') ||
    lineLower.includes('par semestre') ||
    lineLower.includes('€/semestre')
  ) {
    return 'semestrial';
  }
  return 'monthly';
}

const COMMON_STOP_WORDS = new Set([
  'amundi', 'ishares', 'lyxor', 'vanguard', 'bnp', 'spdr', 'blackrock',
  'etf', 'msci', 'pea', 'pme', 'cto', 'europe', 'global', 'small', 'caps',
  'usa', 'usd', 'eur', 'world', 'index', 'ucits', 'acc', 'dist', 'inc'
]);

/**
 * Détecte avec précision les montants DCA (€/mois, €/an, €/trimestre) et allocations cibles (%) préconisés par l'IA.
 */
export function extractActionableIntents(query: string, synthesisText: string, positions: any[]): ExtractedIntents {
  if (!synthesisText || !query || positions.length === 0) {
    return { dcaAction: null, weightAction: null };
  }

  const queryLower = query.toLowerCase();

  const isAllocationOrDcaQuery =
    queryLower.includes('allocation') ||
    queryLower.includes('alloc') ||
    queryLower.includes('répartition') ||
    queryLower.includes('répartir') ||
    queryLower.includes('pourcentage') ||
    queryLower.includes('poids') ||
    queryLower.includes('target') ||
    queryLower.includes('cible') ||
    queryLower.includes('recommand') ||
    queryLower.includes('propose') ||
    queryLower.includes('mettre') ||
    queryLower.includes('verser') ||
    queryLower.includes('dca') ||
    queryLower.includes('budget') ||
    queryLower.includes('mensuel') ||
    queryLower.includes('annuel') ||
    queryLower.includes('trimestriel') ||
    queryLower.includes('semestriel') ||
    queryLower.includes('stratégie') ||
    queryLower.includes('rééquilibre') ||
    queryLower.includes('combien');

  if (!isAllocationOrDcaQuery) {
    return { dcaAction: null, weightAction: null };
  }

  const lines = synthesisText.split('\n');
  const dcaChanges: ActionableIntent['changes'] = [];
  const weightChanges: ActionableIntent['changes'] = [];

  const isEnvelopeHeader = (line: string) => {
    const l = line.toLowerCase().trim();
    return (
      (l.includes('le socle') || l.includes('le satellite') || l.includes('le vivier') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.')) &&
      !l.includes('gpea') && !l.includes('pust') && !l.includes('0p0001') && !l.includes('mems') && !l.includes('alrib') && !l.includes('ceg') && !l.includes('cohr') && !l.includes('sym')
    );
  };

  lines.forEach((line) => {
    if (isEnvelopeHeader(line)) return;

    // Compter combien de positions du portefeuille sont présentées sur cette ligne
    const matchingPositionsOnLine = positions.filter((pos) => {
      const lineLower = line.toLowerCase();
      const tickerFull = pos.ticker.toLowerCase();
      const tickerClean = tickerFull.replace('.pa', '').replace('.f', '').replace('.de', '').replace('.l', '');

      // 1. Ticker match exact (GPEA.PA, GPEA, PUST.PA, PUST, etc.)
      if (lineLower.includes(tickerFull) || lineLower.includes(tickerClean)) {
        return true;
      }

      // 2. Mot clé unique du nom d'actif (ex: acwi, nasdaq, indépendance, memscap, riber)
      const uniqueWords = pos.name
        .toLowerCase()
        .split(/[\s\-_,./()]+/)
        .filter((w: string) => w.length >= 3 && !COMMON_STOP_WORDS.has(w));

      return uniqueWords.some((w: string) => lineLower.includes(w));
    });

    if (matchingPositionsOnLine.length > 0) {
      const freq = detectLineFrequency(line);

      // 1. Détection des montants DCA en Euros (€, €/mois, €/an) sur cette ligne
      let euroMatch = null;
      if (freq === 'annual') {
        euroMatch = line.match(/(?:[–\-—:]\s*)(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?)\s*(?:\/\s*an|annuels?|par an)?/i) ||
                    line.match(/(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?)\s*(?:\/\s*an|annuels?|par an)/i);
      } else {
        euroMatch = line.match(/(?:[–\-—:]\s*)(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?|€\/mois)?/i) ||
                    line.match(/(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?|€\/mois)/i);
      }

      if (euroMatch && euroMatch[1]) {
        const rawVal = parseFloat(euroMatch[1].replace(/\s/g, '').replace(',', '.'));
        const valPerPos = Math.round(rawVal / matchingPositionsOnLine.length);

        if (valPerPos > 0 && valPerPos <= 100000) {
          matchingPositionsOnLine.forEach((pos) => {
            if (!dcaChanges.some((c) => c.ticker === pos.ticker)) {
              const labelFreq = freq === 'annual' ? '€/an (Annuel)' : freq === 'quarterly' ? '€/trimestre' : '€/mois';
              dcaChanges.push({
                ticker: pos.ticker,
                label: pos.name,
                field: freq === 'annual' ? 'annualBudget' : 'monthlyDCA',
                frequency: freq,
                newValue: valPerPos,
                formattedValue: `${valPerPos.toLocaleString('fr-FR')} ${labelFreq}`,
              });
            }
          });
        }
      }

      // 2. Détection du pourcentage cible (%) sur cette ligne
      const pctMatch = line.match(/(?:[–\-—:]\s*|\()\s*(\d+(?:[.,]\d+)?)\s*%/i);
      if (pctMatch && pctMatch[1]) {
        const rawPct = parseFloat(pctMatch[1].replace(',', '.'));
        const pctPerPos = rawPct / matchingPositionsOnLine.length;
        if (pctPerPos > 0 && pctPerPos <= 100) {
          matchingPositionsOnLine.forEach((pos) => {
            if (!weightChanges.some((c) => c.ticker === pos.ticker)) {
              weightChanges.push({
                ticker: pos.ticker,
                label: pos.name,
                field: 'targetWeight',
                newValue: pctPerPos / 100,
                formattedValue: `${pctPerPos.toFixed(1)}%`,
              });
            }
          });
        }
      }
    }
  });

  // Fallback : montants par enveloppe
  if (dcaChanges.length === 0) {
    const envelopeDcaMap: Record<string, { amount: number; freq: 'monthly' | 'quarterly' | 'semestrial' | 'annual' }> = {};

    lines.forEach((line) => {
      const lineFreq = detectLineFrequency(line);

      const ctoMatch = line.match(/cto[^\n]*?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);
      const peaPmeMatch = line.match(/pea-pme[^\n]*?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);
      const peaMatch = line.match(/(?:^|[^a-z0-9])pea(?:[^a-z0-9-][^\n]*?)(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);

      if (ctoMatch && ctoMatch[1]) envelopeDcaMap['CTO'] = { amount: parseFloat(ctoMatch[1].replace(',', '.')), freq: lineFreq };
      if (peaPmeMatch && peaPmeMatch[1]) envelopeDcaMap['PEA-PME'] = { amount: parseFloat(peaPmeMatch[1].replace(',', '.')), freq: lineFreq };
      else if (peaMatch && peaMatch[1]) envelopeDcaMap['PEA'] = { amount: parseFloat(peaMatch[1].replace(',', '.')), freq: lineFreq };
    });

    Object.entries(envelopeDcaMap).forEach(([env, data]) => {
      const envPositions = positions.filter((p) => (p.envelope || '').toUpperCase() === env);
      if (envPositions.length > 0 && data.amount > 0) {
        const perPos = Math.round(data.amount / envPositions.length);
        envPositions.forEach((p) => {
          const labelFreq = data.freq === 'annual' ? '€/an (Annuel)' : data.freq === 'quarterly' ? '€/trimestre' : '€/mois';
          dcaChanges.push({
            ticker: p.ticker,
            label: p.name,
            field: data.freq === 'annual' ? 'annualBudget' : 'monthlyDCA',
            frequency: data.freq,
            newValue: perPos,
            formattedValue: `${perPos.toLocaleString('fr-FR')} ${labelFreq}`,
          });
        });
      }
    });
  }

  const dcaAction: ActionableIntent | null =
    dcaChanges.length > 0
      ? {
          type: 'UPDATE_MONTHLY_DCA',
          title: 'Appliquer les montants DCA préconisés',
          description: `Mettre à jour les montants programmés de ${dcaChanges.length} ligne${dcaChanges.length > 1 ? 's' : ''} selon l'analyse IA`,
          changes: dcaChanges,
        }
      : null;

  const weightAction: ActionableIntent | null =
    weightChanges.length > 0
      ? {
          type: 'UPDATE_TARGET_WEIGHTS',
          title: 'Appliquer la répartition cible préconisée',
          description: `Ajuster les pondérations cibles (%) de ${weightChanges.length} actif${weightChanges.length > 1 ? 's' : ''}`,
          changes: weightChanges,
        }
      : null;

  return { dcaAction, weightAction };
}
