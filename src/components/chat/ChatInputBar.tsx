'use client';

import React from 'react';

interface ChatInputBarProps {
  queryInput: string;
  setQueryInput: (v: string) => void;
  isRunning: boolean;
  onSendMessage: (query?: string) => void;
}

export function ChatInputBar({
  queryInput,
  setQueryInput,
  isRunning,
  onSendMessage,
}: ChatInputBarProps) {
  return (
    <div
      style={{
        padding: 16,
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <input
        className="input"
        placeholder="Posez une question sur une valeur ou une stratégie (ex: Analyse Riber, Allègement Symbotic)..."
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
        disabled={isRunning}
        style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
        id="analysis-chat-input"
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => onSendMessage()}
        disabled={isRunning || !queryInput.trim()}
        style={{ padding: '12px 20px', fontWeight: 700, gap: 8 }}
        id="analysis-chat-send-btn"
      >
        {isRunning ? (
          <>
            <span className="loading-spinner" />
            Analyse...
          </>
        ) : (
          <>
            <span>🚀</span>
            Envoyer
          </>
        )}
      </button>
    </div>
  );
}
