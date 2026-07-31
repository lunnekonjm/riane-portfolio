'use client';

import { useState, useCallback } from 'react';
import { runAnalysisPipeline, type StatusCallback } from '@/services/agents/orchestrator';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import { getCachedAnalysis, setCachedAnalysis, clearAnalysisCache } from '@/utils/analysisCache';

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const onStatus: StatusCallback = useCallback((s: AnalysisStatus, msg: string) => {
    setStatus(s);
    setStatusMessage(msg);
  }, []);

  const runAnalysis = useCallback(async (
    uid: string,
    query: string,
    positions: any[],
    config: any,
    bypassCache = false
  ) => {
    setIsRunning(true);
    setIsFromCache(false);
    setResult(null);

    // 1. Check cache first unless bypassCache is requested
    if (!bypassCache) {
      const cached = getCachedAnalysis(query);
      if (cached) {
        setStatus('synthesis');
        setStatusMessage('⚡ Analyse récupérée en 0ms depuis le cache local');
        setIsFromCache(true);
        setResult(cached);
        setHistory((prev) => [cached, ...prev.filter((h) => h.id !== cached.id)]);
        setIsRunning(false);
        return cached;
      }
    }

    setStatus('pending');
    setStatusMessage('Lancement de l\'analyse...');

    try {
      const analysisResult = await runAnalysisPipeline(uid, query, positions, config, onStatus);
      if (analysisResult && analysisResult.synthesis) {
        setCachedAnalysis(query, analysisResult);
      }
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
    setIsFromCache(false);
    setStatus('pending');
    setStatusMessage('');
  }, []);

  return {
    result,
    status,
    statusMessage,
    isRunning,
    isFromCache,
    history,
    runAnalysis,
    clearResult,
    clearAnalysisCache,
  };
}
