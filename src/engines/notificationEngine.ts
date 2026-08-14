/**
 * Dynamic Notification Generator Engine
 * Evaluates real portfolio state and generates actionable financial alerts.
 * Strictly separates Listed Market Portfolio (PEA, PEA-PME, CTO) from Non-Market Savings (PEE, Livrets).
 */

import type { Position, InvestorProfile, RiskProfileType } from '@/types/portfolio';
import type { AppNotification, NotificationSettings } from '@/types/notification';
import { THEMES } from '@/data/themes';

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];

export function generatePortfolioNotifications(
  positions: Position[],
  fxRates: Record<string, number>,
  settings: NotificationSettings,
  monthlyBudget: number = 1000,
  investorProfile?: InvestorProfile | null
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = Date.now();
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Adapt thresholds based on risk profile
  const riskLevel: RiskProfileType = investorProfile?.riskProfile || 'dynamic';

  // 1. Filtrer STRICTEMENT les positions BOURSIÈRES (PEA, PEA-PME, CTO)
  const filled = positions.filter((p) => (p.quantity || 0) > 0 && (p.avgPrice || 0) > 0);
  const filledMarketPositions = filled.filter((p) => MARKET_ENVELOPES.includes((p.envelope || '').toUpperCase()));

  const peaPositions = filledMarketPositions.filter((p) => p.envelope === 'PEA');
  const peaCost = peaPositions.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

  const peaPmePositions = filledMarketPositions.filter((p) => p.envelope === 'PEA-PME');
  const peaPmeCost = peaPmePositions.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

  const totalMarketPortfolioValue = filledMarketPositions.reduce(
    (sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1),
    0
  );

  // ── 1. PEA & PEA-PME Ceiling Alerts (Plafonds Légaux Français) ──
  if (settings.peaCeilingAlertsEnabled) {
    if (peaCost >= 150000) {
      notifications.push({
        id: 'notif-pea-full-150k',
        category: 'fiscal',
        title: '🏛️ Plafond Légal PEA Atteint (150 000 €)',
        message: `Votre PEA classique a atteint son plafond légal de versement de 150 000 €. Les versements DCA mensuels excédentaires basculent automatiquement vers votre CTO.`,
        actionHint: `Action Recommandée : Redirigez vos prochains versements DCA vers votre Compte-Titres Ordinaire (CTO) pour continuer à investir en toute légalité.`,
        actionCtaLabel: `💼 Configurer DCA sur CTO`,
        actionType: 'open-envelopes',
        timestamp: now,
        read: false,
        priority: 'high',
      });
    } else if (peaCost >= 135000) {
      notifications.push({
        id: 'notif-pea-near-full',
        category: 'fiscal',
        title: '🏛️ PEA Rempli à 90% (Attention au Plafond)',
        message: `Vos versements PEA s'élèvent à ${Math.round(peaCost).toLocaleString('fr-FR')} €. Il vous reste ${(150000 - peaCost).toLocaleString('fr-FR')} € de capacité de versement avant saturation.`,
        actionHint: `Action Recommandée : Calibrez votre DCA pour ne pas dépasser les ${(150000 - peaCost).toLocaleString('fr-FR')} € restants sur votre PEA.`,
        actionCtaLabel: `🏛️ Voir Enveloppe PEA`,
        actionType: 'open-envelopes',
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }

    if (peaCost + peaPmeCost >= 225000) {
      notifications.push({
        id: 'notif-pea-pme-full-225k',
        category: 'fiscal',
        title: '🏛️ Plafond Cumulé PEA + PEA-PME Saturation (225 000 €)',
        message: `Le cumul de vos versements sur PEA (${Math.round(peaCost).toLocaleString('fr-FR')} €) et PEA-PME (${Math.round(peaPmeCost).toLocaleString('fr-FR')} €) a atteint la limite légale absolue de 225 000 €.`,
        actionHint: `Action Recommandée : Ouvrez ou alimentez un Compte-Titres Ordinaire (CTO) pour accueillir la suite de vos investissements.`,
        actionCtaLabel: `💼 Basculer sur le CTO`,
        actionType: 'open-envelopes',
        timestamp: now,
        read: false,
        priority: 'high',
      });
    }
  }

  // ── 2. DCA Reminders (Dynamic Frequency pour le Portefeuille Boursier) ──
  if (settings.dcaReminderEnabled) {
    const currentMonth = currentDate.getMonth() + 1;
    const dcaPositions = filledMarketPositions.filter((p) => p.dcaFrequency);

    const dueQuarterly: Position[] = [];
    const dueSemestrial: Position[] = [];
    const dueAnnual: Position[] = [];

    dcaPositions.forEach((p) => {
      const dayTarget = p.dcaDepositDay || settings.dcaDayOfMonth || 5;
      const isDayNear = Math.abs(currentDay - dayTarget) <= 3 || currentDay === 1;

      if (!isDayNear) return;

      if (p.dcaFrequency === 'quarterly') {
        const isDueQuarter = currentMonth % 3 === 0 || (p.dcaDepositMonth && p.dcaDepositMonth === currentMonth);
        if (isDueQuarter) dueQuarterly.push(p);
      } else if (p.dcaFrequency === 'semestrial') {
        const isDueSem = currentMonth === 6 || currentMonth === 12 || (p.dcaDepositMonth && p.dcaDepositMonth === currentMonth);
        if (isDueSem) dueSemestrial.push(p);
      } else if (p.dcaFrequency === 'annual') {
        const isDueAnn = currentMonth === (p.dcaDepositMonth || 12);
        if (isDueAnn) dueAnnual.push(p);
      }
    });

    if (dueQuarterly.length > 0) {
      const names = dueQuarterly.map((p) => p.ticker).join(', ');
      notifications.push({
        id: `notif-dca-quarterly-${currentDate.getFullYear()}-${currentMonth}`,
        category: 'dca',
        title: '📆 Rappel DCA Trimestriel',
        message: `Il est temps d'allouer vos versements trimestriels pour : ${names}.`,
        actionHint: `Action Recommandée : N'oubliez pas vos actifs à fréquence réduite pour maintenir l'équilibre de votre portefeuille.`,
        actionCtaLabel: `🎯 Voir les positions`,
        actionType: 'open-rebalance',
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }

    if (dueSemestrial.length > 0) {
      const names = dueSemestrial.map((p) => p.ticker).join(', ');
      notifications.push({
        id: `notif-dca-semestrial-${currentDate.getFullYear()}-${currentMonth}`,
        category: 'dca',
        title: '🌓 Rappel DCA Semestriel',
        message: `Il est temps d'allouer vos versements semestriels pour : ${names}.`,
        actionHint: `Action Recommandée : Ces actifs nécessitent votre attention 2 fois par an.`,
        actionCtaLabel: `🎯 Voir les positions`,
        actionType: 'open-rebalance',
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }

    if (dueAnnual.length > 0) {
      const names = dueAnnual.map((p) => p.ticker).join(', ');
      notifications.push({
        id: `notif-dca-annual-${currentDate.getFullYear()}-${currentMonth}`,
        category: 'dca',
        title: '🏆 Rappel DCA Annuel',
        message: `C'est le mois de versement annuel pour : ${names}.`,
        actionHint: `Action Recommandée : Ces actifs stratégiques nécessitent une allocation annuelle selon votre plan.`,
        actionCtaLabel: `🎯 Voir les positions`,
        actionType: 'open-rebalance',
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }
  }

  // ── 3. Risque & Concentration du Portefeuille Boursier (Exclut les Livrets / PEE) ──
  // CONDITION : Actif dès que le portefeuille boursier a de la valeur
  if (settings.allocationDriftEnabled && totalMarketPortfolioValue > 0) {
    filledMarketPositions.forEach((p) => {
      const posVal = p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1);
      const posWeight = (posVal / totalMarketPortfolioValue) * 100;
      const isBroadEtf = p.assetType === 'ETF' || p.ticker.includes('GPEA') || p.ticker.includes('CW8') || p.ticker.includes('ACWI') || p.ticker.includes('PUST');

      // Seuils de concentration adaptés au profil de risque
      const maxAllowedSingleWeight = isBroadEtf
        ? (riskLevel === 'conservative' ? 45.0 : riskLevel === 'balanced' ? 55.0 : riskLevel === 'aggressive' ? 70.0 : 60.0)
        : (riskLevel === 'conservative' ? 15.0 : riskLevel === 'balanced' ? 25.0 : riskLevel === 'aggressive' ? 45.0 : 35.0);

      if (posWeight >= maxAllowedSingleWeight) {
        notifications.push({
          id: `notif-single-pos-drift-${p.ticker.replace(/[^a-zA-Z0-9]/g, '')}`,
          category: 'risk',
          title: `⚠️ Fort Poids Ligne : ${p.name} (${posWeight.toFixed(1)}%)`,
          message: `La ligne ${p.name} (${p.ticker}) représente ${posWeight.toFixed(1)}% de votre portefeuille boursier (seuil : ${maxAllowedSingleWeight}%).`,
          actionHint: `Action Recommandée (Horizon 15-20 ans) : Pas de vente nécessaire. Orientez simplement vos prochains versements DCA vers les autres actifs pour lisser l'allocation.`,
          actionCtaLabel: `🎯 Ajuster les Flux DCA`,
          actionType: 'open-rebalance',
          timestamp: now,
          read: false,
          priority: 'medium',
        });
      }
    });

    // Dérive thématique sur portefeuille boursier
    THEMES.forEach((theme) => {
      const themePositions = filledMarketPositions.filter((p) => theme.tickers.includes(p.ticker) || (p.themes && Array.isArray(p.themes) && p.themes.includes(theme.id)));
      const themeValueEUR = themePositions.reduce((sum, p) => {
        const val = p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1);
        const themesList = p.themes && Array.isArray(p.themes) ? p.themes : [];
        const weight = themesList.length > 0 ? 1 / themesList.length : 1;
        return sum + val * weight;
      }, 0);

      const exposure = (themeValueEUR / totalMarketPortfolioValue) * 100;
      const maxPct = theme.maxExposure * 100;
      const driftTolerance = riskLevel === 'conservative' ? 5.0 : riskLevel === 'balanced' ? 8.0 : riskLevel === 'aggressive' ? 15.0 : 10.0;

      if (exposure > maxPct + driftTolerance) {
        notifications.push({
          id: `notif-drift-${theme.id}`,
          category: 'risk',
          title: `⚡ Alerte Dérive Thématique Forte : ${theme.label}`,
          message: `L'exposition boursière à la thématique '${theme.label}' (${exposure.toFixed(1)}%) dépasse la cible (${maxPct.toFixed(0)}%).`,
          actionHint: `Action Recommandée : Fléchez vos prochains DCA mensuels vers les autres thématiques sans vendre vos actifs long terme.`,
          actionCtaLabel: `🎯 Diluer par DCA`,
          actionType: 'open-rebalance',
          timestamp: now,
          read: false,
          priority: 'medium',
        });
      }
    });
  }

  // ── 4. Opportunités d'Achat Boursières (Baisse > 20% sur conviction) ──
  if (settings.outlierAlertsEnabled ?? true) {
    filledMarketPositions.forEach((p) => {
      if (p.currentPrice && p.avgPrice && p.avgPrice > 0) {
        const movePct = ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100;
        if (movePct <= -20.0) {
          notifications.push({
            id: `notif-dip-${p.ticker.replace(/[^a-zA-Z0-9]/g, '')}`,
            category: 'outlier',
            title: `⚡ Baisse Marquée : ${p.name} (${movePct.toFixed(1)}%)`,
            message: `${p.name} (${p.ticker}) cote sous votre PRU (-${Math.abs(movePct).toFixed(1)}%). C'est une opportunité idéale pour abaisser votre prix moyen d'achat.`,
            actionHint: `Action Recommandée : Renforcez la position via votre prochain versement DCA pour optimiser votre rentabilité à long terme.`,
            actionCtaLabel: `🔬 Lancer une Analyse IA`,
            actionType: 'open-analysis',
            timestamp: now,
            read: false,
            priority: 'high',
          });
        }
      }
    });
  }

  return notifications;
}
