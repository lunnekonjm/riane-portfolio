import type { Position } from '@/types/portfolio';
import { getCleanAssetName } from '@/utils/assetMetadata';

export interface PositionPerformanceData {
  ticker: string;
  cleanName: string;
  envelope: Position['envelope'];
  assetType: Position['assetType'];
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currency: string;
  valEUR: number;
  costEUR: number;
  pnlEUR: number;
  pnlPct: number;
  weight: number;
  hasTargetConfigured: boolean;
  targetWeight: number;
}

export interface RebalanceAnalysisItem extends PositionPerformanceData {
  targetLabel: string;
  targetValEUR: number;
  gapEUR: number;
  gapLabel: string;
  allocatedDCAEUR: number;
  sharesInstruction: string;
  isUnderWeight: boolean;
}

export function computePositionPerformances(
  filledPositions: Position[],
  fxRates: Record<string, number>,
  factor: number,
  totalValue: number
): PositionPerformanceData[] {
  return filledPositions.map((p) => {
    const price = p.currentPrice || p.avgPrice;
    const rate = fxRates[p.currency] || 1.0;
    const valEUR = (p.quantity * price * rate) / factor;
    const costEUR = (p.quantity * p.avgPrice * rate) / factor;
    const pnlEUR = valEUR - costEUR;
    const pnlPct = costEUR > 0 ? (pnlEUR / costEUR) * 100 : 0;
    const weight = totalValue > 0 ? (valEUR / totalValue) * 100 : 0;
    const cleanName = getCleanAssetName(p.ticker, p.name);

    return {
      ticker: p.ticker,
      cleanName,
      envelope: p.envelope,
      assetType: p.assetType,
      quantity: p.quantity,
      avgPrice: p.avgPrice,
      currentPrice: price,
      currency: p.currency,
      valEUR,
      costEUR,
      pnlEUR,
      pnlPct,
      weight,
      hasTargetConfigured: typeof p.targetWeight === 'number' && p.targetWeight > 0,
      targetWeight: p.targetWeight || 0,
    };
  });
}

export function computeRebalanceTableAndInstructions(
  posPerformance: PositionPerformanceData[],
  totalValue: number,
  periodDCABudget: number
) {
  const rebalanceAnalysis: RebalanceAnalysisItem[] = posPerformance.map((p) => {
    if (!p.hasTargetConfigured) {
      return {
        ...p,
        targetLabel: '⚠️ Non configuré',
        targetValEUR: 0,
        gapEUR: 0,
        gapLabel: '⚠️ Cible non définie',
        allocatedDCAEUR: 0,
        sharesInstruction: 'Définir un poids cible dans l\'éditeur',
        isUnderWeight: false,
      };
    }

    const targetValEUR = totalValue * p.targetWeight;
    const gapEUR = targetValEUR - p.valEUR;
    const isUnderWeight = gapEUR > 0;

    const gapLabel = isUnderWeight
      ? `Déficit : **-${Math.abs(Math.round(gapEUR)).toLocaleString('fr-FR')} €**`
      : `Surplus : **+${Math.abs(Math.round(gapEUR)).toLocaleString('fr-FR')} €**`;

    return {
      ...p,
      targetLabel: `${(p.targetWeight * 100).toFixed(1)}%`,
      targetValEUR,
      gapEUR,
      gapLabel,
      allocatedDCAEUR: 0,
      sharesInstruction: '',
      isUnderWeight,
    };
  });

  const totalDeficitEUR = rebalanceAnalysis
    .filter((a) => a.isUnderWeight)
    .reduce((sum, a) => sum + a.gapEUR, 0);

  const rebalanceTableRows: string[] = [];
  const actionableInstructions: string[] = [];

  rebalanceAnalysis.forEach((a) => {
    const symbol = a.currency === 'USD' ? '$' : '€';
    let allocatedDCAEUR = 0;
    let sharesToBuyStr = '0 action';

    if (a.hasTargetConfigured && a.isUnderWeight && totalDeficitEUR > 0) {
      allocatedDCAEUR = (a.gapEUR / totalDeficitEUR) * periodDCABudget;

      if (a.assetType === 'FUND') {
        const exactParts = (allocatedDCAEUR / a.currentPrice).toFixed(3);
        sharesToBuyStr = `+${exactParts} part(s) (${allocatedDCAEUR.toFixed(2)} €)`;
      } else {
        const count = Math.floor(allocatedDCAEUR / a.currentPrice);
        sharesToBuyStr = count > 0 ? `+${count} action(s)` : '0 action (montant infra-unitaire)';
      }
    }

    rebalanceTableRows.push(
      `| **${a.ticker}** | ${a.cleanName} | **${a.weight.toFixed(1)}%** | **${a.targetLabel}** | ${a.gapLabel} | **${allocatedDCAEUR.toFixed(2)} €** | **${sharesToBuyStr}** | ${a.currentPrice.toFixed(2)} ${symbol} |`
    );

    if (allocatedDCAEUR > 0) {
      actionableInstructions.push(
        `1. 🟢 **${a.cleanName} (${a.ticker})** : Ordre d'achat de **${allocatedDCAEUR.toFixed(2)} €** (${sharesToBuyStr} au cours de ${a.currentPrice.toFixed(2)} ${symbol}). Cet achat réduira le déficit de pondération.`
      );
    } else if (a.hasTargetConfigured && a.gapEUR < 0) {
      actionableInstructions.push(
        `• ⚠️ **${a.cleanName} (${a.ticker})** : Surpondéré de **+${Math.abs(Math.round(a.gapEUR)).toLocaleString('fr-FR')} €** (exposition actuelle ${a.weight.toFixed(1)}% vs cible ${a.targetLabel}). **Geler les versements (0,00 € alloués)**. Ne pas vendre mais réorienter les nouveaux flux.`
      );
    } else if (!a.hasTargetConfigured) {
      actionableInstructions.push(
        `• ⚠️ **${a.cleanName} (${a.ticker})** : Aucun poids cible configuré. Rendez-vous dans l'éditeur de position pour renseigner le poids cible souhaité.`
      );
    } else {
      actionableInstructions.push(
        `• ✅ **${a.cleanName} (${a.ticker})** : Pondération parfaitement équilibrée (**${a.weight.toFixed(1)}%**). Aucun arbitrage nécessaire.`
      );
    }
  });

  return {
    rebalanceTableRows,
    actionableInstructions,
  };
}
