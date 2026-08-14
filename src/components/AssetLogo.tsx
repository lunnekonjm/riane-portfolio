'use client';

import React, { useState } from 'react';
import { resolveAssetLogo } from '@/utils/logoDirectory';

interface AssetLogoProps {
  ticker?: string;
  name?: string;
  envelope?: string;
  institutionName?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AssetLogo({
  ticker,
  name,
  envelope,
  institutionName,
  size = 32,
  className,
  style,
}: AssetLogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoInfo = resolveAssetLogo(ticker, name, envelope, institutionName);

  const borderRadius = Math.round(size * 0.25);
  const fontSize = Math.max(10, Math.round(size * 0.42));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: logoInfo.brandBg || logoInfo.fallbackColor || 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        border: logoInfo.borderColor ? `1px solid ${logoInfo.borderColor}` : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={name || ticker || ''}
    >
      {/* 1. Rendu SVG Officiel Vectoriel Authentique */}
      {logoInfo.svg ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoInfo.svg}
        </div>
      ) : logoInfo.url && !imageError ? (
        /* 2. Image Web externe HD */
        <img
          src={logoInfo.url}
          alt={name || ticker || 'Logo'}
          width={size}
          height={size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: 3,
          }}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        /* 3. Badge Initiales Stylisé FinTech */
        <span
          style={{
            fontSize,
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: logoInfo.fallbackEmoji ? 'inherit' : 'var(--font-sans)',
            letterSpacing: logoInfo.fallbackEmoji ? '0px' : '-0.5px',
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
          }}
        >
          {logoInfo.fallbackEmoji || logoInfo.fallbackLetters}
        </span>
      )}
    </div>
  );
}
