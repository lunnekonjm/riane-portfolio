'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  style?: React.CSSProperties;
}

export default function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  if (!content) return null;

  // Clean hidden HTML comment blocks (e.g., RIANE_ACTIONS_JSON)
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '').trim();

  const lines = cleanContent.split('\n');
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
        const headerCells = parseTableRow(tableLines[0]);
        // line 1 is separator |:---|:---:|
        const dataRows = tableLines.slice(2).map(parseTableRow);

        elements.push(
          <div
            key={`table-${i}`}
            style={{
              overflowX: 'auto',
              margin: '16px 0',
              borderRadius: 10,
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              background: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {headerCells.map((cell, idx) => (
                    <th
                      key={`th-${idx}`}
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        color: 'var(--text-primary, #ffffff)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={`tr-${rIdx}`}
                    style={{
                      borderBottom: rIdx < dataRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: rIdx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${cIdx}`}
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-secondary, #cbd5e1)',
                        }}
                      >
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
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

/** Helper to parse a markdown table row "| col1 | col2 |" into string[] */
function parseTableRow(rowStr: string): string[] {
  const trimmed = rowStr.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const cleaned = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return cleaned.split('|').map((s) => s.trim());
}

/** Helper to parse inline formatting: [link text](url), **bold**, *italic*, `code` */
function parseInline(text: string): React.ReactNode {
  if (!text) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Links [text](url)
    const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
    // 2. Bold **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // 3. Italic *text*
    const italicMatch = remaining.match(/\*(.*?)\*/);
    // 4. Code `text`
    const codeMatch = remaining.match(/`(.*?)`/);

    // Determine which pattern occurs first
    const matches = [
      { type: 'link', match: linkMatch },
      { type: 'bold', match: boldMatch },
      { type: 'italic', match: italicMatch },
      { type: 'code', match: codeMatch },
    ].filter((m) => m.match && m.match.index !== undefined) as Array<{ type: string; match: RegExpMatchArray }>;

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Sort by earliest position in text
    matches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));
    const first = matches[0];
    const matchIndex = first.match.index || 0;

    if (matchIndex > 0) {
      parts.push(remaining.slice(0, matchIndex));
    }

    if (first.type === 'link') {
      const linkText = first.match[1];
      const url = first.match[2];
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-cyan, #06b6d4)',
            textDecoration: 'underline',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {parseInline(linkText)}
        </a>
      );
      remaining = remaining.slice(matchIndex + first.match[0].length);
    } else if (first.type === 'bold') {
      parts.push(
        <strong key={`bold-${keyIdx++}`} style={{ color: 'var(--text-primary, #ffffff)', fontWeight: 700 }}>
          {parseInline(first.match[1])}
        </strong>
      );
      remaining = remaining.slice(matchIndex + first.match[0].length);
    } else if (first.type === 'italic') {
      parts.push(
        <em key={`ital-${keyIdx++}`} style={{ fontStyle: 'italic', color: 'var(--text-tertiary, #94a3b8)' }}>
          {parseInline(first.match[1])}
        </em>
      );
      remaining = remaining.slice(matchIndex + first.match[0].length);
    } else if (first.type === 'code') {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '1px 5px',
            borderRadius: 4,
            color: 'var(--accent-cyan, #06b6d4)',
          }}
        >
          {first.match[1]}
        </code>
      );
      remaining = remaining.slice(matchIndex + first.match[0].length);
    }
  }

  return <>{parts}</>;
}
