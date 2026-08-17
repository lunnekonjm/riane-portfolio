'use client';

import React from 'react';

interface AuraSalaryUploadCardProps {
  fileName: string | null;
  isParsing: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newEmployer: string;
  setNewEmployer: (val: string) => void;
  newPeriod: string;
  setNewPeriod: (val: string) => void;
  newNet: number;
  setNewNet: (val: number) => void;
  newGross: number;
  setNewGross: (val: number) => void;
  newBonus: number;
  setNewBonus: (val: number) => void;
  newTaxRate: number;
  setNewTaxRate: (val: number) => void;
  redactedText: string | null;
  onSaveParsedRecord: () => void;
}

export function AuraSalaryUploadCard({
  fileName,
  isParsing,
  onFileUpload,
  newEmployer,
  setNewEmployer,
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
  redactedText,
  onSaveParsedRecord,
}: AuraSalaryUploadCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Zone de Drag & Drop */}
      <div
        className="card"
        style={{
          padding: 30,
          border: '2px dashed rgba(6, 182, 212, 0.4)',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(15, 23, 42, 0.9) 100%)',
          textAlign: 'center',
          borderRadius: 16,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={onFileUpload}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
        <div style={{ fontSize: 40, marginBottom: 10 }}>📥</div>
        <h4 style={{ fontSize: 16, margin: '0 0 6px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
          Déposez votre fiche de paie (PDF ou Image)
        </h4>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          Extraction automatique des lignes (Brut, Net, Cotisations, Primes, PAS) et masquage instantané des données sensibles (NIR, IBAN, adresse).
        </p>
        {fileName && (
          <div style={{ marginTop: 14, display: 'inline-block', padding: '4px 12px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: 20, fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 700 }}>
            📄 {fileName} {isParsing ? '⏳ Analyse en cours...' : '✅ Prêt'}
          </div>
        )}
      </div>

      {/* Formulaire de validation des montants extraits */}
      <div className="card" style={{ padding: 22 }}>
        <h4 style={{ fontSize: 15, margin: '0 0 14px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
          ✍️ Vérification &amp; Enregistrement du Bulletin
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Employeur</label>
            <input type="text" className="input" value={newEmployer} onChange={(e) => setNewEmployer(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Période</label>
            <input type="month" className="input" value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Net à payer (€)</label>
            <input type="number" className="input" value={newNet} onChange={(e) => setNewNet(Number(e.target.value))} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Salaire Brut (€)</label>
            <input type="number" className="input" value={newGross} onChange={(e) => setNewGross(Number(e.target.value))} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Prime (€)</label>
            <input type="number" className="input" value={newBonus} onChange={(e) => setNewBonus(Number(e.target.value))} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Taux PAS (%)</label>
            <input type="number" step="0.1" className="input" value={newTaxRate} onChange={(e) => setNewTaxRate(Number(e.target.value))} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>

        {redactedText && (
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              🛡️ Rendu Caviardé RGPD (Données personnelles protégées) :
            </span>
            <pre style={{ margin: 0, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {redactedText}
            </pre>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={onSaveParsedRecord}
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700, padding: '12px 18px' }}
        >
          💾 Enregistrer ce bulletin dans l&apos;historique
        </button>
      </div>
    </div>
  );
}
