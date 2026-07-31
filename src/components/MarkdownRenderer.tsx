'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  style?: React.CSSProperties;
}

export function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to split bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} style={{ height: 4 }} />;
        }

        // H1 Heading (# Heading)
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={idx}
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                margin: '12px 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {parseInlineFormatting(trimmed.slice(2))}
            </h2>
          );
        }

        // H2 / H3 Heading (### Heading or ## Heading)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h3
              key={idx}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--accent-amber)',
                margin: '14px 0 4px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                paddingBottom: 4,
              }}
            >
              {parseInlineFormatting(headingText)}
            </h3>
          );
        }

        // Horizontal Divider (---)
        if (trimmed === '---' || trimmed === '***') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                borderTop: '1px solid var(--border-subtle)',
                margin: '10px 0',
              }}
            />
          );
        }

        // Bullet point list (- text or * text)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                paddingLeft: 8,
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>•</span>
              <div style={{ flex: 1 }}>{parseInlineFormatting(trimmed.slice(2))}</div>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p
            key={idx}
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {parseInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}
