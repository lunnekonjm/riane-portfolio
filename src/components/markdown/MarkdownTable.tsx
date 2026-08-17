import React from 'react';
import { parseInline, parseTableRow } from './markdownParser';

interface MarkdownTableProps {
  tableLines: string[];
}

export function MarkdownTable({ tableLines }: MarkdownTableProps) {
  if (tableLines.length < 2) return null;

  const headerCells = parseTableRow(tableLines[0]);
  const dataRows = tableLines.slice(2).map(parseTableRow);

  return (
    <div
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
}
