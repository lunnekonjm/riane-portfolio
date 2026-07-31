/**
 * Metadata standardisée pour l'ensemble des actifs du Portefeuille RIANE
 * Fournit le nom court propre pour l'affichage UI et le nom complet + ISIN + description pour les infobulles (tooltips).
 */

export interface AssetInfo {
  ticker: string;
  name: string; // Nom court propre (ex: "Amundi PEA Global ACWI")
  fullName: string; // Nom complet officiel (ex: "Amundi PEA Global MSCI ACWI UCITS ETF")
  isin: string; // Code ISIN (ex: "FR0014017NX3")
  envelope: string;
  currency: string;
  inceptionYear: number;
  description: string;
}

export const ASSET_METADATA: Record<string, AssetInfo> = {
  'GPEA.PA': {
    ticker: 'GPEA.PA',
    name: 'Amundi PEA Global ACWI',
    fullName: 'Amundi PEA Global MSCI ACWI UCITS ETF Acc',
    isin: 'FR0014017NX3',
    envelope: 'PEA',
    currency: 'EUR',
    inceptionYear: 2024,
    description: 'Cœur d\'allocation indiciel répliquant l\'indice mondial MSCI ACWI (~3 000 grandes entreprises). Éligible PEA (0,00 € Boursomarkets).',
  },
  'PUST.PA': {
    ticker: 'PUST.PA',
    name: 'Amundi Nasdaq-100',
    fullName: 'Amundi PEA Nasdaq-100 UCITS ETF EUR Acc',
    isin: 'FR0011869353',
    envelope: 'PEA',
    currency: 'EUR',
    inceptionYear: 2000,
    description: 'ETF indiciel éligible PEA répliquant la performance des 100 géants technologiques américains du Nasdaq.',
  },
  '0P0001DKPM.F': {
    ticker: '0P0001DKPM.F',
    name: 'Indépendance Europe Small',
    fullName: 'Indépendance AM Europe Small A (C)',
    isin: 'LU1832174962',
    envelope: 'PEA-PME',
    currency: 'EUR',
    inceptionYear: 2018,
    description: 'Fonds de conviction ciblant les petites et moyennes entreprises européennes décotées. Éligible PEA-PME (0,00 € Boursomarkets).',
  },
  'ALRIB.PA': {
    ticker: 'ALRIB.PA',
    name: 'Riber',
    fullName: 'Riber SA (Épitaxie par Jets Moléculaires MBE)',
    isin: 'FR0004170679',
    envelope: 'PEA-PME',
    currency: 'EUR',
    inceptionYear: 1999,
    description: 'Leader mondial des équipements MBE pour la semi-conducteur, les puces quantiques et la photonique. Éligible PEA-PME.',
  },
  'MEMS.PA': {
    ticker: 'MEMS.PA',
    name: 'Memscap',
    fullName: 'Memscap SA (Capteurs Piezorésistifs Haute Précision)',
    isin: 'FR0010298620',
    envelope: 'PEA-PME',
    currency: 'EUR',
    inceptionYear: 2000,
    description: 'Concepteur et fabricant de capteurs de pression haute précision pour l\'aéronautique et le secteur médical. Éligible PEA-PME.',
  },
  'COHR': {
    ticker: 'COHR',
    name: 'Coherent',
    fullName: 'Coherent Corp (Composants Optiques & Lasers Datacenters)',
    isin: 'US19247A1007',
    envelope: 'CTO',
    currency: 'USD',
    inceptionYear: 2022,
    description: 'Leader mondial de la photonique, des lasers et des émetteurs optiques haut débit pour datacenters d\'intelligence artificielle.',
  },
  'CEG': {
    ticker: 'CEG',
    name: 'Constellation Energy',
    fullName: 'Constellation Energy Corp (Énergie Nucléaire)',
    isin: 'US21037T1097',
    envelope: 'CTO',
    currency: 'USD',
    inceptionYear: 2022,
    description: 'Premier producteur d\'électricité nucléaire aux USA, fournisseur majeur d\'énergie décarbonée en continu pour hyperscalers IA.',
  },
  'SYM': {
    ticker: 'SYM',
    name: 'Symbotic',
    fullName: 'Symbotic Inc (Robotique Logistique & IA)',
    isin: 'US8715651085',
    envelope: 'CTO',
    currency: 'USD',
    inceptionYear: 2022,
    description: 'Pionnier américain des systèmes de gestion et d\'automatisation d\'entrepôts pilotés par intelligence artificielle.',
  },
};

/**
 * Helper d'affichage propre du nom court d'un actif
 */
export function getCleanAssetName(ticker: string, fallbackName?: string): string {
  const meta = ASSET_METADATA[ticker];
  if (meta) return meta.name;
  if (!fallbackName) return ticker;
  // Clean potential ISIN in parentheses e.g. "Amundi PEA Global MSCI ACWI (FR0014017NX3)" -> "Amundi PEA Global MSCI ACWI"
  return fallbackName.replace(/\s*\([A-Z0-9]{12}\)/gi, '').trim();
}

/**
 * Helper de récupération de la fiche complète pour infobulle
 */
export function getAssetTooltipText(ticker: string, fallbackName?: string): string {
  const meta = ASSET_METADATA[ticker];
  if (meta) {
    return `📌 NOM OFFICIEL : ${meta.fullName}\n🏷️ SYMBOLE : ${meta.ticker} · CODE ISIN : ${meta.isin}\n🏛️ ENVELOPPE : ${meta.envelope} (${meta.currency})\n💡 INFO : ${meta.description}`;
  }
  return `📌 SYMBOLE : ${ticker}\n🏷️ NOM : ${fallbackName || ticker}`;
}
