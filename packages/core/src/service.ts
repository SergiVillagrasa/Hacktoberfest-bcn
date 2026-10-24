import type {
  ClientBriefing,
  ClientProfile,
  ContextItem,
  EmailContext,
  HistoryCoverage,
} from '@briefing/contracts';
import type {
  AnalysisResult,
  ClientContextUseCases,
  HistoryPort,
  InferencePort,
  ProfilePort,
} from './index';
import { computeCoverage } from './coverage';
import { createSuggestedItem, validateCandidateEvidence } from './evidence';

export interface ServiceDependencies {
  historyPort: HistoryPort;
  profilePort: ProfilePort;
  inferencePort: InferencePort;
}

// Share the write queue across service instances using the same repository.
const writes = new WeakMap<ProfilePort, Map<string, Promise<unknown>>>();

export class ClientContextService implements ClientContextUseCases {
  constructor(private readonly deps: ServiceDependencies) {}

  async captureEmail(email: EmailContext): Promise<void> {
    const profile = await this.deps.profilePort.findByEmail(email.senderEmail);
    if (!profile) return;

    await this.withClientWrite(profile.id, async () => {
      const { emails } = await this.deps.historyPort.list(profile.id);
      const updated = [email, ...emails.filter((stored) => stored.id !== email.id)];
      await this.deps.historyPort.save(profile.id, updated);
    });
  }

  async importHistory(clientId: string, emails: readonly EmailContext[]): Promise<HistoryCoverage> {
    return this.withClientWrite(clientId, async () => {
      await this.deps.historyPort.save(clientId, emails);
      return computeCoverage(emails);
    });
  }

  async analyzeEmail(email: EmailContext, profile: ClientProfile): Promise<AnalysisResult> {
    // Client isolation check: exact sender email match
    if (email.direction === 'incoming' && email.senderEmail !== profile.email) {
      return { status: 'no-client' };
    }

    const { emails } = await this.deps.historyPort.list(profile.id);
    // Combine currently open email and recorded history as allowed sources
    const allowedSources = [email, ...emails.filter((e) => e.id !== email.id)];

    const candidates = await this.deps.inferencePort.extract({
      email,
      profile,
      sources: allowedSources,
    });

    return this.withClientWrite(profile.id, async () => {
      const latest = await this.deps.profilePort.findByEmail(email.senderEmail);
      if (!latest || latest.id !== profile.id || latest.email !== profile.email) {
        return { status: 'no-client' as const };
      }
      const { emails: currentHistory } = await this.deps.historyPort.list(profile.id);
      // Do not commit results for a source that changed while inference was pending.
      const current = currentHistory.find((stored) => stored.id === email.id);
      if (current && JSON.stringify(current) !== JSON.stringify(email)) {
        return { status: 'analyzed' as const, clientId: profile.id, suggestions: [] };
      }
      const validSuggestions: ContextItem[] = [];
      for (const candidate of candidates) {
        const currentSources = current ? currentHistory : [email, ...currentHistory];
        if (!validateCandidateEvidence(candidate, allowedSources) || !validateCandidateEvidence(candidate, currentSources)) continue;
        const duplicate = latest.items.some((existing) =>
          existing.kind === candidate.kind && existing.sourceEmailId === candidate.sourceEmailId
          && existing.sourceExcerpt === candidate.sourceExcerpt);
        if (!duplicate) validSuggestions.push({ ...createSuggestedItem(candidate), inference: candidate.inference ?? 'unknown' });
      }
      await this.deps.profilePort.save({ ...latest, items: [...latest.items, ...validSuggestions] });
      return { status: 'analyzed' as const, clientId: profile.id, suggestions: validSuggestions };
    });
  }

  async getBriefing(senderEmail: string): Promise<ClientBriefing | undefined> {
    const profile = await this.deps.profilePort.findByEmail(senderEmail);
    if (!profile) return undefined;

    const { coverage, emails } = await this.deps.historyPort.list(profile.id);

    return {
      client: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      },
      coverage,
      items: profile.items.filter((item) => item.review !== 'dismissed' &&
        (!emails.some((email) => email.id === item.sourceEmailId) || validateCandidateEvidence(item, emails))),
    };
  }

  async reviewItem(
    clientId: string,
    itemId: string,
    review: 'confirmed' | 'dismissed'
  ): Promise<void> {
    await this.withClientWrite(clientId, async () => {
      const profile = await this.findProfileById(clientId);
      if (!profile) return;
      await this.deps.profilePort.save({ ...profile, items: profile.items.map((item) =>
        item.id === itemId ? { ...item, review } : item) });
    });
  }

  async resolveItem(clientId: string, itemId: string, resolution: 'open' | 'resolved' = 'resolved'): Promise<void> {
    await this.withClientWrite(clientId, async () => {
      const profile = await this.findProfileById(clientId);
      if (!profile) return;
      await this.deps.profilePort.save({ ...profile, items: profile.items.map((item) =>
        item.id === itemId && (item.kind === 'concern' || item.kind === 'commitment')
          ? { ...item, resolution } : item) });
    });
  }

  private withClientWrite<T>(clientId: string, action: () => Promise<T>): Promise<T> {
    let queue = writes.get(this.deps.profilePort);
    if (!queue) { queue = new Map(); writes.set(this.deps.profilePort, queue); }
    const previous = queue.get(clientId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(action);
    queue.set(clientId, next);
    void next.finally(() => { if (queue!.get(clientId) === next) queue!.delete(clientId); }).catch(() => undefined);
    return next;
  }

  private async findProfileById(clientId: string): Promise<ClientProfile | undefined> {
    if (this.deps.profilePort.findById) {
      return this.deps.profilePort.findById(clientId);
    }
    return undefined;
  }
}
