'use client';

import React, { useState } from 'react';
import type { RuleCategoryItem } from '@/types/auraRules';
import { CategoryPillarSelector } from './CategoryPillarSelector';
import { CategoryIconColorSelector } from './CategoryIconColorSelector';
import { CategoryAmountConfigurator } from './CategoryAmountConfigurator';

interface CategoryEditModalProps {
  editingCategory: RuleCategoryItem | null;
  editingCategoryPillar: 'SAVINGS' | 'FIXED' | 'DAILY';
  netSalary: number;
  onSave: (cat: RuleCategoryItem, previousPillar: 'SAVINGS' | 'FIXED' | 'DAILY') => void;
  onDelete: (id: string, pillar: 'SAVINGS' | 'FIXED' | 'DAILY', name: string) => void;
  onClose: () => void;
}

export function CategoryEditModal({
  editingCategory,
  editingCategoryPillar,
  netSalary,
  onSave,
  onDelete,
  onClose,
}: CategoryEditModalProps) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [note, setNote] = useState(editingCategory?.note || '');
  const [amount, setAmount] = useState(editingCategory?.amount || 0);
  const [isPercentage, setIsPercentage] = useState(editingCategory?.isPercentage || false);
  const [pillar, setPillar] = useState<'SAVINGS' | 'FIXED' | 'DAILY'>(editingCategoryPillar);
  const [icon, setIcon] = useState(editingCategory?.iconType || '🏠');
  const [color, setColor] = useState(editingCategory?.iconBgColor || '#06b6d4');

  const handleSave = () => {
    const finalName = name.trim() || 'Sans titre';
    const updated: RuleCategoryItem = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: finalName,
      note: note.trim() || undefined,
      amount,
      isPercentage,
      isLocked: editingCategory?.isLocked || false,
      categoryType: pillar,
      iconType: icon,
      iconBgColor: color,
    };
    onSave(updated, editingCategoryPillar);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 22,
          background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 100%)',
          border: `1px solid ${color}66`,
          boxShadow: `0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px ${color}22`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${color}25`,
                color: color,
                border: `1px solid ${color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                {editingCategory?.name ? `Éditer "${editingCategory.name}"` : 'Nouvelle Catégorie'}
              </h3>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Personnalisez le pilier, le mode de calcul, l&apos;icône et la couleur
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 8,
              width: 30,
              height: 30,
              color: '#cbd5e1',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* 1. Sélecteur de Pilier */}
        <CategoryPillarSelector pillar={pillar} setPillar={setPillar} />

        {/* 2. Nom & Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Loyer CDC Habitat, Abonnement Bouygues..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
              Note / Sous-postes (optionnel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: Spotify + Netflix + Freebox..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* 3. Mode de Calcul & Montant */}
        <CategoryAmountConfigurator
          amount={amount}
          setAmount={setAmount}
          isPercentage={isPercentage}
          setIsPercentage={setIsPercentage}
          netSalary={netSalary}
        />

        {/* 4 & 5. Icônes et Couleurs */}
        <CategoryIconColorSelector
          icon={icon}
          setIcon={setIcon}
          color={color}
          setColor={setColor}
        />

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {editingCategory && (
            <button
              type="button"
              onClick={() => onDelete(editingCategory.id, editingCategoryPillar, editingCategory.name || 'Nouvelle')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: 'var(--accent-rose)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🗑️ Supprimer
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#0a0e17',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
