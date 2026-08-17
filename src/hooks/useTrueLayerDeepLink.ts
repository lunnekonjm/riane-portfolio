"use client";

import { useEffect } from "react";
import type { PageView } from "@/types/navigation";
import { fetchAndCacheTrueLayerTransactions } from "@/services/reconciliation/truelayerTransactionFetcher";

interface UseTrueLayerDeepLinkParams {
  setDcaGlobalStartDate: (date: string) => void;
  setCurrentView: (view: PageView) => void;
  setAutoOpenBudgetWizard: (open: boolean) => void;
  showToast: (message: string, type?: "success" | "error") => void;
}

export function useTrueLayerDeepLink({
  setDcaGlobalStartDate,
  setCurrentView,
  setAutoOpenBudgetWizard,
  showToast,
}: UseTrueLayerDeepLinkParams) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDate = localStorage.getItem("riane_dca_start_date");
      if (savedDate) {
        setDcaGlobalStartDate(savedDate);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const tlStatus = params.get("truelayer_status");
        const tlToken = params.get("token");
        const openWizardParam = params.get("open_wizard");

        if (tlToken) {
          try {
            localStorage.setItem("truelayer_access_token", tlToken);
          } catch {}
        }

        if (tlStatus === "success" || tlStatus === "code_received" || tlToken) {
          showToast("BoursoBank connecté avec succès via DSP2 ! Synchronisation des transactions...", "success");
          
          // Trigger immediate fetch of bank transactions
          fetchAndCacheTrueLayerTransactions(3).then((res) => {
            if (res.transactions.length > 0) {
              showToast(`${res.transactions.length} transactions BoursoBank synchronisées avec succès !`, "success");
            } else if (res.partialErrors.length > 0) {
              console.warn("TrueLayer transaction fetch warnings:", res.partialErrors);
            }
          }).catch((err) => {
            console.error("Failed to fetch TrueLayer transactions on callback:", err);
          });
        } else if (tlStatus === "error" || tlStatus === "token_error") {
          const msg = params.get("msg") || "Échec de connexion bancaire";
          showToast(`Erreur TrueLayer : ${msg}`, "error");
        }

        const viewParam = params.get("view") as PageView | null;
        if (viewParam && ["dashboard", "envelopes", "revenue", "analysis", "risk", "audit", "reports"].includes(viewParam)) {
          setCurrentView(viewParam);
        } else if (tlStatus === "success" || openWizardParam === "true") {
          setCurrentView("revenue");
        }

        if (openWizardParam === "true" || tlStatus === "success") {
          setAutoOpenBudgetWizard(true);
        }

        if (tlStatus || tlToken || params.get("code")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {}
    }
  }, [setDcaGlobalStartDate, setCurrentView, setAutoOpenBudgetWizard, showToast]);
}
