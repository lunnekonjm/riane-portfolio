'use client';

import React, { useState } from 'react';
import type { SalaryRecord } from '@/types/revenue';
import { useBoursoLive } from '@/hooks/useBoursoLive';

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
  onSelectRecord,
  onOpenSalaryAudit,
  onOpenRules,
  onOpenIntegrationsHub,
}) => {
  const boursoLive = useBoursoLive();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [activeModalSegment, setActiveModalSegment] = useState<AllocationSegment | null>(null);

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
      color: '#f43f5e', // Rose
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
      color: '#06b6d4', // Cyan
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
      color: '#f59e0b', // Amber / Gold
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
      color: '#10b981', // Emerald
      subItems: [
        {
          name: 'Dépenses courantes Revolut',
          amount: Math.round(netSalary * 0.07 * 100) / 100,
          subtext: 'Courses, loisirs & vie quotidienne',
        },
      ],
    },
  ];

  const selectedSegment = selectedSegmentIndex !== null ? segments[selectedSegmentIndex] : null;
  const displayAmount = selectedSegment
    ? Math.round((netSalary * selectedSegment.percentage) / 100)
    : Math.round(netSalary);

  // SVG Donut Calculations
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Colonne Donut Chart */}
        <div
          className="card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
          }}
        >
          <h4 style={{ fontSize: 15, margin: '0 0 16px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
            🍩 Répartition Mensuelle du Salaire Net
          </h4>

          {/* SVG Donut Chart */}
          <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              {/* Fond de piste */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
              />

              {/* Segments colorés */}
              {segments.map((seg, idx) => {
                const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += (seg.percentage / 100) * circumference;
                const isSelected = selectedSegmentIndex === idx;

                return (
                  <circle
                    key={seg.id}
                    cx={center}
                    cy={center}
                    r={isSelected ? radius + 2 : radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isSelected ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: selectedSegmentIndex === null || isSelected ? 1 : 0.45,
                    }}
                    onClick={() => {
                      setSelectedSegmentIndex(isSelected ? null : idx);
                      setActiveModalSegment(seg);
                    }}
                  />
                );
              })}
            </svg>

            {/* Texte au centre du Donut */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: selectedSegment ? selectedSegment.color : 'var(--text-secondary)',
                }}
              >
                {selectedSegment ? selectedSegment.label : 'ALLOCATION'}
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: selectedSegment ? selectedSegment.color : 'var(--text-primary)',
                  marginTop: 2,
                }}
              >
                {displayAmount.toLocaleString('fr-FR')} €
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {selectedSegment ? `${selectedSegment.percentage}% du net` : '/ mois'}
              </span>
            </div>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 16 }}>
            💡 Cliquez sur un segment ou un bouton pour voir la décomposition détaillée.
          </span>
        </div>

        {/* Colonne Cartes des 4 Postes d'Allocation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {segments.map((seg, idx) => {
            const isSelected = selectedSegmentIndex === idx;
            const amt = Math.round((netSalary * seg.percentage) / 100);

            return (
              <div
                key={seg.id}
                onClick={() => {
                  setSelectedSegmentIndex(isSelected ? null : idx);
                  setActiveModalSegment(seg);
                }}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: isSelected ? `${seg.color}15` : 'var(--bg-secondary)',
                  border: isSelected ? `2px solid ${seg.color}` : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: seg.color }} />
                  <div>
                    <strong style={{ fontSize: 14, color: isSelected ? seg.color : 'var(--text-primary)' }}>
                      {seg.label} ({seg.percentage}%)
                    </strong>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {seg.subItems.map((s) => s.name).join(', ')}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: 16, color: seg.color, fontFamily: 'var(--font-mono)' }}>
                    {amt.toLocaleString('fr-FR')} €
                  </strong>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>/ mois</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💼 DÉCOMPOSITION DE LA FICHE DE PAIE (AURA SALARY BREAKDOWN) */}
      <div className="card" style={{ padding: 22 }}>
        <h4 style={{ fontSize: 15, margin: '0 0 14px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
          💼 Décomposition Salariale Réelle
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Salaire Brut</span>
            <strong style={{ fontSize: 17, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {grossSalary.toLocaleString('fr-FR')} €
            </strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Cotisations Sociales</span>
            <strong style={{ fontSize: 17, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
              {socialContributions.toLocaleString('fr-FR')} €
            </strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Titres Restaurant</span>
            <strong style={{ fontSize: 17, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              {mealTickets.toLocaleString('fr-FR')} €
            </strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Indemnité Télétravail</span>
            <strong style={{ fontSize: 17, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              +{teleworkAllowance.toLocaleString('fr-FR')} €
            </strong>
          </div>

          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: 12, borderRadius: 10, border: '1px solid var(--accent-cyan)' }}>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, display: 'block' }}>Net à Payer</span>
            <strong style={{ fontSize: 18, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              +{netSalary.toLocaleString('fr-FR')} €
            </strong>
          </div>
        </div>
      </div>

      {/* 🔍 MODAL DE DÉCOMPOSITION DU POSTE CLIQUÉ */}
      {activeModalSegment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 24,
              borderRadius: 16,
              border: `1px solid ${activeModalSegment.color}`,
              background: 'var(--bg-primary)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: activeModalSegment.color }} />
                <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Détail &mdash; {activeModalSegment.label} ({activeModalSegment.percentage}%)
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveModalSegment(null)}
                style={{ fontSize: 18, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: `${activeModalSegment.color}15`,
                border: `1px solid ${activeModalSegment.color}40`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Montant Total Alloué :</span>
              <strong style={{ fontSize: 18, color: activeModalSegment.color, fontFamily: 'var(--font-mono)' }}>
                {Math.round((netSalary * activeModalSegment.percentage) / 100).toLocaleString('fr-FR')} € / mois
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Décomposition des sous-postes :
              </span>
              {activeModalSegment.subItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</strong>
                    {item.subtext && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.subtext}</div>
                    )}
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {item.amount.toLocaleString('fr-FR')} €
                  </strong>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveModalSegment(null)}
              style={{ marginTop: 18, width: '100%', fontWeight: 700 }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
