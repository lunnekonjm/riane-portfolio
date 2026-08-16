'use client';

import React from 'react';

interface PlatformBadgeProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

interface PlatformStyle {
  icon: string;
  label: string;
  bg: string;
  color: string;
  border: string;
}

export function getPlatformStyle(rawName: string): PlatformStyle {
  const norm = (rawName || '').trim().toLowerCase();

  if (norm.includes('revolut')) {
    return {
      icon: '⚡',
      label: rawName.includes('X') ? 'Revolut X' : 'Revolut',
      bg: 'rgba(59, 130, 246, 0.14)',
      color: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.35)',
    };
  }

  if (norm.includes('trust')) {
    return {
      icon: '🛡️',
      label: 'Trust Wallet',
      bg: 'rgba(14, 165, 233, 0.14)',
      color: '#38bdf8',
      border: 'rgba(14, 165, 233, 0.35)',
    };
  }

  if (norm.includes('ledger')) {
    return {
      icon: '🔒',
      label: 'Ledger',
      bg: 'rgba(148, 163, 184, 0.14)',
      color: '#e2e8f0',
      border: 'rgba(148, 163, 184, 0.35)',
    };
  }

  if (norm.includes('bourso')) {
    return {
      icon: '🧭',
      label: 'BoursoBank',
      bg: 'rgba(236, 72, 153, 0.14)',
      color: '#f472b6',
      border: 'rgba(236, 72, 153, 0.35)',
    };
  }

  if (norm.includes('trade republic') || norm === 'tr') {
    return {
      icon: '📱',
      label: 'Trade Republic',
      bg: 'rgba(241, 245, 249, 0.12)',
      color: '#f8fafc',
      border: 'rgba(241, 245, 249, 0.3)',
    };
  }

  if (norm.includes('interactive') || norm.includes('ibkr')) {
    return {
      icon: '📊',
      label: 'IBKR',
      bg: 'rgba(239, 68, 68, 0.14)',
      color: '#f87171',
      border: 'rgba(239, 68, 68, 0.35)',
    };
  }

  if (norm.includes('fortuneo')) {
    return {
      icon: '🍀',
      label: 'Fortuneo',
      bg: 'rgba(132, 204, 22, 0.14)',
      color: '#a3e635',
      border: 'rgba(132, 204, 22, 0.35)',
    };
  }

  if (norm.includes('degiro')) {
    return {
      icon: '🌐',
      label: 'DEGIRO',
      bg: 'rgba(20, 184, 166, 0.14)',
      color: '#2dd4bf',
      border: 'rgba(20, 184, 166, 0.35)',
    };
  }

  if (norm.includes('binance')) {
    return {
      icon: '🟡',
      label: 'Binance',
      bg: 'rgba(234, 179, 8, 0.14)',
      color: '#fde047',
      border: 'rgba(234, 179, 8, 0.35)',
    };
  }

  if (norm.includes('kraken')) {
    return {
      icon: '🐙',
      label: 'Kraken',
      bg: 'rgba(139, 92, 246, 0.14)',
      color: '#c4b5fd',
      border: 'rgba(139, 92, 246, 0.35)',
    };
  }

  if (norm.includes('coinbase')) {
    return {
      icon: '🔵',
      label: 'Coinbase',
      bg: 'rgba(37, 99, 235, 0.14)',
      color: '#93c5fd',
      border: 'rgba(37, 99, 235, 0.35)',
    };
  }

  if (norm.includes('phantom')) {
    return {
      icon: '🟣',
      label: 'Phantom',
      bg: 'rgba(168, 85, 247, 0.14)',
      color: '#d8b4fe',
      border: 'rgba(168, 85, 247, 0.35)',
    };
  }

  if (norm.includes('metamask')) {
    return {
      icon: '🦊',
      label: 'MetaMask',
      bg: 'rgba(249, 115, 22, 0.14)',
      color: '#fb923c',
      border: 'rgba(249, 115, 22, 0.35)',
    };
  }

  if (norm.includes('natixis')) {
    return {
      icon: '🏢',
      label: 'Natixis',
      bg: 'rgba(99, 102, 241, 0.14)',
      color: '#a5b4fc',
      border: 'rgba(99, 102, 241, 0.35)',
    };
  }

  if (norm.includes('linxea') || norm.includes('spirica') || norm.includes('suravenir')) {
    return {
      icon: '📜',
      label: rawName,
      bg: 'rgba(244, 63, 94, 0.14)',
      color: '#fda4af',
      border: 'rgba(244, 63, 94, 0.35)',
    };
  }

  if (norm.includes('amundi')) {
    return {
      icon: '🏛️',
      label: 'Amundi',
      bg: 'rgba(6, 182, 212, 0.14)',
      color: '#67e8f9',
      border: 'rgba(6, 182, 212, 0.35)',
    };
  }

  return {
    icon: '🏦',
    label: rawName,
    bg: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-secondary)',
    border: 'var(--border-subtle)',
  };
}

export default function PlatformBadge({ name, className, style }: PlatformBadgeProps) {
  if (!name || !name.trim()) return null;

  const pStyle = getPlatformStyle(name);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        padding: '1.5px 6px',
        borderRadius: 4,
        background: pStyle.bg,
        color: pStyle.color,
        border: `1px solid ${pStyle.border}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        lineHeight: 1.2,
        ...style,
      }}
      title={`Détenu chez : ${pStyle.label}`}
    >
      <span>{pStyle.icon}</span>
      <span>{pStyle.label}</span>
    </span>
  );
}
