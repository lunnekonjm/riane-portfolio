'use client';

import React from 'react';

const AVAILABLE_ICONS = ['🏠', '📱', '📈', '🛡️', '👥', '❤️', '💳', '🛒', '⚡', '🏥', '🚗', '✈️', '🎓', '🍕', '🎮', '🏋️', '💼', '🎁'];
const AVAILABLE_COLORS = ['#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#64748b'];

interface CategoryIconColorSelectorProps {
  icon: string;
  setIcon: (ico: string) => void;
  color: string;
  setColor: (col: string) => void;
}

export function CategoryIconColorSelector({
  icon,
  setIcon,
  color,
  setColor,
}: CategoryIconColorSelectorProps) {
  return (
    <>
      {/* Sélecteur d'Icône (18 icônes) */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
          ICÔNE VISUELLE
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 }}>
          {AVAILABLE_ICONS.map((ico) => {
            const isSelected = icon === ico;
            return (
              <button
                key={ico}
                type="button"
                onClick={() => setIcon(ico)}
                style={{
                  height: 36,
                  borderRadius: 8,
                  background: isSelected ? `${color}33` : 'rgba(10, 14, 23, 0.8)',
                  border: isSelected ? `2px solid ${color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 17,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ico}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sélecteur de Couleur (8 couleurs) */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
          COULEUR DU THÈME
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {AVAILABLE_COLORS.map((col) => {
            const isSelected = color === col;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setColor(col)}
                style={{
                  height: 28,
                  borderRadius: 8,
                  background: col,
                  border: isSelected ? '2px solid #ffffff' : 'none',
                  boxShadow: isSelected ? `0 0 10px ${col}` : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {isSelected ? '✓' : ''}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
