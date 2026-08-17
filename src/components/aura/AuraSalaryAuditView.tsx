'use client';

import React from 'react';
import type { SalaryRecord, ReserveAllocation } from '@/types/revenue';
import { SalaryTrendChart } from '@/components/SalaryTrendChart';
import { useAuraSalaryAuditState } from '@/hooks/useAuraSalaryAuditState';
import { AuraSalaryUploadCard } from './salary/AuraSalaryUploadCard';
import { AuraSalaryHistoryTable } from './salary/AuraSalaryHistoryTable';

interface AuraSalaryAuditViewProps {
  records: SalaryRecord[];
  allocations: ReserveAllocation[];
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuraSalaryAuditView: React.FC<AuraSalaryAuditViewProps> = ({
  records,
  allocations,
  onSaveRecord,
  onDeleteRecord,
  onShowToast,
}) => {
  const {
    activeSubTab,
    setActiveSubTab,
    fileName,
    isParsing,
    redactedText,
    newPeriod,
    setNewPeriod,
    newNet,
    setNewNet,
    newGross,
    setNewGross,
    newBonus,
    setNewBonus,
    newTaxRate,
    setNewTaxRate,
    newEmployer,
    setNewEmployer,
    cleanRecords,
    analytics,
    handleFileUpload,
    handleSaveParsedRecord,
  } = useAuraSalaryAuditState({
    records,
    allocations,
    onSaveRecord,
    onShowToast,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🧭 NAVIGATION SUB-TABS SALARY AUDIT */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
          borderRadius: 14,
          padding: 6,
          display: 'flex',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab(0)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: activeSubTab === 0 ? 800 : 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            background: activeSubTab === 0 ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 0 ? '2px solid var(--accent-cyan)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>📄 1. Importation &amp; Caviardage RGPD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab(1)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: activeSubTab === 1 ? 800 : 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            background: activeSubTab === 1 ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeSubTab === 1 ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 1 ? '2px solid var(--accent-emerald)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>📈 2. Évolutions &amp; Bilan Annuel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab(2)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: activeSubTab === 2 ? 800 : 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            background: activeSubTab === 2 ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
            color: activeSubTab === 2 ? '#818cf8' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 2 ? '2px solid #818cf8' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>📋 3. Historique des Fiches ({cleanRecords.length})</span>
        </button>
      </div>

      {/* --- ONGLET 0 : IMPORTATION & CAVIARDAGE RGPD --- */}
      {activeSubTab === 0 && (
        <AuraSalaryUploadCard
          fileName={fileName}
          isParsing={isParsing}
          onFileUpload={handleFileUpload}
          newEmployer={newEmployer}
          setNewEmployer={setNewEmployer}
          newPeriod={newPeriod}
          setNewPeriod={setNewPeriod}
          newNet={newNet}
          setNewNet={setNewNet}
          newGross={newGross}
          setNewGross={setNewGross}
          newBonus={newBonus}
          setNewBonus={setNewBonus}
          newTaxRate={newTaxRate}
          setNewTaxRate={setNewTaxRate}
          redactedText={redactedText}
          onSaveParsedRecord={handleSaveParsedRecord}
        />
      )}

      {/* --- ONGLET 1 : ÉVOLUTIONS & BILAN ANNUEL --- */}
      {activeSubTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SalaryTrendChart records={cleanRecords} />

          {/* Bilan Annuel Recap */}
          <div className="card" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 15, margin: '0 0 14px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
              📊 Bilan Financier Annuel Lissée
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Salaire Net Moyen</span>
                <strong style={{ fontSize: 20, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(analytics.overallAverageNet).toLocaleString('fr-FR')} € / m
                </strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Capacité d&apos;Investissement Moyenne</span>
                <strong style={{ fontSize: 20, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(analytics.overallAverageInvestable).toLocaleString('fr-FR')} € / m
                </strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Réserve de Primes</span>
                <strong style={{ fontSize: 20, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(analytics.totalReserveBalanceAvailable).toLocaleString('fr-FR')} €
                </strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Taux PAS Moyen</span>
                <strong style={{ fontSize: 20, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  {analytics.averageEffectiveTaxRate.toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET 2 : HISTORIQUE COMPLET DES BULLETINS --- */}
      {activeSubTab === 2 && (
        <AuraSalaryHistoryTable
          records={cleanRecords}
          onDeleteRecord={onDeleteRecord}
          onOpenUpload={() => setActiveSubTab(0)}
        />
      )}
    </div>
  );
};
