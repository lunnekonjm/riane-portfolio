'use client';

import React from 'react';

interface ToastData {
  message: string;
  type: 'success' | 'error';
}

interface GlobalToastWithUndoProps {
  toast: ToastData | null;
  setToast: (t: ToastData | null) => void;
  canUndo: boolean;
  undoLastAction: () => Promise<boolean>;
}

export function GlobalToastWithUndo({
  toast,
  setToast,
  canUndo,
  undoLastAction,
}: GlobalToastWithUndoProps) {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.type}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</span>
      {canUndo && !toast.message.includes('Annulation') && (
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderColor: 'var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            background: 'rgba(6, 182, 212, 0.15)',
          }}
          onClick={async () => {
            const ok = await undoLastAction();
            if (ok) {
              setToast({ message: '↩️ Action annulée — État précédent du portefeuille rétabli !', type: 'success' });
            }
          }}
        >
          ↩️ Annuler l&apos;action
        </button>
      )}
    </div>
  );
}
