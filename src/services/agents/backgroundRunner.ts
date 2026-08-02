/**
 * Background Analysis Runner Manager
 * Permet l'exécution continue des pipelines d'analyse IA en arrière-plan
 * même lorsque l'utilisateur navigue entre les vues de l'application ou ferme un composant.
 */

import { runAnalysisPipeline, type StatusCallback } from './orchestrator';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';

export interface RunningTask {
  messageId: string;
  sessionId: string;
  query: string;
  userUid: string;
  positions: any[];
  config: any;
  startTime: number;
}

const LOCAL_STORAGE_KEY = 'riane_chat_sessions_v1';

class BackgroundAnalysisRunner {
  private activeTasks = new Map<string, RunningTask>();

  public isTaskRunning(messageId: string): boolean {
    return this.activeTasks.has(messageId);
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  public startTask(
    messageId: string,
    sessionId: string,
    query: string,
    userUid: string,
    positions: any[],
    config: any,
    onStatusUpdate?: (status: AnalysisStatus, msg: string) => void,
    onComplete?: (result: AnalysisResult) => void
  ) {
    if (this.activeTasks.has(messageId)) return;

    const task: RunningTask = {
      messageId,
      sessionId,
      query,
      userUid,
      positions,
      config,
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
      onStatusUpdate?.(status, msg);
      const updatedSessions = this.updateMessageInLocalStorage(sessionId, messageId, (m) => ({
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

    runAnalysisPipeline(userUid, query, positions, config || defaultConfig, handleStatus)
      .then((result) => {
        const updatedSessions = this.updateMessageInLocalStorage(sessionId, messageId, (m) => ({
          ...m,
          result,
          status: 'synthesis',
          statusMessage: 'Analyse terminée',
        }));

        this.activeTasks.delete(messageId);
        onComplete?.(result);

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
        const updatedSessions = this.updateMessageInLocalStorage(sessionId, messageId, (m) => ({
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

  private updateMessageInLocalStorage(
    sessionId: string,
    messageId: string,
    updater: (msg: any) => any
  ): any[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return null;
      const sessions = JSON.parse(raw);
      if (!Array.isArray(sessions)) return null;

      const updatedSessions = sessions.map((session: any) => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: session.messages.map((m: any) => (m.id === messageId ? updater(m) : m)),
          };
        }
        return session;
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    } catch (err) {
      console.warn('[BackgroundRunner] Erreur de maj localStorage:', err);
      return null;
    }
  }

  /**
   * Analyse et nettoie les messages bloqués au chargement (ex: après un refresh)
   */
  public recoverStuckMessages(
    sessions: any[],
    userUid: string,
    positions: any[],
    config: any
  ): any[] {
    let modified = false;

    const recoveredSessions = sessions.map((session: any) => {
      const updatedMessages = session.messages.map((m: any) => {
        // Si le message est bloqué en état d'attente
        if (m.status !== 'synthesis' && m.status !== 'error') {
          // Si la tâche n'est pas activement en cours d'exécution dans la mémoire
          if (!this.isTaskRunning(m.id)) {
            modified = true;
            // Relancer la tâche immédiatement en arrière-plan
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

    if (modified && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recoveredSessions));
      } catch (e) {
        // ignore
      }
    }

    return recoveredSessions;
  }
}

export const backgroundRunner = new BackgroundAnalysisRunner();
