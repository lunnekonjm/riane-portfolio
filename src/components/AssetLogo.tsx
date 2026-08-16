'use client';

import { useState, useEffect } from 'react';
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
  const logoInfo = resolveAssetLogo(ticker, name, envelope, institutionName);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logoInfo.url]);

  const borderRadius = Math.round(size * 0.25);
  const fontSize = Math.max(10, Math.round(size * 0.42));

  const shouldRenderImage = Boolean(logoInfo.url && !imageError);

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
        background: shouldRenderImage ? '#ffffff' : logoInfo.fallbackColor,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={name || ticker || ''}
    >
      {shouldRenderImage ? (
        <img
          src={logoInfo.url}
          alt={name || ticker || 'Logo'}
          width={size}
          height={size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: 2,
          }}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          style={{
            fontSize,
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: logoInfo.fallbackEmoji ? 'inherit' : 'var(--font-mono)',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          {logoInfo.fallbackEmoji || logoInfo.fallbackLetters}
        </span>
      )}
    </div>
  );
}
