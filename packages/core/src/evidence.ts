import type { ContextCandidate, ContextItem, EmailContext } from '@briefing/contracts';

export function validateCandidateEvidence(
  candidate: ContextCandidate,
  allowedSources: readonly EmailContext[]
): boolean {
  if (!candidate.sourceEmailId || !candidate.sourceExcerpt) {
    return false;
  }

  const trimmedExcerpt = candidate.sourceExcerpt.trim();
  if (trimmedExcerpt.length === 0) {
    return false;
  }

  const matchingEmail = allowedSources.find((s) => s.id === candidate.sourceEmailId);
  if (!matchingEmail) {
    return false;
  }

  return matchingEmail.body.includes(candidate.sourceExcerpt) || matchingEmail.subject.includes(candidate.sourceExcerpt);
}

let nextItemId = 1;
export function createSuggestedItem(candidate: ContextCandidate): ContextItem {
  const id = `item-${Date.now()}-${nextItemId++}`;
  const isOpen = candidate.kind === 'concern' || candidate.kind === 'commitment';

  return {
    id,
    kind: candidate.kind,
    text: candidate.text,
    sourceEmailId: candidate.sourceEmailId,
    sourceExcerpt: candidate.sourceExcerpt,
    review: 'suggested',
    ...(isOpen ? { resolution: 'open' } : {}),
  };
}
