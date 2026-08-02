/**
 * Background Analysis Runner Manager
 * Permet l'exécution continue des pipelines d'analyse IA en arrière-plan
 * sans race condition entre React state et localStorage.
 */

import { runAnalysisPipeline, type StatusCallback } from './orchestrator';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import type { InvestorProfile } from '@/types/portfolio';

export interface RunningTask {
  messageId: string;
  sessionId: string;
  query: string;
  userUid: string;
  positions: any[];
  config: any;
  investorProfile?: InvestorProfile | null;
  startTime: number;
}

const LOCAL_STORAGE_KEY = 'riane_chat_sessions_v1';

class BackgroundAnalysisRunner {
  private activeTasks = new Map<string, RunningTask>();
  private memorySessions: any[] = [];
  private isInitialized = false;

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memorySessions = parsed;
        }
      }
    } catch {
      this.memorySessions = [];
    }
    this.isInitialized = true;
  }

  public getSessions(): any[] {
    if (!this.isInitialized) {
      this.initFromStorage();
    }
    return this.memorySessions;
  }

  public setSessions(sessions: any[]) {
    this.memorySessions = sessions;
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.memorySessions));
    } catch (err) {
      console.warn('[BackgroundRunner] Erreur sauvegarde localStorage:', err);
    }
  }

  public isTaskRunning(messageId: string): boolean {
    return this.activeTasks.has(messageId);
  }

  public registerMessage(
    sessionId: string,
    sessionTitle: string,
    message: any
  ): any[] {
    if (!this.isInitialized) this.initFromStorage();

    const sessionExists = this.memorySessions.some((s) => s.id === sessionId);

    if (!sessionExists) {
      const newSession = {
        id: sessionId,
        title: sessionTitle,
        createdAt: Date.now(),
        messages: [message],
      };
      this.memorySessions = [newSession, ...this.memorySessions];
    } else {
      this.memorySessions = this.memorySessions.map((s) => {
        if (s.id === sessionId) {
          const isFirstMsg = s.messages.length === 0;
          return {
            ...s,
            title: isFirstMsg ? sessionTitle : s.title,
            messages: [...s.messages, message],
          };
        }
        return s;
      });
    }

    this.saveToStorage();
    return this.memorySessions;
  }

  public startTask(
    messageId: string,
    sessionId: string,
    query: string,
    userUid: string,
    positions: any[],
    config: any,
    investorProfile?: InvestorProfile | null
  ) {
    if (this.activeTasks.has(messageId)) return;

    const task: RunningTask = {
      messageId,
      sessionId,
      query,
      userUid,
      positions,
      config,
      investorProfile,
      startTime: Date.now(),
    };

    this.activeTasks.set(messageId, task);

    const defaultConfig = {
      monthlyBudget: 1000,
      annualCTOBudget: 8000,
      annualSpeculativeCap: 2000,
      riskProfile: 'dynamic' as const,
      noLeverage: true,
      rebalanceByFlows: true,
      baseCurrency: 'EUR' as const,
      horizonYears: 15,
    };

    const handleStatus: StatusCallback = (status, msg) => {
      const updatedSessions = this.updateMessageInMemory(sessionId, messageId, (m) => ({
        ...m,
        status,
        statusMessage: msg,
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('riane_analysis_update', {
            detail: { sessionId, messageId, status, statusMessage: msg, updatedSessions },
          })
        );
      }
    };

    runAnalysisPipeline(userUid, query, positions, config || defaultConfig, handleStatus, investorProfile)
      .then((result) => {
        const updatedSessions = this.updateMessageInMemory(sessionId, messageId, (m) => ({
          ...m,
          result,
          status: 'synthesis',
          statusMessage: 'Analyse terminée',
        }));

        this.activeTasks.delete(messageId);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('riane_analysis_complete', {
              detail: { sessionId, messageId, result, query, updatedSessions },
            })
          );
        }
      })
      .catch((err) => {
        const errorMsg = err?.message || 'Erreur lors de l\'analyse IA';
        const updatedSessions = this.updateMessageInMemory(sessionId, messageId, (m) => ({
          ...m,
          status: 'error',
          statusMessage: errorMsg,
        }));

        this.activeTasks.delete(messageId);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('riane_analysis_error', {
              detail: { sessionId, messageId, error: errorMsg, updatedSessions },
            })
          );
        }
      });
  }

  private updateMessageInMemory(
    sessionId: string,
    messageId: string,
    updater: (msg: any) => any
  ): any[] {
    this.memorySessions = this.memorySessions.map((session: any) => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: session.messages.map((m: any) => (m.id === messageId ? updater(m) : m)),
        };
      }
      return session;
    });

    this.saveToStorage();
    return this.memorySessions;
  }

  public recoverStuckMessages(
    userUid: string,
    positions: any[],
    config: any
  ): any[] {
    if (!this.isInitialized) this.initFromStorage();

    let modified = false;

    this.memorySessions = this.memorySessions.map((session: any) => {
      const updatedMessages = session.messages.map((m: any) => {
        if (m.status !== 'synthesis' && m.status !== 'error') {
          if (!this.isTaskRunning(m.id)) {
            modified = true;
            this.startTask(m.id, session.id, m.query, userUid, positions, config);
            return {
              ...m,
              status: 'pending',
              statusMessage: 'Reprise automatique de l\'analyse en arrière-plan...',
            };
          }
        }
        return m;
      });

      return { ...session, messages: updatedMessages };
    });

    if (modified) {
      this.saveToStorage();
    }

    return this.memorySessions;
  }
}

export const backgroundRunner = new BackgroundAnalysisRunner();
