'use client';

import React from 'react';
import type { InvestorProfile } from '@/types/portfolio';
import {
  extractActionableIntents,
  type ActionableIntent,
} from '@/engines/chatIntentsEngine';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatMessageCard } from './chat/ChatMessageCard';
import { ChatInputBar } from './chat/ChatInputBar';
import { ChatEmptyState } from './chat/ChatEmptyState';
import { useAnalysisChatState, type ChatMessage, type ChatSession } from '@/hooks/useAnalysisChatState';

export type { ActionableIntent } from '@/engines/chatIntentsEngine';
export type { ChatMessage, ChatSession };

interface AnalysisChatViewProps {
  userUid: string;
  positions: any[];
  config: any;
  investorProfile?: InvestorProfile | null;
  updatePosition: (pos: any, customReason?: string) => Promise<any>;
  updateConfig: (cfg: any) => Promise<any>;
  onOpenGlossary: (term?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AnalysisChatView({
  userUid,
  positions,
  config,
  investorProfile,
  updatePosition,
  updateConfig,
  onOpenGlossary,
  showToast,
}: AnalysisChatViewProps) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    queryInput,
    setQueryInput,
    isRunning,
    applyingActionMsgId,
    chatBottomRef,
    createNewSession,
    deleteSession,
    handleSendMessage,
    handleApplyAction,
  } = useAnalysisChatState({
    userUid,
    positions,
    config,
    investorProfile,
    updatePosition,
    updateConfig,
    showToast,
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 16,
        minHeight: 'calc(100vh - 160px)',
        alignItems: 'stretch',
      }}
    >
      {/* 📜 SIDEBAR HISTORIQUE DES DISCUSSIONS */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* 💬 ZONE PRINCIPALE DE DISCUSSION */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔬</span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{activeSession?.title || 'Analyse IA'}</h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Multi-Agents Gemini 3.5 Lite / 3.6 Flash · Background Task Active ⚡
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', fontWeight: 600 }}
            onClick={() => onOpenGlossary()}
          >
            📚 Lexique &amp; Explications
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxHeight: 'calc(100vh - 320px)',
          }}
        >
          {(!activeSession || activeSession.messages.length === 0) && (
            <ChatEmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          )}

          {activeSession?.messages.map((msg) => {
            const { dcaAction, weightAction } = msg.result?.synthesis
              ? extractActionableIntents(msg.query, msg.result.synthesis, positions)
              : { dcaAction: null, weightAction: null };

            const detectedActions = [dcaAction, weightAction].filter(Boolean) as ActionableIntent[];

            return (
              <ChatMessageCard
                key={msg.id}
                msg={msg}
                detectedActions={detectedActions}
                applyingActionMsgId={applyingActionMsgId}
                onApplyAction={handleApplyAction}
              />
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        <ChatInputBar
          queryInput={queryInput}
          setQueryInput={setQueryInput}
          isRunning={isRunning}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
