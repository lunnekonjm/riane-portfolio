'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ASSET_METADATA, getCleanAssetName } from '@/utils/assetMetadata';

interface AssetBadgeProps {
  ticker: string;
  name?: string;
  showTicker?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function AssetBadge({ ticker, name, showTicker = true, style, className }: AssetBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const spanRef = useRef<HTMLSpanElement>(null);

  const meta = ASSET_METADATA[ticker];
  const displayName = getCleanAssetName(ticker, name);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 185;

    // Check vertical space: if top space is < 320px (upper part of screen), position BELOW element
    const positionBelow = rect.top < 320;

    const calculatedTop = positionBelow ? rect.bottom + 8 : rect.top - tooltipHeight - 8;
    // Keep horizontally within window bounds
    const calculatedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - tooltipWidth - 16));

    setCoords({
      top: calculatedTop,
      left: calculatedLeft,
    });
    setIsHovered(true);
  };

  const tooltipContent = isHovered && meta && mounted ? (
    <div
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: 300,
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(6, 182, 212, 0.6)',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 24px rgba(6, 182, 212, 0.3)',
        zIndex: 9999999,
        pointerEvents: 'none',
        textAlign: 'left',
        animation: 'fadeInUp 0.15s ease-out',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.12)',
            padding: '2px 8px',
            borderRadius: 6,
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          {meta.ticker}
        </span>
        <span
          className={`envelope-tag ${meta.envelope.toLowerCase()}`}
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {meta.envelope} ({meta.currency})
        </span>
      </div>

      {/* Full Official Title */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4, lineHeight: 1.3 }}>
        {meta.fullName}
      </div>

      {/* ISIN Code */}
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        ISIN : <strong style={{ color: 'var(--text-secondary)' }}>{meta.isin}</strong>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', marginBottom: 8 }} />

      {/* Description */}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {meta.description}
      </div>
    </div>
  ) : null;

  return (
    <span
      ref={spanRef}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontWeight: 600, borderBottom: '1px dotted rgba(6, 182, 212, 0.5)' }}>
        {displayName}
      </span>

      {showTicker && (
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '1px 5px',
            borderRadius: 4,
          }}
        >
          {ticker}
        </span>
      )}

      {/* Portal into document.body to prevent ANY overflow/card clipping */}
      {mounted && typeof document !== 'undefined' && tooltipContent ? createPortal(tooltipContent, document.body) : null}
    </span>
  );
}
