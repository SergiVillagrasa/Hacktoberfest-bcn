import type { EmailContext, HistoryCoverage } from '@briefing/contracts';

export function computeCoverage(emails: readonly EmailContext[]): HistoryCoverage {
  const validDates = emails
    .map((e) => e.sentAt)
    .filter((d): d is string => typeof d === 'string' && Number.isFinite(Date.parse(d)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));

  const earliest = validDates[0];
  const latest = validDates[validDates.length - 1];

  return {
    completeness: emails.length > 0 ? 'partial' : 'unknown',
    recordedMessageCount: emails.length,
    importedMessageCount: emails.filter((e) => e.source === 'demo-import').length,
    ...(earliest ? { earliestSentAt: earliest } : {}),
    ...(latest ? { latestSentAt: latest } : {}),
  };
}
