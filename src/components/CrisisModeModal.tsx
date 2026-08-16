'use client';

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  CreditCard,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  simulateLifeAccident,
  compareFinancingOptions,
} from '../engines/crisisRunwayEngine';

interface CrisisModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmergencySavings: number;
  vitalMonthlyExpenses: number;
  monthlyNetIncome: number;
  onApplyAdjustment?: (monthlyReduction: number, note: string) => void;
}

export const CrisisModeModal: React.FC<CrisisModeModalProps> = ({
  isOpen,
  onClose,
  currentEmergencySavings,
  vitalMonthlyExpenses,
  monthlyNetIncome,
  onApplyAdjustment,
}) => {
  const [activeTab, setActiveTab] = useState<'ACCIDENT' | 'CLIC'>('ACCIDENT');

  // Tab 0 : Accident de la vie
  const [emergencyExpense, setEmergencyExpense] = useState<number>(3000);
  const [cashPayment, setCashPayment] = useState<number>(1000);
  const [creditDurationMonths, setCreditDurationMonths] = useState<number>(12);

  // Tab 1 : Financement CLIC
  const [clicTotalCost, setClicTotalCost] = useState<number>(2900);
  const [clicInitialCash, setClicInitialCash] = useState<number>(500);
  const [clicDurationMonths, setClicDurationMonths] = useState<number>(12);
  const [clicTaeg, setClicTaeg] = useState<number>(5.9);
  const [selectedFundingOption, setSelectedFundingOption] = useState<0 | 1 | 2>(1); // 1 = Fractionné 0%

  if (!isOpen) return null;

  // Calculs dynamiques
  const accidentSim = simulateLifeAccident({
    currentEmergencySavings,
    vitalMonthlyExpenses,
    emergencyExpense,
    cashPayment,
    creditMonths: creditDurationMonths,
  });

  const financingSim = compareFinancingOptions({
    totalCost: clicTotalCost,
    cashUpfront: clicInitialCash,
    durationMonths: clicDurationMonths,
    taegPercent: clicTaeg,
    monthlyIncome: monthlyNetIncome,
    currentSavings: currentEmergencySavings,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Simulateur de Crise & Résilience</h3>
              <p className="text-xs text-slate-400">
                Stress-testez vos liquidités et arbitrez vos modes de financement sans compromettre votre avenir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('ACCIDENT')}
            className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'ACCIDENT'
                ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Accident de la vie / Choc Imprévu</span>
          </button>
          <button
            onClick={() => setActiveTab('CLIC')}
            className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'CLIC'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financement CLIC & Crédit</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {activeTab === 'ACCIDENT' ? (
            /* Tab 0 : Accident de la vie */
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Configurer l'urgence financière
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Dépense totale d'urgence</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={emergencyExpense}
                        onChange={(e) => setEmergencyExpense(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Paiement comptant initial</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cashPayment}
                        onChange={(e) => setCashPayment(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Durée du crédit</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={creditDurationMonths}
                        onChange={(e) => setCreditDurationMonths(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">mois</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Impact sur votre résilience
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      accidentSim.isReserveExhausted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {accidentSim.isReserveExhausted ? '⚠️ Réserve en Rupture' : '🛡️ Filet Préservé'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Épargne restante</span>
                    <span className="text-lg font-bold text-white">
                      {Math.round(accidentSim.postAccidentAvailableSavings).toLocaleString('fr-FR')} €
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Autonomie restante (Runway)</span>
                    <span className="text-lg font-bold text-amber-400">
                      {accidentSim.postAccidentRunwayMonths} mois
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300">Plan d'action immédiat recommandé :</span>
                  {accidentSim.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <ArrowRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 1 : Financement CLIC & Optimiseur */
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dépense à optimiser
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Coût total</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={clicTotalCost}
                        onChange={(e) => setClicTotalCost(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Comptant initial</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={clicInitialCash}
                        onChange={(e) => setClicInitialCash(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">TAEG Crédit (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={clicTaeg}
                        onChange={(e) => setClicTaeg(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Durée de remboursement :</span>
                    <span className="font-bold text-white">{clicDurationMonths} mois</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={36}
                    step={1}
                    value={clicDurationMonths}
                    onChange={(e) => setClicDurationMonths(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Smart Advice Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    {financingSim.adviceTitle}
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {financingSim.adviceMessage}
                  </p>
                </div>
              </div>

              {/* Option Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: 0% Fractionné */}
                <button
                  type="button"
                  onClick={() => setSelectedFundingOption(1)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    selectedFundingOption === 1
                      ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Fractionné sans frais</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                      0% INTÉRÊTS
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-cyan-400 mb-1">
                    {financingSim.noFeeOption.monthlyPayment} €{' '}
                    <span className="text-xs font-normal text-slate-400">/ mois</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Coût total : {financingSim.remainingAmount} € (0 € d'intérêts sur {clicDurationMonths} mois)
                  </p>
                </button>

                {/* Option 2: Crédit Personnel */}
                <button
                  type="button"
                  onClick={() => setSelectedFundingOption(2)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    selectedFundingOption === 2
                      ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Crédit Amortissable</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                      TAEG {clicTaeg}%
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white mb-1">
                    {financingSim.personalCreditOption.monthlyPayment} €{' '}
                    <span className="text-xs font-normal text-slate-400">/ mois</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Intérêts totaux :{' '}
                    <span className="text-amber-400 font-semibold">
                      +{financingSim.personalCreditOption.totalInterest} €
                    </span>
                  </p>
                </button>
              </div>

              {/* Action Button */}
              {onApplyAdjustment && (
                <button
                  type="button"
                  onClick={() => {
                    const monthly =
                      selectedFundingOption === 1
                        ? financingSim.noFeeOption.monthlyPayment
                        : financingSim.personalCreditOption.monthlyPayment;
                    onApplyAdjustment(
                      monthly,
                      `Échéance financement CLIC (${clicDurationMonths} mois)`
                    );
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    Appliquer cette mensualité (-
                    {selectedFundingOption === 1
                      ? financingSim.noFeeOption.monthlyPayment
                      : financingSim.personalCreditOption.monthlyPayment}{' '}
                    €/m) au budget mensuel
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
