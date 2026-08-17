'use client';

import React from 'react';

const SUGGESTED_PROMPTS = [
  'Analyse mon portefeuille et les répartitions par cible pourcentage',
  'Analyse Coherent (COHR) et son exposition IA',
  'Faut-il rééquilibrer Riber ou accumuler sur baisse ?',
  'Compare Constellation Energy à mon allocation ACWI',
];

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        margin: 'auto',
        maxWidth: 480,
        padding: 30,
        background: 'var(--bg-tertiary)',
        borderRadius: 16,
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
      <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Analyste Financier IA RIANE</h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Posez une question sur n&apos;importe quelle valeur de votre portefeuille. L&apos;analyse s&apos;exécute en arrière-plan même si vous naviguez dans l&apos;application.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12, padding: '8px 12px' }}
            onClick={() => onSelectPrompt(prompt)}
          >
            💡 {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
