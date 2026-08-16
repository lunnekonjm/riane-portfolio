'use client';

import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning',
  icon,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const defaultIcon = variant === 'danger' ? '⚠️' : variant === 'warning' ? '❓' : 'ℹ️';

  const confirmBtnStyle: React.CSSProperties =
    variant === 'danger'
      ? {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          fontWeight: 700,
          border: '1px solid #ef4444',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
        }
      : variant === 'warning'
      ? {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          fontWeight: 700,
          border: '1px solid #f59e0b',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
        }
      : {
          background: 'linear-gradient(135deg, var(--accent-cyan), #0891b2)',
          color: '#ffffff',
          fontWeight: 700,
          border: '1px solid var(--accent-cyan)',
        };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 440,
          width: '100%',
          background: '#0f172a',
          border: `1px solid ${variant === 'danger' ? 'rgba(239, 68, 68, 0.4)' : variant === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: variant === 'danger' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <span style={{ fontSize: 22 }}>{icon || defaultIcon}</span>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
            {title}
          </h4>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            style={{ fontSize: 18, padding: '2px 8px', color: 'var(--text-secondary)' }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {message}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            style={{ ...confirmBtnStyle, fontSize: 13, padding: '8px 18px' }}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
