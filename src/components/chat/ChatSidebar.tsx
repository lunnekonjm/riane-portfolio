'use client';

import React from 'react';
import type { ChatSession } from '@/components/AnalysisChatView';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <button
        type="button"
        className="btn btn-primary"
        onClick={onNewChat}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontWeight: 700,
          padding: '10px 14px',
          fontSize: 13,
        }}
        id="new-chat-btn"
      >
        <span>➕</span> Nouvelle Discussion
      </button>

      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 8 }}>
        Historique des Analyses ({sessions.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-tertiary)',
                border: isActive ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  💬 {s.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.messages.length} message(s)
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => onDeleteSession(s.id, e)}
                title="Supprimer la discussion"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '2px 4px',
                }}
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
