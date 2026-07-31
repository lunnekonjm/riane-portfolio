'use client';

import { ASSET_METADATA, getCleanAssetName } from '@/utils/assetMetadata';

interface AssetBadgeProps {
  ticker: string;
  name?: string;
  showTicker?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function AssetBadge({ ticker, name, showTicker = true, style, className }: AssetBadgeProps) {
  const meta = ASSET_METADATA[ticker];
  const displayName = getCleanAssetName(ticker, name);

  const tooltipTitle = meta
    ? `${meta.fullName}\n----------------------------------\n🏷️ Ticker : ${meta.ticker}\n📌 Code ISIN : ${meta.isin}\n🏛️ Enveloppe : ${meta.envelope} (${meta.currency})\n💡 ${meta.description}`
    : `📌 ${displayName} (${ticker})`;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'help',
        ...style,
      }}
      title={tooltipTitle}
    >
      <span style={{ fontWeight: 600 }}>{displayName}</span>
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
    </span>
  );
}
