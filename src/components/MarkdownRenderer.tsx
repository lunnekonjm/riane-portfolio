'use client';

import React from 'react';
import { parseInline } from './markdown/markdownParser';
import { MarkdownTable } from './markdown/MarkdownTable';

interface MarkdownRendererProps {
  content: string;
  style?: React.CSSProperties;
}

export default function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Horizontal Divider
    if (line.trim() === '---') {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            margin: '24px 0',
            border: 'none',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          }}
        />
      );
      i++;
      continue;
    }

    // 2. Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #ffffff)',
            marginTop: 16,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {parseInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--accent-cyan, #06b6d4)',
            marginTop: 20,
            marginBottom: 10,
            borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
            paddingBottom: 6,
          }}
        >
          {parseInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary, #ffffff)',
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          {parseInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--accent-cyan, #06b6d4)',
            marginTop: 12,
            marginBottom: 6,
          }}
        >
          {parseInline(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('##### ')) {
      elements.push(
        <h5
          key={`h5-${i}`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary, #94a3b8)',
            marginTop: 10,
            marginBottom: 4,
          }}
        >
          {parseInline(line.slice(6))}
        </h5>
      );
      i++;
      continue;
    }

    // 3. Blockquote / Callout
    if (line.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${i}`}
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            borderLeft: '4px solid var(--accent-cyan, #06b6d4)',
            borderRadius: '0 8px 8px 0',
            padding: '10px 14px',
            margin: '12px 0',
            fontSize: 13,
            color: 'var(--text-secondary, #94a3b8)',
            lineHeight: 1.6,
          }}
        >
          {parseInline(line.slice(2))}
        </div>
      );
      i++;
      continue;
    }

    // 4. Markdown Table parsing
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        elements.push(<MarkdownTable key={`table-${i}`} tableLines={tableLines} />);
        continue;
      }
    }

    // 5. Bullet points
    if (line.trim().startsWith('- ')) {
      elements.push(
        <div
          key={`li-${i}`}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            margin: '4px 0',
            fontSize: 13,
            color: 'var(--text-secondary, #cbd5e1)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: 'var(--accent-cyan, #06b6d4)', fontWeight: 700 }}>•</span>
          <div>{parseInline(line.trim().slice(2))}</div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Normal Paragraph
    if (line.trim().length > 0) {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: '6px 0',
            fontSize: 13.5,
            color: 'var(--text-secondary, #cbd5e1)',
            lineHeight: 1.7,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {parseInline(line)}
        </p>
      );
    }

    i++;
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {elements}
    </div>
  );
}
