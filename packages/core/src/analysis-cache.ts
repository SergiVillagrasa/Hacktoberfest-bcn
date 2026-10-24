import type { ClientProfile, EmailContext } from '@briefing/contracts';

// Bump when model, prompt, parsing or evidence policy changes.
export const ANALYSIS_REVISION = 'qwen3:1.7b-history-v4-english-current-source';

export function messageContent(email: EmailContext): string {
  return JSON.stringify([email.id, email.senderEmail, email.recipientEmail ?? null,
    email.subject, email.body, email.sentAt ?? null, email.direction]);
}

export async function analysisSignature(
  profile: ClientProfile, sources: readonly EmailContext[], emailId: string, revision: string,
): Promise<string> {
  const content = JSON.stringify([revision, profile.id, profile.email, profile.displayName,
    emailId, sources.map((email) => [messageContent(email), email.source]).sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
