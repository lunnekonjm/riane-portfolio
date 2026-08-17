'use client';

import React from 'react';
import type { AppNotification } from '@/types/notification';

interface NotificationCardProps {
  notification: AppNotification;
  onClose: () => void;
  onOpenRebalance?: () => void;
  onOpenAnalysis?: (query?: string) => void;
  onNavigateView?: (view: 'dashboard' | 'envelopes' | 'analysis' | 'risk' | 'reports') => void;
}

export function NotificationCard({
  notification: n,
  onClose,
  onOpenRebalance,
  onOpenAnalysis,
  onNavigateView,
}: NotificationCardProps) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: n.priority === 'high' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-tertiary)',
        borderLeft:
          n.priority === 'high'
            ? '4px solid var(--accent-rose)'
            : n.category === 'dca'
            ? '4px solid var(--accent-cyan)'
            : '4px solid var(--accent-amber)',
        opacity: n.read ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
          {n.title}
        </div>
        <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {new Date(n.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        {n.message}
      </p>
      {n.actionHint && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 12px',
            borderRadius: 6,
            marginTop: 8,
            borderLeft: '3px solid var(--accent-cyan)',
            lineHeight: 1.4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <div>
            <strong>👉 Que faire :</strong> {n.actionHint}
          </div>
          {n.actionCtaLabel && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', whiteSpace: 'nowrap', fontWeight: 600 }}
              onClick={() => {
                onClose();
                if (n.actionType === 'open-envelopes') onNavigateView?.('envelopes');
                else if (n.actionType === 'open-analysis') onOpenAnalysis?.(`Analyse et recommandations pour : ${n.title}`);
                else onOpenRebalance?.();
              }}
            >
              {n.actionCtaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
