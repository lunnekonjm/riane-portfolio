'use client';

import React, { useState } from 'react';
import type { SalaryRecord, SalaryAnalytics } from '@/types/salary';
import { formatPeriodLabel } from '@/engines/salaryEngine';

interface SalaryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecords: SalaryRecord[];
  analytics: SalaryAnalytics;
  activeBaseline: SalaryRecord | null;
  onUpsertRecord: (record: Omit<SalaryRecord, 'id' | 'updatedAt' | 'periodLabel' | 'savingsRate'> & { id?: string }) => void;
  onDeleteRecord: (id: string) => void;
  onResetDefault: () => void;
}

export default function SalaryHistoryModal({
  isOpen,
  onClose,
  salaryRecords,
  analytics,
  activeBaseline,
  onUpsertRecord,
  onDeleteRecord,
  onResetDefault,
}: SalaryHistoryModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [netSalary, setNetSalary] = useState<string>('3850');
  const [grossSalary, setGrossSalary] = useState<string>('4950');
  const [investableAmount, setInvestableAmount] = useState<string>('1200');
  const [documentName, setDocumentName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');

  if (!isOpen) return null;

  const handleEditInit = (record: SalaryRecord) => {
    setEditingId(record.id);
    setPeriod(record.period);
    setNetSalary(record.netSalary.toString());
    setGrossSalary(record.grossSalary ? record.grossSalary.toString() : '');
    setInvestableAmount(record.investableAmount.toString());
    setDocumentName(record.documentName || '');
    setNotes(record.notes || '');
    setShowAddForm(true);
  };

  const handleNewInit = () => {
    setEditingId(null);
    // Suggerer le mois suivant le plus récent
    if (activeBaseline) {
      const [y, m] = activeBaseline.period.split('-').map(Number);
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      const formatted = `${nextY}-${nextM.toString().padStart(2, '0')}`;
      setPeriod(formatted);
    } else {
      setPeriod(new Date().toISOString().slice(0, 7));
    }
    setNetSalary('3900');
    setGrossSalary('5000');
    setInvestableAmount('1200');
    setDocumentName('');
    setNotes('');
    setShowAddForm(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const net = parseFloat(netSalary) || 0;
    const inv = parseFloat(investableAmount) || 0;
    const gross = grossSalary ? parseFloat(grossSalary) : undefined;

    if (net <= 0) {
      alert('Veuillez saisir un salaire net valide supérieur à 0 €.');
      return;
    }

    onUpsertRecord({
      id: editingId || undefined,
      period,
      netSalary: net,
      grossSalary: gross,
      investableAmount: inv,
      status: 'imported',
      documentName: documentName.trim() || `bulletin_${period.replace('-', '_')}.pdf`,
      notes: notes.trim(),
    });

    setShowAddForm(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-secondary, #111827)', border: '1px solid var(--border-color, #1f2937)',
        borderRadius: '16px', width: '100%', maxWidth: '940px', maxHeight: '90vh', display: 'flex',
        flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-color, #1f2937)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary, #1f2937)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📄</span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #f9fafb)' }}>
                Audit des Bulletins de Salaire & Répartition Budgétaire
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 34px', fontSize: '13px', color: 'var(--text-secondary, #9ca3af)' }}>
              Historique complet depuis 2025 · Lissage multi-annuel · Matrice de répartition DCA
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted, #6b7280)', fontSize: '24px',
            cursor: 'pointer', padding: '4px 8px', borderRadius: '6px'
          }}>✕</button>
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* BANNER : BULLETIN RÉFÉRENT D'ALLOCATION ACTIF */}
          {activeBaseline ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: '#10b981', color: '#000', fontWeight: 700, fontSize: '11px',
                    padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    🔒 BULLETIN RÉFÉRENT ACTIF
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>
                    Période : <strong style={{ color: '#fff' }}>{activeBaseline.periodLabel}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary, #f9fafb)' }}>
                  Base de Répartition DCA : <strong style={{ color: '#10b981', fontSize: '16px' }}>{activeBaseline.investableAmount.toLocaleString('fr-FR')} €/mois</strong>
                  {' '}<span style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '12px' }}>({activeBaseline.savingsRate}% du net de {activeBaseline.netSalary.toLocaleString('fr-FR')} €)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  💡 <em>Règle métier : Votre allocation DCA s'appuie exclusivement sur ce dernier bulletin en date. L'import de bulletins passés met à jour la moyenne sans dérégler cette répartition.</em>
                </div>
              </div>
              <button onClick={handleNewInit} style={{
                background: 'var(--accent-primary, #3b82f6)', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                ➕ Importer un nouveau bulletin
              </button>
            </div>
          ) : null}

          {/* KPI CARDS : ANALYSES & LISSAGE SALARIAL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            <div style={{ background: 'var(--bg-tertiary, #1f2937)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #374151)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', fontWeight: 500 }}>
                📊 Salaire Net Moyen (Lissé)
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #f3f4f6)', marginTop: '4px' }}>
                {analytics.overallAverageNet.toLocaleString('fr-FR')} €
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}>/mois</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)', marginTop: '2px' }}>
                Moyenne sur {analytics.totalRecordsCount} bulletin{analytics.totalRecordsCount > 1 ? 's' : ''} (2025-2026)
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary, #1f2937)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #374151)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', fontWeight: 500 }}>
                💰 Budget Épargne Moyen
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                {analytics.overallAverageInvestable.toLocaleString('fr-FR')} €
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}>/mois</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)', marginTop: '2px' }}>
                Taux d'épargne moyen : <strong>{analytics.overallSavingsRate.toFixed(1)}%</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary, #1f2937)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #374151)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', fontWeight: 500 }}>
                🚀 Évolution Salariale
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: analytics.growthTrendPercent >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                {analytics.growthTrendPercent >= 0 ? '+' : ''}{analytics.growthTrendPercent.toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)', marginTop: '2px' }}>
                Progression du net depuis 2025
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary, #1f2937)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #374151)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', fontWeight: 500 }}>
                📂 Bulletins Traités
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                {analytics.totalRecordsCount}
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}> importé{analytics.totalRecordsCount > 1 ? 's' : ''}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                ✓ Tous les fichiers validés
              </div>
            </div>

          </div>

          {/* TABS CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #374151)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  background: activeTab === 'history' ? 'var(--bg-tertiary, #374151)' : 'transparent',
                  color: activeTab === 'history' ? '#fff' : 'var(--text-muted, #9ca3af)',
                  border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                }}
              >
                📋 Historique des Bulletins ({salaryRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                style={{
                  background: activeTab === 'analytics' ? 'var(--bg-tertiary, #374151)' : 'transparent',
                  color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted, #9ca3af)',
                  border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                }}
              >
                📊 Synthèse Multi-Annuelle (2025 - 2026)
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onResetDefault} style={{
                background: 'none', border: '1px solid var(--border-color, #374151)', color: 'var(--text-muted, #9ca3af)',
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
              }}>
                🔄 Réinitialiser démo 2025-2026
              </button>
            </div>
          </div>

          {/* FORMULARIE D'AJOUT / ÉDITION (SI OUVERT) */}
          {showAddForm && (
            <form onSubmit={handleSubmitForm} style={{
              background: 'var(--bg-tertiary, #1f2937)', border: '1px solid var(--accent-primary, #3b82f6)',
              borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                  {editingId ? '✏️ Modifier le bulletin de salaire' : '📥 Ajouter un nouveau bulletin de salaire'}
                </h4>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Période (Mois / Année)</label>
                  <input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Salaire Net à Payer (€)</label>
                  <input
                    type="number"
                    value={netSalary}
                    onChange={(e) => setNetSalary(e.target.value)}
                    placeholder="3850"
                    required
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Budget DCA / Épargne (€)</label>
                  <input
                    type="number"
                    value={investableAmount}
                    onChange={(e) => setInvestableAmount(e.target.value)}
                    placeholder="1200"
                    required
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Salaire Brut (Optionnel €)</label>
                  <input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                    placeholder="4950"
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Nom du Fichier PDF / Document</label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="bulletin_paye_2026_06.pdf"
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Notes & Remarques</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex: Augmentation, prime exceptionnelle, etc."
                    style={{
                      width: '100%', background: 'var(--bg-secondary, #111827)', border: '1px solid #374151',
                      color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  💡 Taux d'épargne calculé : <strong style={{ color: '#10b981' }}>{parseFloat(netSalary) > 0 ? ((parseFloat(investableAmount) / parseFloat(netSalary)) * 100).toFixed(1) : 0}%</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{
                    background: 'none', border: '1px solid #374151', color: '#9ca3af',
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                  }}>Annuler</button>
                  <button type="submit" style={{
                    background: '#10b981', color: '#000', border: 'none',
                    padding: '6px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                  }}>
                    {editingId ? 'Mettre à jour le bulletin' : 'Enregistrer le bulletin'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 1 : TABLEAU HISTORIQUE DES BULLETINS */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color, #374151)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary, #1f2937)', color: 'var(--text-secondary, #9ca3af)', borderBottom: '1px solid #374151' }}>
                      <th style={{ padding: '12px 16px' }}>Période</th>
                      <th style={{ padding: '12px 16px' }}>Salaire Net</th>
                      <th style={{ padding: '12px 16px' }}>Budget DCA (€)</th>
                      <th style={{ padding: '12px 16px' }}>% Épargne</th>
                      <th style={{ padding: '12px 16px' }}>Statut d'Import</th>
                      <th style={{ padding: '12px 16px' }}>Document / Source</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map((r, idx) => {
                      const isRef = activeBaseline?.id === r.id;
                      return (
                        <tr key={r.id} style={{
                          borderBottom: '1px solid var(--border-color, #1f2937)',
                          background: isRef ? 'rgba(16, 185, 129, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                            {r.periodLabel}
                            {isRef && (
                              <span style={{
                                marginLeft: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981',
                                border: '1px solid #10b981', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700
                              }}>
                                RÉFÉRENT
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f3f4f6' }}>
                            {r.netSalary.toLocaleString('fr-FR')} €
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#3b82f6' }}>
                            {r.investableAmount.toLocaleString('fr-FR')} €
                          </td>
                          <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 500 }}>
                            {r.savingsRate}%
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {isRef ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                              }}>
                                ✓ Importé & Actif
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa',
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                              }}>
                                ✓ Importé (Historique)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>
                            📎 {r.documentName || 'bulletin.pdf'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEditInit(r)} style={{
                                background: 'none', border: '1px solid #374151', color: '#9ca3af',
                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                              }}>✏️</button>
                              <button onClick={() => onDeleteRecord(r.id)} style={{
                                background: 'none', border: '1px solid #374151', color: '#ef4444',
                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                              }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2 : SYNTHÈSE PAR ANNÉE */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                📌 Le tableau ci-dessous présente la moyenne lissée de vos revenus et de vos allocations d'investissement regroupés par année civile.
              </div>

              {analytics.yearlySummaries.map((yr) => (
                <div key={yr.year} style={{
                  background: 'var(--bg-tertiary, #1f2937)', border: '1px solid var(--border-color, #374151)',
                  borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📅 Année {yr.year}
                      <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af', background: '#111827', padding: '2px 8px', borderRadius: '10px' }}>
                        {yr.count} bulletin{yr.count > 1 ? 's' : ''} comptabilisé{yr.count > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                      Taux d'Épargne Moyen {yr.year} : {yr.averageSavingsRate.toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-secondary, #111827)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Moyenne Net Mensuel</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                        {yr.averageNet.toLocaleString('fr-FR')} €/mois
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #111827)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Moyenne Épargne Mensuelle</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>
                        {yr.averageInvestable.toLocaleString('fr-FR')} €/mois
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #111827)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Cumul Net Annuel Enregistré</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6', marginTop: '2px' }}>
                        {yr.totalNet.toLocaleString('fr-FR')} €
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #111827)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Cumul Épargne Annuelle Enregistrée</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        {yr.totalInvestable.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-color, #1f2937)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary, #1f2937)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)' }}>
            🔒 Données sauvegardées en local et synchronisées avec votre profil d'investisseur.
          </span>
          <button onClick={onClose} style={{
            background: 'var(--accent-primary, #3b82f6)', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
          }}>
            Fermer l'audit
          </button>
        </div>

      </div>
    </div>
  );
}
