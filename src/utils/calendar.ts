import type { Match } from '../types/index.ts';

const TZ = 'Africa/Casablanca';

// Convertit une date et une heure exprimees a l'heure du Maroc en instant UTC
export function casablancaToUtc(date: string, time: string): Date {
  const [h = '00', m = '00'] = (time || '00:00').split(':');
  const guess = new Date(`${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const localAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  const offset = localAsUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

// Date du jour (AAAA-MM-JJ) a l'heure du Maroc
export function casablancaToday(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(Date.now() + offsetDays * 86400000)
  );
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsText(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Fichier agenda (.ics) avec deux rappels : la veille et 1 heure avant chaque match
export function buildMatchesIcs(matches: Match[], userId: string, tournamentNames: Record<string, string>): string {
  const now = icsDate(new Date());
  const events = matches
    .filter((m) => m.scheduledDate && m.scheduledTime)
    .map((m) => {
      const start = casablancaToUtc(m.scheduledDate, m.scheduledTime);
      const end = new Date(start.getTime() + 45 * 60000);
      const opponent = m.player1Id === userId ? m.player2Gamertag : m.player1Gamertag;
      const tournament = tournamentNames[m.tournamentId] || 'FC Tournament';
      return [
        'BEGIN:VEVENT',
        `UID:${m.id}-${userId}@fc-tournament.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsDate(start)}`,
        `DTEND:${icsDate(end)}`,
        `SUMMARY:${icsText(`FC Tournament : match contre ${opponent || 'adversaire à définir'}`)}`,
        `DESCRIPTION:${icsText(`${m.stageName}, ${tournament}. Retard de plus de 10 minutes = forfait. Envoyez la capture du score sur https://www.fc-tournament.com/#dashboard`)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Match FC Tournament demain',
        'TRIGGER:-P1D',
        'END:VALARM',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Match FC Tournament dans 1 heure',
        'TRIGGER:-PT1H',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FC Tournament//Calendrier joueur//FR', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
