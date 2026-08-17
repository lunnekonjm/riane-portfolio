'use client';

import React from 'react';
import type { SalaryRecord } from '@/types/revenue';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import { AuraDonutBudgetChart } from './dashboard/AuraDonutBudgetChart';
import { AuraPayslipBreakdownCard } from './dashboard/AuraPayslipBreakdownCard';

export interface AllocationSubItem {
  name: string;
  amount: number;
  subtext?: string;
}

export interface AllocationSegment {
  id: string;
  label: string;
  percentage: number;
  color: string;
  subItems: AllocationSubItem[];
}

interface AuraDashboardViewProps {
  records: SalaryRecord[];
  activeRecord: SalaryRecord | null;
  onSelectRecord: (record: SalaryRecord) => void;
  onOpenSalaryAudit: () => void;
  onOpenRules: () => void;
  onOpenIntegrationsHub?: () => void;
}

export const AuraDashboardView: React.FC<AuraDashboardViewProps> = ({
  records,
  activeRecord,
  onOpenSalaryAudit,
  onOpenRules,
}) => {
  const boursoLive = useBoursoLive();

  // Baseline net salary
  const netSalary = activeRecord?.netSalary ?? 2713.74;
  const grossSalary = activeRecord?.grossSalary ?? 3776.67;
  const socialContributions = activeRecord?.socialContributions ?? -840.78;
  const mealTickets = activeRecord?.mealTickets ?? -52.80;
  const teleworkAllowance = activeRecord?.teleworkAllowance ?? 15.00;
  const employerName = activeRecord?.employerName ?? 'Entreprise Salariée';
  const periodLabel = activeRecord?.periodLabel ?? 'Juillet 2026';

  // Segments d'allocation Aura Budget exacts
  const segments: AllocationSegment[] = [
    {
      id: 'charges',
      label: 'Charges Fixes',
      percentage: 51,
      color: '#f43f5e',
      subItems: [
        { name: 'Loyer', amount: 677.0, subtext: 'Charge fixe incompressible' },
        { name: 'Abonnements & Médias', amount: 41.0, subtext: 'Internet, Téléphone, Streaming' },
        { name: 'Tontine', amount: 300.0, subtext: 'Cotisation tontine mensuelle' },
        { name: 'Soutien Familial', amount: 231.0, subtext: 'Contribution mensuelle' },
      ],
    },
    {
      id: 'pea',
      label: 'Cible PEA',
      percentage: 35,
      color: '#06b6d4',
      subItems: [
        {
          name: 'DCA ETF MSCI World / S&P 500',
          amount: Math.round(netSalary * 0.35 * 100) / 100,
          subtext: 'Investissement actions long terme',
        },
      ],
    },
    {
      id: 'livret_a',
      label: 'Livret A',
      percentage: 7,
      color: '#f59e0b',
      subItems: [
        {
          name: "Fond d'urgence / Épargne liquide",
          amount: Math.round(netSalary * 0.07 * 100) / 100,
          subtext: 'Épargne de précaution disponible',
        },
      ],
    },
    {
      id: 'reste_a_vivre',
      label: 'Reste à vivre',
      percentage: 7,
      color: '#10b981',
      subItems: [
        {
          name: 'Dépenses courantes Revolut',
          amount: Math.round(netSalary * 0.07 * 100) / 100,
          subtext: 'Courses, loisirs & vie quotidienne',
        },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ⚡ BANNIÈRE SÉLECTEUR DE BULLETIN DE SALAIRE (AURA HEADER) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          padding: '14px 18px',
          borderRadius: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {employerName} &bull; Bulletin Actif : {periodLabel}
              </strong>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                }}
              >
                BASELINE ACTIVE
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Net à payer : <strong style={{ color: 'var(--accent-cyan)' }}>{netSalary.toLocaleString('fr-FR')} €</strong> | Brut : {grossSalary.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenSalaryAudit}
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            🔄 Changer de Bulletin ({records.length})
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenRules}
            style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
          >
            ⚖️ Configurer Règles
          </button>
        </div>
      </div>

      {/* 🏦 BANQUE BOURSOBANK LIVE CARD */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: 16,
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏦</span>
            <div>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>BoursoBank Open Banking Live</strong>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Soldes réels synchronisés via TrueLayer</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Compte Courant</span>
              <strong style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {boursoLive.checkingEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </strong>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>⚡ Compte Tampon</span>
              <strong style={{ fontSize: 14, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {boursoLive.tamponEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </strong>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>🛡️ Livret A</span>
              <strong style={{ fontSize: 14, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {boursoLive.livretAEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 🍩 DONUT CHART INTERACTIF & REPARTITION DU BUDGET */}
      <AuraDonutBudgetChart netSalary={netSalary} segments={segments} />

      {/* 💼 DÉCOMPOSITION DE LA FICHE DE PAIE */}
      <AuraPayslipBreakdownCard
        grossSalary={grossSalary}
        socialContributions={socialContributions}
        mealTickets={mealTickets}
        teleworkAllowance={teleworkAllowance}
        netSalary={netSalary}
      />
    </div>
  );
};
