/**
 * Asset Registry & Ticker Search Engine
 * Pre-indexed registry of PEA-eligible ETFs, Euronext Paris stocks, Small Caps, US Tech & Crypto assets
 */

import { REGISTRY_ETFS } from './registry/registryEtfs';
import { REGISTRY_STOCKS } from './registry/registryStocks';
import { REGISTRY_SMALL_CAPS } from './registry/registrySmallCaps';
import { REGISTRY_US_TECH } from './registry/registryUsTech';
import { REGISTRY_CRYPTO } from './registry/registryCrypto';

export interface RegisteredAsset {
  ticker: string;
  name: string;
  assetType: 'ETF' | 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO';
  envelope: 'PEA' | 'PEA-PME' | 'CTO' | 'CRYPTO';
  currency: 'EUR' | 'USD';
  themes: string[];
  exchange: string;
  isin?: string;
  searchTerms: string[];
}

export const ASSET_REGISTRY: RegisteredAsset[] = [
  ...REGISTRY_ETFS,
  ...REGISTRY_STOCKS,
  ...REGISTRY_SMALL_CAPS,
  ...REGISTRY_US_TECH,
  ...REGISTRY_CRYPTO,
];

export { searchAssets, isCryptoAsset } from './registry/assetSearchEngine';
export { REGISTRY_ETFS } from './registry/registryEtfs';
export { REGISTRY_STOCKS } from './registry/registryStocks';
export { REGISTRY_SMALL_CAPS } from './registry/registrySmallCaps';
export { REGISTRY_US_TECH } from './registry/registryUsTech';
export { REGISTRY_CRYPTO } from './registry/registryCrypto';
