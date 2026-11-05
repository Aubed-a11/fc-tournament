/**
 * Format helpers for FC Tournament eSport
 */

export function formatDateFrench(dateString?: string): string {
  if (!dateString) return 'Date à déterminer';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTimeFrench(dateString?: string, timeString?: string): string {
  const formattedDate = formatDateFrench(dateString);
  if (!timeString) return formattedDate;
  return `${formattedDate} à ${timeString}`;
}

export function formatMAD(_amount?: number): string {
  return '****';
}
