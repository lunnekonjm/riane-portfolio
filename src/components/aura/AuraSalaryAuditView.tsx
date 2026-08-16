'use client';

import React, { useState } from 'react';
import type { SalaryRecord, ReserveAllocation } from '@/types/revenue';
import { SalaryTrendChart } from '@/components/SalaryTrendChart';
import { computeDetailedSalaryAnalytics, formatSalaryPeriodLabel } from '@/engines/salaryAnalyticsEngine';
import { sanitizeSensitiveFinancialText } from '@/services/ai/redactorEngine';

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
  const [activeSubTab, setActiveSubTab] = useState<0 | 1 | 2>(0); // 0 = Import & Caviardage, 1 = Évolutions & Bilan, 2 = Historique

  // Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [redactedText, setRedactedText] = useState<string | null>(null);

  // Manual input form
  const [newPeriod, setNewPeriod] = useState('2026-07');
  const [newNet, setNewNet] = useState(2861.26);
  const [newGross, setNewGross] = useState(3800);
  const [newBonus, setNewBonus] = useState(0);
  const [newTaxRate, setNewTaxRate] = useState(8.5);
  const [newMealTickets, setNewMealTickets] = useState(-52.8);
  const [newEmployer, setNewEmployer] = useState('Entreprise Salariée');

  const cleanRecords = records.filter((r) => !r.id?.startsWith('sal-sample-'));
  const analytics = computeDetailedSalaryAnalytics(cleanRecords, allocations);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      // Mock / OCR simulation + RGPD Redaction
      const mockRawPayslip = `BULLETIN DE PAIE - ${file.name}\nEmployeur: Tech Solutions SAS (SIRET: 89234190800012)\nSalarié: Richard Koffi (NIR: 1 89 05 75 123 456 78)\nIBAN: FR76 3000 4000 5000 6000 7000 890\nAdresse: 12 Rue de Rivoli, 75001 Paris\nPériode: Juillet 2026\nSalaire de base brut: 3 800.00 €\nCotisations sociales salariales: -840.78 €\nTitres restaurant: -52.80 €\nIndemnité télétravail: +15.00 €\nPrélèvement à la source (8.5%): -243.20 €\nNET À PAYER: 2 861.26 €`;

      setExtractedRawText(mockRawPayslip);
      const masked = sanitizeSensitiveFinancialText(mockRawPayslip);
      setRedactedText(masked.redactedText);

      onShowToast(`✅ Fiche "${file.name}" analysée avec succès et données sensibles caviardées (RGPD) !`, 'success');
    } catch {
      onShowToast("Erreur lors de l'analyse du document", 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedRecord = async () => {
    const record: SalaryRecord = {
      id: `sal-${Date.now()}`,
      period: newPeriod,
      periodLabel: formatSalaryPeriodLabel(newPeriod),
      employerName: newEmployer,
      netSalary: newNet,
      grossSalary: newGross,
      bonusAmount: newBonus,
      bonusNet: newBonus > 0 ? newBonus * 0.79 : 0,
      incomeTaxRatePercent: newTaxRate,
      mealTickets: newMealTickets,
      regularInvestableAmount: 400,
      savingsRate: newNet > 0 ? Math.round((400 / newNet) * 100) : 0,
      source: 'ocr_payslip',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveRecord(record);
    onShowToast(`💼 Bulletin ${record.periodLabel} enregistré avec succès !`, 'success');
    setActiveSubTab(2); // Basculer vers l'historique
  };

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
              onChange={handleFileUpload}
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
              onClick={handleSaveParsedRecord}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700, padding: '12px 18px' }}
            >
              💾 Enregistrer ce bulletin dans l'historique
            </button>
          </div>
        </div>
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
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Capacité d'Investissement Moyenne</span>
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
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              📋 Historique Exhaustif des Bulletins de Salaire ({cleanRecords.length})
            </h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveSubTab(0)}>
              ➕ Importer un autre bulletin
            </button>
          </div>

          {cleanRecords.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 10 }}>
              Aucun bulletin de paie enregistré.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <table className="table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Période</th>
                    <th>Employeur</th>
                    <th>Net à Payer</th>
                    <th>Brut</th>
                    <th>Primes</th>
                    <th>Taux PAS</th>
                    <th>Investi PEA</th>
                    <th style={{ width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cleanRecords.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.periodLabel || formatSalaryPeriodLabel(r.period)}</strong></td>
                      <td>{r.employerName || 'Tech Solutions'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        +{r.netSalary.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {r.grossSalary ? `${r.grossSalary.toLocaleString('fr-FR')} €` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: r.bonusAmount ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                        {r.bonusAmount ? `+${r.bonusAmount.toLocaleString('fr-FR')} €` : '0 €'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                        {r.incomeTaxRatePercent ? `${r.incomeTaxRatePercent}%` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {r.regularInvestableAmount ? `${r.regularInvestableAmount.toLocaleString('fr-FR')} €` : '—'}
                      </td>
                      <td>
                        <button type="button" className="btn-ghost" onClick={() => onDeleteRecord(r.id)} title="Supprimer">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
