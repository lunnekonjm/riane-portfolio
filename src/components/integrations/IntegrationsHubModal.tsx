"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Building2,
  TrendingUp,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { SnapTradeSyncResult } from "@/lib/snaptrade/types";
import { TrueLayerSyncResult } from "@/lib/truelayer/types";

interface IntegrationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  fxRateEURUSD?: number;
  theme?: "dark" | "light";
}

export const IntegrationsHubModal: React.FC<IntegrationsHubModalProps> = ({
  isOpen,
  onClose,
  fxRateEURUSD = 1.08,
  theme = "dark",
}) => {
  const [loading, setLoading] = useState(false);
  const [snaptradeData, setSnaptradeData] = useState<SnapTradeSyncResult | null>(null);
  const [truelayerData, setTruelayerData] = useState<TrueLayerSyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "ibkr" | "boursobank" | "traderepublic">("overview");

  const syncAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/sync-all?fxRate=${fxRateEURUSD}`);
      if (res.ok) {
        const data = await res.json();
        setSnaptradeData(data.snaptrade);
        setTruelayerData(data.truelayer);
        setLastSyncTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      syncAll();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === "dark";

  // Calculations
  const ibkrTotalEUR = snaptradeData?.totalPortfolioEUR || 0;
  const ibkrCashEUR = snaptradeData?.totalCashEUR || 0;
  const ibkrInvestedEUR = snaptradeData?.totalInvestedEUR || 0;

  const boursoTotalEUR = truelayerData?.totalBoursoBankEUR || 0;
  const boursoCheckingEUR = truelayerData?.totalCheckingEUR || 0;
  const boursoSavingsEUR = truelayerData?.totalSavingsEUR || 0;
  const boursoInvestedEUR = truelayerData?.totalInvestedEUR || 0;

  const consolidatedTotalEUR = ibkrTotalEUR + boursoTotalEUR;

  const ibkrAuth = snaptradeData?.authorizations?.[0];
  const isIbkrConnected = snaptradeData?.authorizations && snaptradeData.authorizations.length > 0;

  const formatEUR = (val: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(val);

  const formatUSD = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Hub Multi-Comptes & Synchronisation API</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> DSP2 / Read-Only
                </span>
              </div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Interactive Brokers (SnapTrade Personal), BoursoBank (TrueLayer Open Banking) & Trade Republic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {lastSyncTime && (
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Dernière synchro: <strong className="font-mono">{lastSyncTime}</strong>
              </span>
            )}
            <button
              onClick={syncAll}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-md active:scale-95 ${
                loading
                  ? "bg-indigo-600/50 text-white/70 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Actualisation..." : "Synchroniser"}</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? "border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                  : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-6 gap-2 text-sm overflow-x-auto ${
            isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Vue Consolidée
          </button>
          <button
            onClick={() => setActiveTab("ibkr")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "ibkr"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" /> Interactive Brokers (SnapTrade)
            {isIbkrConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("boursobank")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "boursobank"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Landmark className="w-4 h-4" /> BoursoBank (TrueLayer)
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">DSP2</span>
          </button>
          <button
            onClick={() => setActiveTab("traderepublic")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "traderepublic"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Trade Republic (DCA Auto)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: CONSOLIDATED OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Global Total KPI Banner */}
              <div
                className={`p-6 rounded-2xl border relative overflow-hidden ${
                  isDark
                    ? "bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900/90 border-indigo-500/30"
                    : "bg-gradient-to-br from-indigo-50 via-white to-slate-50 border-indigo-200"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Patrimoine Total Consolidé en Direct
                    </span>
                    <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
                      {formatEUR(consolidatedTotalEUR)}
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Agrégation en temps réel de vos comptes bancaires et plateformes de courtage.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`p-4 rounded-xl border text-center ${
                        isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <span className="text-[11px] text-slate-400 block font-medium">Liquidités Bancaires</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {formatEUR(boursoCheckingEUR + boursoSavingsEUR + ibkrCashEUR)}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-xl border text-center ${
                        isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <span className="text-[11px] text-slate-400 block font-medium">Investissements & Titres</span>
                      <span className="text-lg font-bold text-indigo-400">
                        {formatEUR(ibkrInvestedEUR + boursoInvestedEUR)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Interactive Brokers */}
                <div
                  onClick={() => setActiveTab("ibkr")}
                  className={`p-5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isDark
                      ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/50"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Interactive Brokers</h4>
                        <span className="text-[10px] text-slate-400">Via SnapTrade Personal</span>
                      </div>
                    </div>
                    {isIbkrConnected ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connecté
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Non lié
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Valeur totale :</span>
                      <span className="font-semibold">{formatEUR(ibkrTotalEUR)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cash disponible :</span>
                      <span className="text-slate-300">{formatEUR(ibkrCashEUR)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Positions en titres :</span>
                      <span className="text-indigo-300">{formatEUR(ibkrInvestedEUR)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. BoursoBank */}
                <div
                  onClick={() => setActiveTab("boursobank")}
                  className={`p-5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isDark
                      ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/50"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">BoursoBank</h4>
                        <span className="text-[10px] text-slate-400">Via TrueLayer DSP2</span>
                      </div>
                    </div>
                    {truelayerData?.connected ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connecté
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        OAuth Prêt
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total bancaire :</span>
                      <span className="font-semibold">{formatEUR(boursoTotalEUR)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Compte Courant :</span>
                      <span className="text-slate-300">{formatEUR(boursoCheckingEUR)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Livret A & Épargne :</span>
                      <span className="text-emerald-400">{formatEUR(boursoSavingsEUR)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">PEA-PME Titres :</span>
                      <span className="text-indigo-300">{formatEUR(boursoInvestedEUR)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Trade Republic */}
                <div
                  onClick={() => setActiveTab("traderepublic")}
                  className={`p-5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isDark
                      ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/50"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Trade Republic</h4>
                        <span className="text-[10px] text-slate-400">Moteur DCA Automatique</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-Sync
                    </span>
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Stratégie :</span>
                      <span className="font-semibold text-emerald-400">DCA Récurrent Nasdaq 100</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Fréquence :</span>
                      <span className="text-slate-300">Automatique (mensuel)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Flux de cours :</span>
                      <span className="text-slate-300">Direct Yahoo Finance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE BROKERS (SNAPTRADE) */}
          {activeTab === "ibkr" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Interactive Brokers (IBKR)</h3>
                      <p className="text-xs text-slate-400">
                        Intégration directe via SnapTrade Personal API Key (lecture seule sécurisée).
                      </p>
                    </div>
                  </div>

                  {ibkrAuth && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connexion Active ({ibkrAuth.brokerageName})
                      </span>
                    </div>
                  )}
                </div>

                {/* IBKR Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">Valeur Totale IBKR</span>
                    <span className="text-xl font-bold mt-1 block">{formatEUR(ibkrTotalEUR)}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">Liquidités (Cash Disponible)</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{formatEUR(ibkrCashEUR)}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">Titres & Actions Détenus</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{formatEUR(ibkrInvestedEUR)}</span>
                  </div>
                </div>
              </div>

              {/* Accounts & Holdings Lists */}
              {snaptradeData?.accounts && snaptradeData.accounts.length > 0 ? (
                <div className="space-y-4">
                  {snaptradeData.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`p-5 rounded-xl border ${
                        isDark ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-bold text-base">{acc.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">
                            N° {acc.numberMasked} • Type: {acc.type} • Devise: {acc.currency}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-extrabold">{formatEUR(acc.totalValueEUR)}</span>
                          <span className="text-xs text-slate-400 block">Total compte</span>
                        </div>
                      </div>

                      {/* Holdings Table */}
                      {acc.holdings.length > 0 ? (
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-left text-xs">
                            <thead className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                              <tr>
                                <th className="pb-2 font-semibold">Actif</th>
                                <th className="pb-2 font-semibold text-right">Quantité</th>
                                <th className="pb-2 font-semibold text-right">Prix</th>
                                <th className="pb-2 font-semibold text-right">Valeur Marché</th>
                                <th className="pb-2 font-semibold text-right">Gain / Perte</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {acc.holdings.map((h) => (
                                <tr key={h.id} className="hover:bg-indigo-500/5">
                                  <td className="py-2.5 font-medium">
                                    <div className="font-bold">{h.symbol}</div>
                                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{h.name}</div>
                                  </td>
                                  <td className="py-2.5 text-right font-mono">{h.units}</td>
                                  <td className="py-2.5 text-right font-mono">
                                    {h.currency === "USD" ? formatUSD(h.price) : formatEUR(h.price)}
                                  </td>
                                  <td className="py-2.5 text-right font-bold font-mono">
                                    {h.currency === "USD" ? formatUSD(h.marketValue) : formatEUR(h.marketValue)}
                                  </td>
                                  <td className="py-2.5 text-right font-mono">
                                    {h.totalGainLossPercentage != null ? (
                                      <span
                                        className={`inline-flex items-center gap-0.5 font-semibold ${
                                          h.totalGainLossPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                                        }`}
                                      >
                                        {h.totalGainLossPercentage >= 0 ? (
                                          <ArrowUpRight className="w-3 h-3" />
                                        ) : (
                                          <ArrowDownRight className="w-3 h-3" />
                                        )}
                                        {h.totalGainLossPercentage.toFixed(2)}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl text-center text-xs ${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                          Aucune position ouverte sur ce compte ou en attente de synchronisation.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-6 rounded-2xl border text-center space-y-3 ${
                    isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Info className="w-8 h-8 mx-auto text-indigo-400" />
                  <h4 className="font-bold text-base">Connexion Interactive Brokers Enregistrée</h4>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Votre autorisation Interactive Brokers (Query Flex ID) est bien configurée sur votre compte SnapTrade Personal. Les données de comptes et de positions s'affichent automatiquement dès que le rapport Flex Query périodique est généré par Interactive Brokers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOURSOBANK (TRUELAYER) */}
          {activeTab === "boursobank" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">BoursoBank (Banque & Épargne)</h3>
                      <p className="text-xs text-slate-400">
                        Synchronisation DSP2 Open Banking via TrueLayer (Compte Courant, Livret A, PEA-PME).
                      </p>
                    </div>
                  </div>

                  <a
                    href="/api/integrations/truelayer/auth-url"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/20 transition-all active:scale-95"
                  >
                    <span>Connecter BoursoBank DSP2</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* BoursoBank Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">Compte Courant</span>
                    <span className="text-xl font-bold text-slate-200 mt-1 block">{formatEUR(boursoCheckingEUR)}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">Livret A & Épargne</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{formatEUR(boursoSavingsEUR)}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-xs text-slate-400 block font-medium">PEA-PME Titres</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{formatEUR(boursoInvestedEUR)}</span>
                  </div>
                </div>
              </div>

              {/* Accounts list or Connect banner */}
              {truelayerData?.accounts && truelayerData.accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {truelayerData.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-pink-400">
                            {acc.accountType}
                          </span>
                          <h4 className="font-bold text-sm mt-0.5">{acc.displayName}</h4>
                          {acc.ibanMasked && (
                            <span className="text-xs text-slate-400 font-mono block mt-1">
                              IBAN {acc.ibanMasked}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-baseline">
                        <span className="text-xs text-slate-400">Solde disponible</span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          {formatEUR(acc.availableBalance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-6 rounded-2xl border text-center space-y-3 ${
                    isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-8 h-8 mx-auto text-pink-400" />
                  <h4 className="font-bold text-base">Connexion Sécurisée DSP2 BoursoBank</h4>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Pour afficher en temps réel votre Livret A, votre Compte Courant et votre PEA-PME sans saisie manuelle, cliquez sur le bouton ci-dessus pour autoriser l'accès via le portail Open Banking TrueLayer.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRADE REPUBLIC */}
          {activeTab === "traderepublic" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div
                className={`p-6 rounded-2xl border ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Trade Republic (Moteur DCA Automatique)</h3>
                    <p className="text-xs text-slate-400">
                      Gestion transparente des virements programmés et de l'accumulation indicielle Nasdaq 100.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-2">
                  <p className="font-medium">
                    💡 <strong>Comment fonctionne le suivi Trade Republic dans RIANE :</strong>
                  </p>
                  <p className="text-slate-300">
                    Trade Republic ne fournissant pas d'API publique ouverte aux particuliers, RIANE calcule exactement votre portefeuille Trade Republic grâce à :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>L'historique exact de vos paliers de versements programmés (DCA Step-Ups).</li>
                    <li>Les cours réels et les valorisations en direct du <strong>Nasdaq 100 / QQQ</strong> via les flux de marché.</li>
                    <li>Le calcul automatique des parts accumulées et du PRU moyen pondéré.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isDark ? "border-slate-800 bg-slate-950 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Sécurité certifiée : Chiffrement SSL/TLS, aucune clé privée stockée dans le navigateur.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
