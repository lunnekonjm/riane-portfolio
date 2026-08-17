'use client';

import { useState, useEffect, useRef } from 'react';
import { backgroundRunner } from '@/services/agents/backgroundRunner';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import type { InvestorProfile } from '@/types/portfolio';
import type { ActionableIntent } from '@/engines/chatIntentsEngine';

export interface ChatMessage {
  id: string;
  query: string;
  result: AnalysisResult | null;
  status: AnalysisStatus;
  statusMessage: string;
  createdAt: number;
  appliedAction?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

interface UseAnalysisChatStateParams {
  userUid: string;
  positions: any[];
  config: any;
  investorProfile?: InvestorProfile | null;
  updatePosition: (pos: any, customReason?: string) => Promise<any>;
  updateConfig: (cfg: any) => Promise<any>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useAnalysisChatState({
  userUid,
  positions,
  config,
  investorProfile,
  updatePosition,
  showToast,
}: UseAnalysisChatStateParams) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [applyingActionMsgId, setApplyingActionMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Charger les sessions initiales & Auto-recovery
  useEffect(() => {
    let initialSessions = backgroundRunner.recoverStuckMessages(userUid, positions, config);
    if (initialSessions.length === 0) {
      const newSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'Nouvelle Discussion',
        createdAt: Date.now(),
        messages: [],
      };
      initialSessions = [newSession];
      backgroundRunner.setSessions(initialSessions);
    }

    setSessions(initialSessions);
    if (!activeSessionId) {
      setActiveSessionId(initialSessions[0].id);
    }
  }, [userUid, positions, config]);

  // Synchronisation dynamique via CustomEvents émises par backgroundRunner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUpdate = (e: any) => {
      const updated = e?.detail?.updatedSessions;
      if (updated && Array.isArray(updated)) {
        setSessions(updated);
      }
    };

    const handleComplete = (e: any) => {
      handleUpdate(e);
      setIsRunning(false);
      const detail = e.detail;
      if (detail && detail.query) {
        showToast(`🎉 Analyse terminée pour "${detail.query.slice(0, 25)}..."`);
      }
      scrollToBottom();
    };

    const handleError = (e: any) => {
      handleUpdate(e);
      setIsRunning(false);
      if (e.detail?.error) {
        showToast(e.detail.error, 'error');
      }
    };

    window.addEventListener('riane_analysis_update', handleUpdate);
    window.addEventListener('riane_analysis_complete', handleComplete);
    window.addEventListener('riane_analysis_error', handleError);

    return () => {
      window.removeEventListener('riane_analysis_update', handleUpdate);
      window.removeEventListener('riane_analysis_complete', handleComplete);
      window.removeEventListener('riane_analysis_error', handleError);
    };
  }, [showToast]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Nouvelle Discussion',
      createdAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    backgroundRunner.setSessions(updated);
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setQueryInput('');
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cette discussion de votre historique ?')) {
      const filtered = sessions.filter((s) => s.id !== sessionId);
      backgroundRunner.setSessions(filtered);
      setSessions(filtered);
      if (activeSessionId === sessionId) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          createNewSession();
        }
      }
      showToast('Discussion supprimée');
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleApplyAction = async (msgId: string, action: ActionableIntent) => {
    setApplyingActionMsgId(msgId);
    try {
      const updatedLabels: string[] = [];

      for (const change of action.changes) {
        const pos = positions.find(
          (p) =>
            p.ticker.toUpperCase() === change.ticker.toUpperCase() ||
            p.name.toLowerCase().includes(change.label.toLowerCase()) ||
            change.label.toLowerCase().includes(p.name.toLowerCase())
        );
        if (pos) {
          if (change.field === 'targetWeight') {
            await updatePosition({
              ...pos,
              targetWeight: change.newValue,
              updatedAt: Date.now(),
            });
            updatedLabels.push(`${pos.name} (${change.formattedValue})`);
          } else if (change.field === 'monthlyDCA' || change.field === 'annualBudget') {
            const freq = change.frequency || 'monthly';
            if (freq === 'annual') {
              const annualVal = change.newValue;
              await updatePosition({
                ...pos,
                dcaFrequency: 'annual',
                annualBudget: annualVal,
                monthlyDCA: undefined,
                updatedAt: Date.now(),
              });
            } else {
              const monthlyVal = change.newValue;
              await updatePosition({
                ...pos,
                dcaFrequency: freq,
                monthlyDCA: monthlyVal,
                annualBudget: undefined,
                updatedAt: Date.now(),
              });
            }
            updatedLabels.push(`${pos.name} (${change.formattedValue})`);
          }
        }
      }

      const updatedSessions = sessions.map((session) => {
        if (session.id === activeSession?.id) {
          return {
            ...session,
            messages: session.messages.map((m) =>
              m.id === msgId ? { ...m, appliedAction: true } : m
            ),
          };
        }
        return session;
      });

      backgroundRunner.setSessions(updatedSessions);
      setSessions(updatedSessions);

      if (updatedLabels.length > 0) {
        showToast(`🎉 Portefeuille mis à jour : ${updatedLabels.join(' · ')}`);
      } else {
        showToast('Aucune position correspondante n\'a pu être identifiée dans votre portefeuille.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erreur lors de l\'application automatique de l\'action', 'error');
    } finally {
      setApplyingActionMsgId(null);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || queryInput).trim();
    if (!textToSend || isRunning) return;

    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }

    if (!customPrompt) {
      setQueryInput('');
    }

    setIsRunning(true);

    const messageId = `msg_${Date.now()}`;
    const targetSessionId = activeSession?.id || activeSessionId || `session_${Date.now()}`;
    const sessionTitle = textToSend.length > 30 ? textToSend.slice(0, 30) + '...' : textToSend;

    const newMsg: ChatMessage = {
      id: messageId,
      query: textToSend,
      result: null,
      status: 'pending',
      statusMessage: 'Lancement du pipeline multi-agents...',
      createdAt: Date.now(),
    };

    // 1. Enregistrement canonique immédiat dans backgroundRunner
    const updatedSessions = backgroundRunner.registerMessage(
      targetSessionId,
      sessionTitle,
      newMsg
    );

    // 2. Mise à jour immédiate du React state
    setSessions(updatedSessions);
    setActiveSessionId(targetSessionId);
    scrollToBottom();

    // 3. Démarrage de la tâche en arrière-plan
    backgroundRunner.startTask(
      messageId,
      targetSessionId,
      textToSend,
      userUid,
      positions,
      config,
      investorProfile
    );
  };

  return {
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
  };
}
