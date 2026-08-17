/**
 * Utilitaires de dates et de calculs de durées pour le DCA et les investissements.
 */

export function formatDCAElapsedTime(startDateStr: string): string {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-');
  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10) - 1;
  const startDay = parts[2] ? parseInt(parts[2], 10) : 5;

  const startDate = new Date(startYear, startMonth, startDay);
  const today = new Date();

  if (isNaN(startDate.getTime()) || startDate > today) {
    return '⏳ Début des versements à venir';
  }

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months + (days >= 15 ? 1 : 0);

  const partsStr: string[] = [];
  if (years > 0) partsStr.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) partsStr.push(`${months} mois`);
  if (days > 0 && years === 0) partsStr.push(`${days} jour${days > 1 ? 's' : ''}`);

  const durationLabel = partsStr.length > 0 ? partsStr.join(' et ') : "moins d'un jour";
  const depositsLabel = totalMonths > 0 ? `${totalMonths} versement${totalMonths > 1 ? 's' : ''}` : '1er versement en cours';

  return `⏳ Début des versements il y a ${durationLabel} (${depositsLabel})`;
}
