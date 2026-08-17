'use client';

import React from 'react';
import CustomDatePicker from '@/components/CustomDatePicker';

interface DcaSimpleModeFormProps {
  dcaFrequency: string;
  onDcaFrequencyChange: (freq: string) => void;
  dcaDepositDay: number;
  onDcaDepositDayChange: (day: number) => void;
  dcaDepositMonth: number;
  onDcaDepositMonthChange?: (m: number) => void;
  monthlyDCA?: number;
  onMonthlyDCAChange: (amount?: number) => void;
  dcaStartDate: string;
  onDcaStartDateChange: (date: string) => void;
  currencySymbol: string;
  onCreateSuccessorTranche: () => void;
}

export function DcaSimpleModeForm({
  dcaFrequency,
  onDcaFrequencyChange,
  dcaDepositDay,
  onDcaDepositDayChange,
  dcaDepositMonth,
  onDcaDepositMonthChange,
  monthlyDCA,
  onMonthlyDCAChange,
  dcaStartDate,
  onDcaStartDateChange,
  currencySymbol,
  onCreateSuccessorTranche,
}: DcaSimpleModeFormProps) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 12 }}>
        <div className="form-group" style={{ minWidth: 115 }}>
          <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            Fréquence
          </label>
          <select
            className="input"
            style={{ fontSize: 13, padding: '8px 10px' }}
            value={dcaFrequency || 'monthly'}
            onChange={(e) => onDcaFrequencyChange(e.target.value)}
          >
            <option value="monthly">Mensuel</option>
            <option value="quarterly">Trimestriel</option>
            <option value="semestrial">Semestriel</option>
            <option value="annual">Annuel</option>
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 75 }}>
          <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            Jour (cible)
          </label>
          <select
            className="input"
            style={{ fontSize: 13, padding: '8px 10px' }}
            value={(dcaDepositDay || 5).toString()}
            onChange={(e) => onDcaDepositDayChange(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        {(dcaFrequency === 'annual' || dcaFrequency === 'quarterly' || dcaFrequency === 'semestrial') && onDcaDepositMonthChange && (
          <div className="form-group" style={{ minWidth: 110 }}>
            <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Mois (cible)
            </label>
            <select
              className="input"
              style={{ fontSize: 13, padding: '8px 10px' }}
              value={dcaDepositMonth.toString()}
              onChange={(e) => onDcaDepositMonthChange(parseInt(e.target.value, 10))}
            >
              <option value="1">Janvier</option>
              <option value="2">Février</option>
              <option value="3">Mars</option>
              <option value="4">Avril</option>
              <option value="5">Mai</option>
              <option value="6">Juin</option>
              <option value="7">Juillet</option>
              <option value="8">Août</option>
              <option value="9">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>
          </div>
        )}

        <div className="form-group" style={{ minWidth: 95 }}>
          <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            Montant ({currencySymbol})
          </label>
          <input
            className="input mono"
            type="number"
            step="10"
            min="0"
            style={{ fontSize: 13, padding: '8px 10px' }}
            value={monthlyDCA ?? ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              onMonthlyDCAChange(val === '' ? undefined : parseFloat(val));
            }}
            placeholder="0"
          />
        </div>

        <div className="form-group" style={{ minWidth: 155, flex: 1.2 }}>
          <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            Début du versement
          </label>
          <CustomDatePicker value={dcaStartDate} onChange={onDcaStartDateChange} />
        </div>
      </div>

      <div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, color: 'var(--accent-cyan)', borderColor: 'var(--border-accent)', fontWeight: 600 }}
          onClick={onCreateSuccessorTranche}
        >
          📈 Historiser une évolution de DCA (créer un palier avec date d'effet)
        </button>
      </div>
    </>
  );
}
