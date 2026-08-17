import React from 'react';

/** Helper to parse a markdown table row "| col1 | col2 |" into string[] */
export function parseTableRow(rowStr: string): string[] {
  const trimmed = rowStr.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const cleaned = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return cleaned.split('|').map((s) => s.trim());
}

/** Helper to parse inline formatting: [link text](url), **bold**, *italic*, `code` */
export function parseInline(text: string): React.ReactNode {
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
            fontSize: 'var(--text-xs)',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 6px',
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
