'use client';

import { useEffect } from 'react';
import type { PageView } from '@/types/navigation';

interface UseTrueLayerDeepLinkParams {
  setDcaGlobalStartDate: (date: string) => void;
  setCurrentView: (view: PageView) => void;
  setAutoOpenBudgetWizard: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function useTrueLayerDeepLink({
  setDcaGlobalStartDate,
  setCurrentView,
  setAutoOpenBudgetWizard,
  showToast,
}: UseTrueLayerDeepLinkParams) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('riane_dca_start_date');
      if (savedDate) {
        setDcaGlobalStartDate(savedDate);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const tlStatus = params.get('truelayer_status');
        const tlToken = params.get('token');
        const openWizardParam = params.get('open_wizard');

        if (tlToken) {
          try {
            localStorage.setItem('truelayer_access_token', tlToken);
          } catch {}
        }
        if (tlStatus === 'success' || tlStatus === 'code_received') {
          showToast('BoursoBank connecté avec succès via DSP2 !', 'success');
        } else if (tlStatus === 'error' || tlStatus === 'token_error') {
          const msg = params.get('msg') || 'Échec de connexion bancaire';
          showToast(`Erreur TrueLayer : ${msg}`, 'error');
        }
        const viewParam = params.get('view') as PageView | null;
        if (viewParam && ['dashboard', 'envelopes', 'revenue', 'analysis', 'risk', 'audit', 'reports'].includes(viewParam)) {
          setCurrentView(viewParam);
        } else if (tlStatus === 'success' || openWizardParam === 'true') {
          setCurrentView('revenue');
        }

        if (openWizardParam === 'true' || tlStatus === 'success') {
          setAutoOpenBudgetWizard(true);
        }

        if (tlStatus || tlToken || params.get('code')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {}
    }
  }, [setDcaGlobalStartDate, setCurrentView, setAutoOpenBudgetWizard, showToast]);
}
