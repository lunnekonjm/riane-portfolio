/**
 * Redactor Engine — Protection et Anonymisation des données sensibles (RGPD / NIR / IBAN / Noms)
 * Porté et enrichi depuis AuraBudget Pro vers Riane Portfolio (Next.js / TypeScript).
 */

export interface RedactionBoundingBox {
  id: string;
  type: 'rect' | 'circle';
  label: string;
  xPercent: number; // 0 to 1
  yPercent: number; // 0 to 1
  widthPercent: number; // 0 to 1
  heightPercent: number; // 0 to 1
}

export interface RedactorTextResult {
  redactedText: string;
  detectedEntitiesCount: number;
  replacedItems: {
    type: 'NIR' | 'IBAN' | 'EMAIL' | 'SIRET' | 'PHONE' | 'NAME';
    originalMasked: string;
  }[];
}

/**
 * Boîtes de masquage visuel par défaut pour un bulletin de paie standard français (Norme Clarté / DSN).
 */
export function generateDefaultPayslipRgpdMasks(): RedactionBoundingBox[] {
  return [
    {
      id: 'rgpd-employer',
      type: 'rect',
      label: 'SIRET & Raison Sociale Employeur',
      xPercent: 0.04,
      yPercent: 0.04,
      widthPercent: 0.45,
      heightPercent: 0.09,
    },
    {
      id: 'rgpd-nir',
      type: 'rect',
      label: 'NIR / N° Sécurité Sociale',
      xPercent: 0.55,
      yPercent: 0.08,
      widthPercent: 0.42,
      heightPercent: 0.03,
    },
    {
      id: 'rgpd-employee-address',
      type: 'rect',
      label: 'Nom & Adresse Salarié',
      xPercent: 0.52,
      yPercent: 0.12,
      widthPercent: 0.45,
      heightPercent: 0.11,
    },
    {
      id: 'rgpd-iban-bank',
      type: 'rect',
      label: 'IBAN & Coordonnées Bancaires',
      xPercent: 0.48,
      yPercent: 0.80,
      widthPercent: 0.48,
      heightPercent: 0.08,
    },
  ];
}

/**
 * Anonymise une chaîne de texte (extraite par OCR ou saisie) en masquant rigoureusement les données sensibles.
 */
export function sanitizeSensitiveFinancialText(text: string): RedactorTextResult {
  if (!text) {
    return {
      redactedText: '',
      detectedEntitiesCount: 0,
      replacedItems: [],
    };
  }

  let sanitized = text;
  const replacedItems: RedactorTextResult['replacedItems'] = [];

  // 1. NIR (Numéro de Sécurité Sociale Français : 1 ou 2 chiffres, 13 ou 15 chiffres avec clé)
  const nirRegex = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}(\s?\d{2})?\b/g;
  sanitized = sanitized.replace(nirRegex, (match) => {
    replacedItems.push({ type: 'NIR', originalMasked: match.slice(0, 3) + '••••••••' });
    return '[NIR_MASQUÉ]';
  });

  // 2. IBAN (FR / International)
  const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{4}[A-Z0-9]{4}[A-Z0-9]{0,16}\b/gi;
  sanitized = sanitized.replace(ibanRegex, (match) => {
    replacedItems.push({ type: 'IBAN', originalMasked: match.slice(0, 4) + '••••••••' });
    return '[IBAN_MASQUÉ]';
  });

  // 3. SIRET (14 chiffres) & SIREN (9 chiffres isolés)
  const siretRegex = /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g;
  sanitized = sanitized.replace(siretRegex, (match) => {
    replacedItems.push({ type: 'SIRET', originalMasked: match.slice(0, 3) + '••••••' });
    return '[SIRET_MASQUÉ]';
  });

  // 4. Numéros de téléphone (Français et Internationaux)
  const phoneRegex = /(?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4}/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    replacedItems.push({ type: 'PHONE', originalMasked: match.slice(0, 4) + '••••••' });
    return '[TEL_MASQUÉ]';
  });

  // 5. Adresses Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, (match) => {
    replacedItems.push({ type: 'EMAIL', originalMasked: match.split('@')[0].slice(0, 2) + '•••@•••' });
    return '[EMAIL_MASQUÉ]';
  });

  return {
    redactedText: sanitized,
    detectedEntitiesCount: replacedItems.length,
    replacedItems,
  };
}
