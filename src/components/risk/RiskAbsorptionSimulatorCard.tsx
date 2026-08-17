'use client';

import React from 'react';
import type { PortfolioConfig } from '@/types/portfolio';
import InfoTooltip from '@/components/InfoTooltip';

interface RiskAbsorptionSimulatorCardProps {
  marketVal: number;
  savingsVal: number;
  config?: PortfolioConfig | null;
  simulatedMarketDrop: number;
  setSimulatedMarketDrop: (drop: number) => void;
  onOpenMonteCarlo: () => void;
}

export function RiskAbsorptionSimulatorCard({
  marketVal,
  savingsVal,
  config,
  simulatedMarketDrop,
  setSimulatedMarketDrop,
  onOpenMonteCarlo,
}: RiskAbsorptionSimulatorCardProps) {
  const marketCapital = marketVal || 0;
  const monthlyBudget = config?.monthlyBudget || 1000;
  const nominalLoss = marketCapital * simulatedMarketDrop;
  const monthsToAbsorb = monthlyBudget > 0 ? (nominalLoss / monthlyBudget).toFixed(1) : '0.0';
  const partsBonusPercent = (100 / (1 - simulatedMarketDrop) - 100).toFixed(0);
  const pruDiscountPercent =
    marketCapital > 0
      ? (((simulatedMarketDrop * monthlyBudget) / (marketCapital + monthlyBudget)) * 100).toFixed(1)
      : (simulatedMarketDrop * 100).toFixed(1);

  return (
    <div
      className="card"
      style={{
        borderLeft: '4px solid var(--accent-cyan)',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)',
      }}
    >
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">🛡️ Simulateur d&apos;Absorption DCA &amp; Résilience de Marché</span>
            <span className="badge badge-cyan" style={{ fontSize: 11, fontWeight: 700 }}>
              Horizon 15-20 ans
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Simulez l&apos;impact d&apos;un krach sur vos actions cotées et visualisez comment vos versements mensuels absorbent la baisse et optimisent votre PRU.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
            onClick={onOpenMonteCarlo}
          >
            🎲 Simulation Monte Carlo 15-20 ans
          </button>
        </div>
      </div>

      {/* Sélecteur Interactif de Baisse de Marché */}
      <div
        style={{
          margin: '14px 0 16px 0',
          background: 'var(--bg-secondary)',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Choc de Marché Testé :</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>
            -{(simulatedMarketDrop * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { rate: 0.1, label: '🟡 Choc Léger (-10%)' },
            { rate: 0.2, label: '🟠 Correction (-20%)' },
            { rate: 0.3, label: '🔴 Krach Modéré (-30%)' },
            { rate: 0.4, label: '⚡ Krach Sévère (-40%)' },
            { rate: 0.5, label: '💥 Krach Historique (-50%)' },
          ].map(({ rate, label }) => (
            <button
              key={rate}
              type="button"
              className={`btn btn-sm ${simulatedMarketDrop === rate ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                background: simulatedMarketDrop === rate ? 'var(--accent-rose)' : undefined,
                color: simulatedMarketDrop === rate ? '#fff' : undefined,
              }}
              onClick={() => setSimulatedMarketDrop(rate)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Indicateurs Pratiques & Mathématiques avec Info-Bulles */}
      <div className="grid-4" style={{ marginBottom: 14, gap: 16 }}>
        {/* 1. Perte Nominale sur Capital Coté */}
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Baisse sur Capital Coté
            </span>
            <InfoTooltip
              title="Baisse sur Capital Coté"
              text="Cette baisse ne concerne que vos investissements boursiers (PEA, CTO). Il s'agit d'une perte latente (non réalisée) : tant que vous ne vendez pas, aucune perte n'est matérialisée."
              color="cyan"
              align="right"
            />
          </div>
          <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-rose)', display: 'block', margin: '4px 0' }}>
            -{Math.round(nominalLoss).toLocaleString('fr-FR')} €
          </strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Sur vos positions cotées ({Math.round(marketCapital).toLocaleString('fr-FR')} €). <em>(Perte latente)</em>.
          </div>
        </div>

        {/* 2. Vitesse d'Absorption par le DCA */}
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Temps d&apos;Absorption DCA
            </span>
            <InfoTooltip
              title="Temps d'Absorption DCA"
              text={`Nombre précis de mois de versements réguliers (${monthlyBudget.toLocaleString('fr-FR')} € / mois) nécessaires pour injecter un capital neuf équivalent à 100% de la baisse subie.`}
              color="emerald"
              align="right"
            />
          </div>
          <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-emerald)', display: 'block', margin: '4px 0' }}>
            {monthsToAbsorb} mois
          </strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Avec vos <strong>{monthlyBudget.toLocaleString('fr-FR')} € / mois</strong>, vous réinjectez 100% de la baisse en {Math.ceil(parseFloat(monthsToAbsorb))} versement(s).
          </div>
        </div>

        {/* 3. Rabais Immédiat sur les Nouveaux Achats */}
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Multiplicateur de Parts
            </span>
            <InfoTooltip
              title="Multiplicateur de Parts"
              text={`À budget d'épargne constant (${monthlyBudget.toLocaleString('fr-FR')} €), la baisse des cours vous permet d'acheter mathématiquement +${partsBonusPercent}% de parts d'ETF et d'actions supplémentaires par rapport au sommet.`}
              color="cyan"
              align="right"
            />
          </div>
          <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-cyan)', display: 'block', margin: '4px 0' }}>
            +{partsBonusPercent}% de parts
          </strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Pour le même versement mensuel, vous accumulez nettement plus de titres.
          </div>
        </div>

        {/* 4. Levier de Baisse du PRU Moyen */}
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Décote sur le PRU Global
            </span>
            <InfoTooltip
              title="Décote sur le PRU"
              text={`Mesure la baisse immédiate de votre Prix de Revient Unitaire (PRU) moyen global dès l'injection de votre versement mensuel de ${monthlyBudget.toLocaleString('fr-FR')} € à cours soldés.`}
              color="amber"
              align="right"
            />
          </div>
          <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-amber)', display: 'block', margin: '4px 0' }}>
            -{pruDiscountPercent}% sur le PRU
          </strong>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Abaissment direct de votre prix moyen d&apos;achat grâce au versement mensuel.
          </div>
        </div>
      </div>

      {/* Bandeau de Matelas Garanti & Sécurité */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(6, 182, 212, 0.08)',
          borderRadius: 8,
          border: '1px solid rgba(6, 182, 212, 0.2)',
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.45,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <strong>Matelas de Sécurité Sanctuarisé :</strong> Vos <strong>{(savingsVal || 0).toLocaleString('fr-FR')} € de Livrets</strong> restent 100% intacts (0% de perte boursière) pour couvrir vos dépenses courantes sans jamais être contraint de vendre à perte.
          </div>
        </div>
        <InfoTooltip
          title="Rôle Stratégique du Matelas"
          text="Le Livret A sert d'armure psychologique et financière : il vous garantit de ne jamais liquider vos actions à bas prix en cas de coup dur."
          color="cyan"
          align="right"
        />
      </div>
    </div>
  );
}
