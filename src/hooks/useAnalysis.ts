'use client';

import { useState, useCallback } from 'react';
import { runAnalysisPipeline, type StatusCallback } from '@/services/agents/orchestrator';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const onStatus: StatusCallback = useCallback((s: AnalysisStatus, msg: string) => {
    setStatus(s);
    setStatusMessage(msg);
  }, []);

  const runAnalysis = useCallback(async (
    uid: string,
    query: string,
    positions: any[],
    config: any
  ) => {
    setIsRunning(true);
    setResult(null);
    setStatus('pending');
    setStatusMessage('Lancement de l\'analyse...');

    try {
      const analysisResult = await runAnalysisPipeline(uid, query, positions, config, onStatus);
      setResult(analysisResult);
      setHistory((prev) => [analysisResult, ...prev]);
      return analysisResult;
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [onStatus]);

  const clearResult = useCallback(() => {
    setResult(null);
    setStatus('pending');
    setStatusMessage('');
  }, []);

  return {
    result,
    status,
    statusMessage,
    isRunning,
    history,
    runAnalysis,
    clearResult,
  };
}
