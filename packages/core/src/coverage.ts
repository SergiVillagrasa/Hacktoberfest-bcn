import type { EmailContext, HistoryCoverage } from '@briefing/contracts';

export function computeCoverage(emails: readonly EmailContext[]): HistoryCoverage {
  const validDates = emails
    .map((e) => e.sentAt)
    .filter((d): d is string => typeof d === 'string' && d.length > 0)
    .sort();

  const earliest = validDates[0];
  const latest = validDates[validDates.length - 1];

  return {
    completeness: 'partial',
    recordedMessageCount: emails.length,
    importedMessageCount: emails.filter((e) => e.source === 'demo-import').length,
    ...(earliest ? { earliestSentAt: earliest } : {}),
    ...(latest ? { latestSentAt: latest } : {}),
  };
}
