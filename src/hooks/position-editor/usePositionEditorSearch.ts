'use client';

import { useState, useEffect } from 'react';
import type { Position } from '@/types/portfolio';
import { ASSET_REGISTRY, searchAssets, type RegisteredAsset } from '@/data/assetRegistry';
import { getQuote, getCompanyProfile, searchYahooFinance } from '@/services/market-data/provider';
import { isCryptoAsset, autoGenerateThemes } from '@/utils/positionFormThemes';

interface UsePositionEditorSearchProps {
  position?: Position;
  initialEnvelope: Position['envelope'];
  form: Position;
  setForm: React.Dispatch<React.SetStateAction<Position>>;
  setCurrentPriceInput: (val: string) => void;
  setAvgPriceInput: (val: string | ((prev: string) => string)) => void;
}

export function usePositionEditorSearch({
  position,
  initialEnvelope,
  form,
  setForm,
  setCurrentPriceInput,
  setAvgPriceInput,
}: UsePositionEditorSearchProps) {
  const [tickerSearchInput, setTickerSearchInput] = useState(() => (position ? `${position.name} (${position.ticker})` : ''));
  const [searchResults, setSearchResults] = useState<RegisteredAsset[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isVerifyingTicker, setIsVerifyingTicker] = useState(false);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [verifiedQuoteText, setVerifiedQuoteText] = useState<string | null>(null);
  const [didYouMeanAsset, setDidYouMeanAsset] = useState<RegisteredAsset | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);

  const handleSelectRegisteredAsset = async (asset: RegisteredAsset) => {
    setShowDropdown(false);
    setTickerSearchInput(`${asset.name} (${asset.ticker})`);
    setTickerError(null);
    setDidYouMeanAsset(null);
    setIsVerifyingTicker(true);

    const isCrypto = isCryptoAsset(asset.ticker, asset.name) || asset.assetType === 'CRYPTO' || asset.envelope === 'CRYPTO' || initialEnvelope === 'CRYPTO';
    const finalEnvelope = isCrypto ? 'CRYPTO' : (asset.envelope || initialEnvelope);
    const finalAssetType = isCrypto ? 'CRYPTO' : (asset.assetType || 'ETF');

    setForm((prev) => ({
      ...prev,
      ticker: asset.ticker,
      name: asset.name,
      envelope: finalEnvelope,
      assetType: finalAssetType,
      currency: asset.currency,
      themes: asset.themes,
      quantity: prev.quantity || 0,
    }));

    try {
      const [quote, profile] = await Promise.all([
        getQuote(asset.ticker).catch(() => null),
        getCompanyProfile(asset.ticker).catch(() => null),
      ]);

      setForm((prev) => {
        const price = quote?.price && quote.price > 0 ? quote.price : prev.currentPrice;
        const autoThemes = autoGenerateThemes(asset.ticker, profile?.name || asset.name, profile?.sector, profile?.industry);
        return {
          ...prev,
          name: profile?.name || asset.name || prev.name,
          envelope: finalEnvelope,
          assetType: finalAssetType,
          currentPrice: price,
          avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (price || 100),
          currency: (profile?.currency as any) || (quote?.currency as any) || prev.currency,
          themes: autoThemes.length > 0 ? autoThemes : asset.themes,
          quantity: prev.quantity || 0,
        };
      });

      if (quote && quote.price > 0) {
        const formattedPrice = quote.price < 1 ? quote.price.toFixed(6) : quote.price.toFixed(2);
        setCurrentPriceInput(formattedPrice);
        setAvgPriceInput((prev) => (!prev || prev === '0' || prev === '0.00' ? formattedPrice : prev));
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || asset.name} (${profile?.sector || asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Bourse')}) — Prix en direct : ${quote.price.toFixed(2)} ${quote.currency || asset.currency}`);
      } else {
        setVerifiedQuoteText(`✓ Actif répertorié officiel (${asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Euronext Paris')})`);
      }
    } catch {
      setVerifiedQuoteText(`✓ Actif répertorié officiel (${asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Euronext Paris')})`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setTickerSearchInput(value);
    setVerifiedQuoteText(null);
    setTickerError(null);
    setDidYouMeanAsset(null);

    const matches = searchAssets(value);
    setSearchResults(matches);
    setShowDropdown(matches.length > 0 || value.trim().length >= 2);

    const exactMatch = ASSET_REGISTRY.find(
      (a) =>
        a.ticker.toLowerCase() === value.trim().toLowerCase() ||
        (a.isin && a.isin.toLowerCase() === value.trim().toLowerCase())
    );
    if (exactMatch) {
      handleSelectRegisteredAsset(exactMatch);
    } else {
      const isCrypto = isCryptoAsset(value);
      setForm((prev) => ({
        ...prev,
        ticker: value.toUpperCase(),
        ...(isCrypto ? { envelope: 'CRYPTO' as const, assetType: 'CRYPTO' as const } : {})
      }));
    }
  };

  useEffect(() => {
    const query = tickerSearchInput.trim();
    if (!query || query.length < 2) return;

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const localMatches = searchAssets(query);
        const yahooMatches = await searchYahooFinance(query);
        const combined: RegisteredAsset[] = [...localMatches];

        yahooMatches.forEach((ym) => {
          if (!combined.some((c) => c.ticker.toUpperCase() === ym.ticker.toUpperCase())) {
            const isFrench = ym.ticker.endsWith('.PA');
            const isCrypto = (ym.assetType as string) === 'CRYPTO' || isCryptoAsset(ym.ticker, ym.name) || initialEnvelope === 'CRYPTO';
            combined.push({
              ticker: ym.ticker,
              name: ym.name,
              assetType: isCrypto ? 'CRYPTO' : ym.assetType,
              envelope: isCrypto ? 'CRYPTO' : isFrench ? (ym.ticker.startsWith('AL') ? 'PEA-PME' : 'PEA') : 'CTO',
              currency: ym.currency,
              themes: ['general'],
              exchange: isCrypto ? 'Crypto Market 24/7' : ym.exchange,
              searchTerms: [query.toLowerCase()],
            });
          }
        });

        setSearchResults(combined);
        if (combined.length > 0) setShowDropdown(true);
      } catch {
        // ignore
      } finally {
        setIsSearchingLive(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tickerSearchInput, initialEnvelope]);

  const handleVerifyManualTicker = async () => {
    const rawQuery = (form.ticker || tickerSearchInput).trim();
    if (!rawQuery) return;

    setIsVerifyingTicker(true);
    setTickerError(null);
    setVerifiedQuoteText(null);
    setDidYouMeanAsset(null);

    const localMatch = ASSET_REGISTRY.find(
      (a) =>
        a.ticker.toLowerCase() === rawQuery.toLowerCase() ||
        (a.isin && a.isin.toLowerCase() === rawQuery.toLowerCase())
    );
    if (localMatch) {
      await handleSelectRegisteredAsset(localMatch);
      setIsVerifyingTicker(false);
      return;
    }

    try {
      const [quote, profile] = await Promise.all([
        getQuote(rawQuery.toUpperCase()).catch(() => null),
        getCompanyProfile(rawQuery.toUpperCase()).catch(() => null),
      ]);

      if (quote && quote.price > 0) {
        const isCrypto = isCryptoAsset(rawQuery, profile?.name || form.name) || initialEnvelope === 'CRYPTO';
        const isFrench = rawQuery.toUpperCase().endsWith('.PA');
        const autoThemes = autoGenerateThemes(rawQuery.toUpperCase(), profile?.name || form.name, profile?.sector, profile?.industry);
        setForm((prev) => ({
          ...prev,
          ticker: rawQuery.toUpperCase(),
          name: profile?.name || prev.name || rawQuery.toUpperCase(),
          envelope: isCrypto ? 'CRYPTO' : prev.envelope,
          assetType: isCrypto ? 'CRYPTO' : prev.assetType,
          currentPrice: quote.price,
          avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (quote.price || 100),
          currency: (profile?.currency as any) || (quote.currency as any) || prev.currency,
          themes: autoThemes.length > 0 ? autoThemes : prev.themes,
          quantity: prev.quantity || 0,
        }));
        const formattedPrice = quote.price < 1 ? quote.price.toFixed(6) : quote.price.toFixed(2);
        setCurrentPriceInput(formattedPrice);
        setAvgPriceInput((prev) => (!prev || prev === '0' || prev === '0.00' ? formattedPrice : prev));
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || rawQuery.toUpperCase()} (${profile?.sector || (isCrypto ? 'Marché Crypto 24/7' : isFrench ? 'Euronext Paris' : 'Marché Direct')}) — Prix : ${quote.price.toFixed(2)} ${quote.currency}`);
        setIsVerifyingTicker(false);
        return;
      }
    } catch {
      // Direct quote failed, fallback to search
    }

    try {
      const yahooMatches = await searchYahooFinance(rawQuery);
      if (yahooMatches.length > 0) {
        const topMatch = yahooMatches[0];
        const isCrypto = (topMatch.assetType as string) === 'CRYPTO' || isCryptoAsset(topMatch.ticker, topMatch.name) || initialEnvelope === 'CRYPTO';
        const isFrench = topMatch.ticker.endsWith('.PA');
        const candidate: RegisteredAsset = {
          ticker: topMatch.ticker,
          name: topMatch.name,
          assetType: isCrypto ? 'CRYPTO' : topMatch.assetType,
          envelope: isCrypto ? 'CRYPTO' : isFrench ? (topMatch.ticker.startsWith('AL') ? 'PEA-PME' : 'PEA') : 'CTO',
          currency: topMatch.currency,
          themes: ['general'],
          exchange: isCrypto ? 'Crypto Market 24/7' : topMatch.exchange,
          searchTerms: [rawQuery.toLowerCase()],
        };

        setDidYouMeanAsset(candidate);
        setTickerError(`💡 Intention détectée : '${rawQuery}' correspond à l'actif officiel ${candidate.name} (${candidate.ticker}).`);
      } else {
        setTickerError(`❌ Impossible de vérifier '${rawQuery}' sur les marchés. Seuls les actifs officiels reconnus peuvent être suivis.`);
      }
    } catch {
      setTickerError(`❌ Ticker ou actif '${rawQuery}' non trouvé.`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  return {
    tickerSearchInput,
    setTickerSearchInput,
    searchResults,
    setSearchResults,
    showDropdown,
    setShowDropdown,
    isVerifyingTicker,
    isSearchingLive,
    verifiedQuoteText,
    setVerifiedQuoteText,
    didYouMeanAsset,
    setDidYouMeanAsset,
    tickerError,
    setTickerError,
    handleSelectRegisteredAsset,
    handleSearchInputChange,
    handleVerifyManualTicker,
  };
}
