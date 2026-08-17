'use client';

import { useEffect } from 'react';

interface UseGlobalKeyboardShortcutsParams {
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  undoLastAction: () => Promise<boolean>;
  redoLastAction: () => Promise<boolean>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

export function useGlobalKeyboardShortcuts({
  canUndo,
  canRedo,
  saving,
  undoLastAction,
  redoLastAction,
  setToast,
}: UseGlobalKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (canRedo && !saving) {
          e.preventDefault();
          redoLastAction().then((success) => {
            if (success) {
              setToast({ message: '↪️ Rétablissement (Ctrl+Y) effectué avec succès !', type: 'success' });
              setTimeout(() => setToast(null), 5000);
            }
          });
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && canUndo && !saving) {
        e.preventDefault();
        undoLastAction().then((success) => {
          if (success) {
            setToast({ message: '↩️ Annulation (Ctrl+Z) — État précédent rétabli !', type: 'success' });
            setTimeout(() => setToast(null), 5000);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, saving, undoLastAction, redoLastAction, setToast]);
}
