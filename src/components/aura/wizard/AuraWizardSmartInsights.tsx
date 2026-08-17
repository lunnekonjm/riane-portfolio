'use client';

import React, { useState } from 'react';
import type { SmartFlowInsight } from '@/engines/bankingAnalyzerEngine';

interface AuraWizardSmartInsightsProps {
  insights: SmartFlowInsight[];
  onApplyEphemeral: (
    insight: SmartFlowInsight,
    customDurationMonths?: number,
    customStartPeriod?: string
  ) => void;
  onApplyTariffChange: (insight: SmartFlowInsight) => void;
  onApplyFixed: (insight: SmartFlowInsight) => void;
  onDismiss: (insightId: string) => void;
  fmtEur: (val: number) => string;
}

export const AuraWizardSmartInsights: React.FC<AuraWizardSmartInsightsProps> = ({
  insights,
  onApplyEphemeral,
  onApplyTariffChange,
  onApplyFixed,
  onDismiss,
  fmtEur,
}) => {
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});
  const [selectedStartPeriods, setSelectedStartPeriods] = useState<Record<string, string>>({});
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  if (!insights || insights.length === 0) {
    return null;
  }

  const handleApplyEphemeralClick = (ins: SmartFlowInsight) => {
    const dur = selectedDurations[ins.id] !== undefined ? selectedDurations[ins.id] : (ins.suggestedDurationMonths || 12);
    const startP = selectedStartPeriods[ins.id] || ins.startPeriod || new Date().toISOString().slice(0, 7);
    onApplyEphemeral(ins, dur, startP);
    setAppliedIds((prev) => new Set(prev).add(ins.id));
  };

  const handleApplyTariffClick = (ins: SmartFlowInsight) => {
    onApplyTariffChange(ins);
    setAppliedIds((prev) => new Set(prev).add(ins.id));
  };

  const handleApplyFixedClick = (ins: SmartFlowInsight) => {
    onApplyFixed(ins);
    setAppliedIds((prev) => new Set(prev).add(ins.id));
  };

  const quickDurationPills = [3, 4, 6, 10, 12, 24];

  const formatPeriodLabel = (periodStr: string) => {
    if (!periodStr || !periodStr.includes('-')) return periodStr;
    const [year, month] = periodStr.split('-');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${monthNames[mIdx]} ${year}`;
    }
    return periodStr;
  };

  return (
    <div
      style={{
        margin: '10px 22px 0 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Intelligence IA : Patterns Multi-Mois & Échéanciers ({insights.length})
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          Horizon 90 jours (3 mois)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins) => {
          const isApplied = appliedIds.has(ins.id);
          const currentDuration =
            selectedDurations[ins.id] !== undefined
              ? selectedDurations[ins.id]
              : (ins.suggestedDurationMonths || 12);
          const currentStartPeriod =
            selectedStartPeriods[ins.id] ||
            ins.startPeriod ||
            new Date().toISOString().slice(0, 7);

          return (
            <div
              key={ins.id}
              style={{
                position: 'relative',
                padding: '14px 16px',
                borderRadius: 14,
                background:
                  ins.type === 'EPHEMERAL_RECURRING'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                border: `1px solid ${
                  isApplied
                    ? 'rgba(16, 185, 129, 0.6)'
                    : ins.type === 'EPHEMERAL_RECURRING'
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'rgba(245, 158, 11, 0.35)'
                }`,
                boxShadow: isApplied
                  ? '0 0 16px rgba(16, 185, 129, 0.2)'
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'all 0.2s ease',
              }}
            >
              {/* HEADER ROW */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 20,
                      background:
                        ins.type === 'EPHEMERAL_RECURRING'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(245, 158, 11, 0.25)',
                      border: `1px solid ${
                        ins.type === 'EPHEMERAL_RECURRING'
                          ? 'rgba(16, 185, 129, 0.5)'
                          : 'rgba(245, 158, 11, 0.5)'
                      }`,
                      color: ins.type === 'EPHEMERAL_RECURRING' ? '#6ee7b7' : '#fcd34d',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {ins.badgeLabel}
                  </span>

                  <strong style={{ fontSize: 13.5, color: '#f8fafc' }}>
                    {ins.title}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isApplied && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#6ee7b7',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Appliqué au radar
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(ins.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: 14,
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                    title="Masquer cette suggestion"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* SUMMARY & RATIONALE */}
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 4px 0' }}>{ins.summaryText}</p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 11.5, fontStyle: 'italic' }}>
                  💡 {ins.rationale}
                </p>
              </div>

              {/* 🛠️ EDITABLE DURATION & START PERIOD FOR EPHEMERAL EXPENSES */}
              {ins.type === 'EPHEMERAL_RECURRING' && !isApplied && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* ROW 1: DURATION SELECTION (PRESETS + CUSTOM INPUT) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, minWidth: 130 }}>
                      Durée de l&apos;échéancier :
                    </span>

                    {/* Quick Preset Pills */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {quickDurationPills.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() =>
                            setSelectedDurations((prev) => ({ ...prev, [ins.id]: dur }))
                          }
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background:
                              currentDuration === dur
                                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                : 'rgba(255, 255, 255, 0.06)',
                            border:
                              currentDuration === dur
                                ? '1px solid #34d399'
                                : '1px solid rgba(255, 255, 255, 0.12)',
                            color: currentDuration === dur ? '#ffffff' : '#94a3b8',
                            fontSize: 11,
                            fontWeight: currentDuration === dur ? 800 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {dur}m
                        </button>
                      ))}
                    </div>

                    {/* Stepper +/- & Custom Number Input */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginLeft: 'auto',
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '2px 6px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDurations((prev) => ({
                            ...prev,
                            [ins.id]: Math.max(1, currentDuration - 1),
                          }))
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: '0 4px',
                        }}
                        title="Diminuer d'un mois"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={currentDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSelectedDurations((prev) => ({
                            ...prev,
                            [ins.id]: isNaN(val) ? 1 : Math.max(1, Math.min(120, val)),
                          }));
                        }}
                        style={{
                          width: 42,
                          padding: '2px 4px',
                          textAlign: 'center',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>mois</span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDurations((prev) => ({
                            ...prev,
                            [ins.id]: Math.min(120, currentDuration + 1),
                          }))
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: '0 4px',
                        }}
                        title="Augmenter d'un mois"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* ROW 2: EDITABLE START MONTH SELECTOR */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      paddingTop: 4,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, minWidth: 130 }}>
                      Mois de premier début :
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="month"
                        value={currentStartPeriod}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedStartPeriods((prev) => ({
                              ...prev,
                              [ins.id]: e.target.value,
                            }));
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          color: '#6ee7b7',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          colorScheme: 'dark',
                        }}
                      />
                      <span style={{ fontSize: 11.5, color: '#f8fafc', fontWeight: 600 }}>
                        ({formatPeriodLabel(currentStartPeriod)})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              {!isApplied && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 2,
                  }}
                >
                  {ins.type === 'EPHEMERAL_RECURRING' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyEphemeralClick(ins)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          border: '1px solid rgba(52, 211, 153, 0.6)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        📌 Ajouter aux Dépenses Temporaires ({currentDuration} mois dès {currentStartPeriod})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyFixedClick(ins)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#e2e8f0',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🏠 Transformer en Charge Fixe
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyTariffClick(ins)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                        border: '1px solid rgba(251, 191, 36, 0.6)',
                        color: '#ffffff',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {ins.primaryActionLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
