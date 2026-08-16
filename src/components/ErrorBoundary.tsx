'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleResetCache = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aura_rules_savings');
        localStorage.removeItem('aura_rules_fixed');
        localStorage.removeItem('aura_rules_daily');
        localStorage.removeItem('aura_temporary_expenses');
        localStorage.removeItem('aura_rules_audit_logs');
      }
    } catch {}
    this.handleReload();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            margin: '24px 0',
            padding: '24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            color: '#f8fafc',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fda4af', margin: '0 0 8px 0' }}>
            {this.props.fallbackTitle || 'Un problème est survenu lors du chargement de cette section'}
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0', maxWidth: '500px', marginInline: 'auto' }}>
            {this.props.fallbackSubtitle || 'Une incohérence dans les données du cache ou un paramètre inattendu a provoqué une anomalie.'}
          </p>

          {this.state.error && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#f43f5e',
                margin: '0 auto 20px auto',
                maxWidth: '600px',
                overflowX: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#041d24',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🔄 Réessayer
            </button>
            <button
              type="button"
              onClick={this.handleResetCache}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: 'var(--accent-rose)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🧹 Réinitialiser le cache des règles
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
