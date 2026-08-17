'use client';

import React from 'react';
import type { SavingsDeposit } from '@/types/portfolio';
import CustomDatePicker from '@/components/CustomDatePicker';

interface SavingsDepositsSectionProps {
  depositsHistory: SavingsDeposit[];
  onDepositsHistoryChange: (deposits: SavingsDeposit[]) => void;
  currency?: string;
}

export default function SavingsDepositsSection({
  depositsHistory,
  onDepositsHistoryChange,
  currency = 'EUR',
}: SavingsDepositsSectionProps) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  const handleAddDeposit = (category: SavingsDeposit['category'] = 'LIBRE', customLabel?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newDep: SavingsDeposit = {
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: todayStr,
      amount: category === 'PRIME' ? 2000 : category === 'ABONDEMENT' ? 500 : 1000,
      label:
        customLabel ||
        (category === 'PRIME'
          ? 'Prime Intéressement'
          : category === 'ABONDEMENT'
          ? 'Abondement Entreprise'
          : 'Versement Ponctuel'),
      category,
    };
    onDepositsHistoryChange([...depositsHistory, newDep]);
  };

  const handleUpdateDeposit = (id: string, updates: Partial<SavingsDeposit>) => {
    onDepositsHistoryChange(
      depositsHistory.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const handleDeleteDeposit = (id: string) => {
    onDepositsHistoryChange(depositsHistory.filter((d) => d.id !== id));
  };

  const handleClearAllDeposits = () => {
    if (confirm('Voulez-vous supprimer tous les versements exceptionnels enregistrés ?')) {
      onDepositsHistoryChange([]);
    }
  };

  const totalDeposits = depositsHistory.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>📥</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-cyan)' }}>
            Versements libres &amp; Primes exceptionnelles (PEE, Intéressement, Abondement)
          </span>
        </div>
        {depositsHistory.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.12)',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 700,
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              {depositsHistory.length} versement{depositsHistory.length > 1 ? 's' : ''} ({totalDeposits.toLocaleString('fr-FR')} {currencySymbol})
            </span>
            {depositsHistory.length > 3 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 10, padding: '2px 6px', color: 'var(--accent-rose)' }}
                onClick={handleClearAllDeposits}
                title="Effacer tous les versements"
              >
                🗑️ Tout effacer
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
        Ajoutez vos primes annuelles, abondements employeur ou versements ponctuels. Chaque versement génère automatiquement ses propres intérêts historiques à partir de sa date exacte.
      </p>

      {/* Quick Add Preset Buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
          onClick={() => handleAddDeposit('PRIME', 'Prime Intéressement')}
        >
          ➕ Prime Intéressement
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
          onClick={() => handleAddDeposit('PRIME', 'Prime Participation')}
        >
          ➕ Prime Participation
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
          onClick={() => handleAddDeposit('ABONDEMENT', 'Abondement Employeur')}
        >
          ➕ Abondement Employeur
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
          onClick={() => handleAddDeposit('LIBRE', 'Versement Libre')}
        >
          ➕ Versement Libre
        </button>
      </div>

      {/* Deposits List */}
      {depositsHistory.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 220,
            overflowY: 'auto',
            paddingRight: 4,
            scrollbarWidth: 'thin',
          }}
        >
          {depositsHistory.map((dep, idx) => (
            <div
              key={dep.id || idx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(90px, 0.9fr) minmax(110px, 1fr) 28px',
                gap: 8,
                alignItems: 'center',
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                  Libellé / Type
                </label>
                <input
                  className="input"
                  style={{ fontSize: 12, padding: '5px 8px' }}
                  value={dep.label || ''}
                  onChange={(e) => handleUpdateDeposit(dep.id, { label: e.target.value })}
                  placeholder="Ex: Prime 2024"
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                  Date du versement
                </label>
                <CustomDatePicker
                  value={dep.date}
                  onChange={(newDate) => handleUpdateDeposit(dep.id, { date: newDate })}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                  Montant ({currencySymbol})
                </label>
                <input
                  className="input mono"
                  type="number"
                  step="50"
                  min="0"
                  style={{ fontSize: 12, padding: '5px 8px' }}
                  value={dep.amount}
                  onChange={(e) => handleUpdateDeposit(dep.id, { amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                  Catégorie
                </label>
                <select
                  className="input"
                  style={{ fontSize: 11, padding: '5px 6px' }}
                  value={dep.category || 'LIBRE'}
                  onChange={(e) => handleUpdateDeposit(dep.id, { category: e.target.value as any })}
                >
                  <option value="PRIME">Prime</option>
                  <option value="ABONDEMENT">Abondement</option>
                  <option value="LIBRE">Libre</option>
                  <option value="INITIAL">Initial</option>
                </select>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-rose)', padding: '2px', minWidth: 20, fontSize: 14 }}
                  onClick={() => handleDeleteDeposit(dep.id)}
                  title="Supprimer ce versement"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
          Aucun versement exceptionnel ajouté. Utilisez les boutons ci-dessus pour en créer un.
        </div>
      )}
    </div>
  );
}
