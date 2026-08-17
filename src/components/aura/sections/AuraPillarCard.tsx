'use client';

import React from 'react';
import type { RuleCategoryItem } from '../AuraRulesView';

interface AuraPillarCardProps {
  title: string;
  pillar: 'SAVINGS' | 'FIXED' | 'DAILY';
  totalAmount: number;
  netSalary: number;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  accentBorderColor: string;
  accentTextColor: string;
  defaultEmoji: string;
  defaultIconColor: string;
  categories: RuleCategoryItem[];
  setCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  getEffectiveAmount: (item?: RuleCategoryItem | null) => number;
  getEffectivePercent: (item?: RuleCategoryItem | null) => number;
  renderCategoryIcon: (iconType: string | undefined, defaultEmoji?: string) => string;
  openCategoryEditor: (cat: RuleCategoryItem | null, pillar: 'SAVINGS' | 'FIXED' | 'DAILY') => void;
  onShowToast?: (msg: string, type: 'success' | 'error') => void;
  addLabel: string;
  extraHeaderBanner?: React.ReactNode;
}

export function AuraPillarCard({
  title,
  pillar,
  totalAmount,
  netSalary,
  badgeBg,
  badgeBorder,
  badgeColor,
  accentBorderColor,
  accentTextColor,
  defaultEmoji,
  defaultIconColor,
  categories,
  setCategories,
  getEffectiveAmount,
  getEffectivePercent,
  renderCategoryIcon,
  openCategoryEditor,
  onShowToast,
  addLabel,
  extraHeaderBanner,
}: AuraPillarCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
          {title}
        </strong>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            color: badgeColor,
            fontSize: 11.5,
            fontWeight: 800,
          }}
        >
          Total : {totalAmount.toFixed(2)} € • {netSalary > 0 ? ((totalAmount / netSalary) * 100).toFixed(1) : 0}%
        </span>
      </div>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: 12,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {extraHeaderBanner}

        {categories.map((item) => {
          const effAmt = getEffectiveAmount(item);
          const effPct = getEffectivePercent(item);

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(10, 14, 23, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${item.iconBgColor || defaultIconColor}22`,
                    color: item.iconBgColor || defaultIconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {renderCategoryIcon(item.iconType, defaultEmoji)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 13, color: '#ffffff' }}>{item.name}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setCategories((prev) =>
                          prev.map((c) => {
                            if (c.id === item.id) {
                              return {
                                ...c,
                                isPercentage: !c.isPercentage,
                                amount: !c.isPercentage ? effPct : effAmt,
                              };
                            }
                            return c;
                          })
                        );
                      }}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: `1px solid ${accentBorderColor}`,
                        color: accentTextColor,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {item.isPercentage ? '% Ratio ⇄' : '€ Fixe ⇄'}
                    </button>
                  </div>
                  {item.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</div>}
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                {item.isPercentage ? `= ${effAmt.toFixed(2)} €` : `= ${effPct.toFixed(1)} %`}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => openCategoryEditor(item, pillar)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: `1px solid ${accentBorderColor}`,
                    color: accentTextColor,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {item.isPercentage ? `${item.amount.toFixed(1)} % ✏️` : `${item.amount.toFixed(0)} € ✏️`}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategories((prev) => prev.filter((c) => c.id !== item.id));
                    onShowToast?.(`Catégorie "${item.name}" supprimée.`, 'error');
                  }}
                  style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => openCategoryEditor(null, pillar)}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: `1px dashed ${accentBorderColor}`,
            background: 'transparent',
            color: accentTextColor,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
