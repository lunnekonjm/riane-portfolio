'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Edit2 } from 'lucide-react';
import { CrisisRunwayMetrics } from '../engines/crisisRunwayEngine';

interface LiquidTankWidgetProps {
  metrics: CrisisRunwayMetrics;
  onOpenCrisisModal?: () => void;
  onEditTarget?: () => void;
}

export const LiquidTankWidget: React.FC<LiquidTankWidgetProps> = ({
  metrics,
  onOpenCrisisModal,
  onEditTarget,
}) => {
  const {
    totalAvailableEmergencySavings,
    targetBuffer6Months,
    bufferFillRatioPercent,
    runwayMonths,
    safetyStatus,
  } = metrics;

  const getStatusBadge = () => {
    switch (safetyStatus) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-400" />,
          label: 'Critique (< 1 mois)',
        };
      case 'ALERT':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />,
          label: 'Alerte (< 3 mois)',
        };
      case 'COMFORTABLE':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />,
          label: 'Confortable (3-6 mois)',
        };
      case 'FORTRESS':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />,
          label: 'Forteresse (≥ 6 mois)',
        };
    }
  };

  const status = getStatusBadge();
  const clampedFill = Math.min(100, Math.max(5, bufferFillRatioPercent));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-bold">🛡️</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Réservoir d'Urgence</span>
              {onEditTarget && (
                <button
                  onClick={onEditTarget}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Modifier l'objectif"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Cible 6 mois : <span className="text-slate-300 font-semibold">{Math.round(targetBuffer6Months).toLocaleString('fr-FR')} €</span>
            </p>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center ${status.bg}`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Capsule Visuelle Liquid Tank */}
        <div className="col-span-5 flex flex-col items-center justify-center">
          <div className="w-20 h-36 bg-slate-950 rounded-full border-2 border-slate-700/60 relative overflow-hidden flex flex-col justify-end shadow-inner">
            {/* Liquid Fill */}
            <div
              className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400/90 transition-all duration-1000 ease-out relative"
              style={{ height: `${clampedFill}%` }}
            >
              {/* Wave shimmer top line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-200/80 rounded-full animate-pulse" />
            </div>

            {/* Percentage text overlay in the center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {bufferFillRatioPercent}%
              </span>
              <span className="text-[9px] font-semibold text-amber-200/90 drop-shadow">
                rempli
              </span>
            </div>
          </div>
        </div>

        {/* Metrics & Action Details */}
        <div className="col-span-7 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Épargne disponible (Sas + Livrets)</span>
            <span className="text-xl font-bold text-amber-400">
              {Math.round(totalAvailableEmergencySavings).toLocaleString('fr-FR')} €
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Autonomie (Runway) :</span>
              <span className="font-bold text-white">{runwayMonths} mois</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (runwayMonths / 6) * 100)}%` }}
              />
            </div>
          </div>

          {onOpenCrisisModal && (
            <button
              onClick={onOpenCrisisModal}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm hover:scale-[1.01]"
            >
              <span>🚨 Simulateur de Crise & CLIC</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
