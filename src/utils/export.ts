/**
 * Utilitaire d'exportation de données (CSV & JSON)
 * Permet d'exporter les positions du portefeuille et le journal d'audit
 */

import type { Position } from '@/types/portfolio';

export function exportPortfolioToCSV(positions: Position[], fxRates: Record<string, number>): void {
  const headers = ['Nom', 'Ticker', 'Enveloppe', 'Type', 'Devise', 'Quantité', 'PRU', 'Prix Actuel', 'Valeur EUR', 'P&L EUR', 'DCA Mensuel'];
  
  const rows = positions.map((p) => {
    const rate = fxRates[p.currency] || 1.0;
    const price = p.currentPrice || p.avgPrice;
    const valEUR = p.quantity * price * rate;
    const costEUR = p.quantity * p.avgPrice * rate;
    const plEUR = valEUR - costEUR;

    return [
      `"${p.name.replace(/"/g, '""')}"`,
      p.ticker,
      p.envelope,
      p.assetType,
      p.currency,
      p.quantity,
      p.avgPrice.toFixed(2),
      p.currentPrice ? p.currentPrice.toFixed(2) : '—',
      valEUR.toFixed(2),
      plEUR.toFixed(2),
      p.monthlyDCA || 0,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RIANE_Portefeuille_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
