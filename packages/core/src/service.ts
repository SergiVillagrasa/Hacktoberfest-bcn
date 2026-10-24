import type {
  ClientBriefing,
  ClientProfile,
  ContextItem,
  EmailContext,
  HistoryCoverage,
  HistoryImport,
} from '@briefing/contracts';
import type {
  AnalysisResult,
  AnalysisCachePort,
  ClientContextUseCases,
  HistoryPort,
  InferencePort,
  ProfilePort,
} from './index';
import { isEmailContext, isHistoryImport } from '@briefing/contracts';
import { ANALYSIS_REVISION, analysisSignature, messageContent } from './analysis-cache';
import { computeCoverage } from './coverage';
import { createSuggestedItem, validateCandidateEvidence } from './evidence';

export interface ServiceDependencies {
  historyPort: HistoryPort;
  profilePort: ProfilePort;
  inferencePort: InferencePort;
  cachePort?: AnalysisCachePort;
  analysisRevision?: string;
}

// Share the write queue across service instances using the same repository.
const writes = new WeakMap<ProfilePort, Map<string, Promise<unknown>>>();

export class ClientContextService implements ClientContextUseCases {
  private readonly pending = new Map<string, Promise<AnalysisResult>>();
  constructor(private readonly deps: ServiceDependencies) {}

  async registerClient(senderEmail: string): Promise<void> {
    const email = senderEmail.trim().toLowerCase();
    if (!isEmailContext({ id: 'registration', senderEmail: email, subject: '', body: 'registration', direction: 'incoming', source: 'gmail' })) {
      throw new Error('Invalid client email address.');
    }
    if (await this.deps.profilePort.findByEmail(email)) return;
    await this.deps.profilePort.save({ id: crypto.randomUUID(), email, displayName: email, notes: '', items: [] });
  }

  async openEmail(email: EmailContext): Promise<{ briefing: ClientBriefing; emails: EmailContext[]; cached: boolean } | undefined> {
    const profile = await this.deps.profilePort.findByEmail(email.senderEmail);
    if (!profile) return undefined;
    await this.captureEmail(email);
    const result = await this.analyzeEmail(email, profile);
    if (result.status === 'no-client') return undefined;
    const briefing = await this.getBriefing(profile.email);
    if (!briefing) return undefined;
    const { emails } = await this.deps.historyPort.list(profile.id);
    return { briefing, emails, cached: result.cached === true };
  }

  async readClient(senderEmail: string): Promise<{ briefing: ClientBriefing; emails: EmailContext[] } | undefined> {
    const briefing = await this.getBriefing(senderEmail);
    if (!briefing) return undefined;
    const { emails } = await this.deps.historyPort.list(briefing.client.id);
    return { briefing, emails };
  }

  async importClientHistory(clientId: string, data: HistoryImport): Promise<{ briefing: ClientBriefing; emails: EmailContext[] }> {
    const profile = await this.findProfileById(clientId);
    if (!profile) throw new Error('Client unavailable.');
    this.validateHistoryImport(data, profile.email);
    await this.mergeHistory(clientId, data.messages);
    const result = await this.readClient(profile.email);
    if (!result) throw new Error('Client unavailable.');
    return result;
  }

  private validateHistoryImport(data: HistoryImport, clientEmail: string): void {
    if (!isHistoryImport(data)) throw new Error('Invalid history: check the JSON format and limits.');
    if (data.clientEmail !== clientEmail || data.managerEmail === clientEmail) {
      throw new Error('The file’s client does not match the selected client.');
    }
    const ids = new Set<string>();
    for (const email of data.messages) {
      if (ids.has(email.id)) throw new Error('The file contains duplicate message IDs.');
      ids.add(email.id);
      const owned = email.direction === 'incoming'
        ? email.senderEmail === clientEmail && (!email.recipientEmail || email.recipientEmail === data.managerEmail)
        : email.senderEmail === data.managerEmail && email.recipientEmail === clientEmail;
      if (!owned) throw new Error('A message does not belong to the declared client or manager.');
    }
  }

  async importGmailThread(data: HistoryImport): Promise<{ briefing: ClientBriefing; emails: EmailContext[] }> {
    this.validateHistoryImport(data, data.clientEmail);
    await this.registerClient(data.clientEmail);
    const profile = await this.deps.profilePort.findByEmail(data.clientEmail);
    if (!profile) throw new Error('Client unavailable.');
    return this.importClientHistory(profile.id, data);
  }

  async analyzeHistory(clientId: string): Promise<{ briefing: ClientBriefing; analyzed: number; cached: number }> {
    const profile = await this.findProfileById(clientId);
    if (!profile) throw new Error('Client unavailable.');
    const { emails } = await this.deps.historyPort.list(clientId);
    let analyzed = 0;
    let cached = 0;
    for (const email of emails) {
      const result = await this.analyzeEmail(email, profile);
      if (result.status === 'analyzed') result.cached ? cached++ : analyzed++;
    }
    const briefing = await this.getBriefing(profile.email);
    if (!briefing) throw new Error('Client unavailable.');
    return { briefing, analyzed, cached };
  }

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
    const profile = await this.findProfileById(clientId);
    if (!profile || emails.some((email) => !isEmailContext(email) || email.source !== 'demo-import'
      || email.direction !== 'incoming' || email.senderEmail !== profile.email)) {
      throw new Error('To import replies, include the client, manager and recipients.');
    }
    return this.mergeHistory(clientId, emails);
  }

  private async mergeHistory(clientId: string, emails: readonly EmailContext[]): Promise<HistoryCoverage> {
    return this.withClientWrite(clientId, async () => {
      const { emails: stored } = await this.deps.historyPort.list(clientId);
      const merged = new Map(stored.map((email) => [email.id, email]));
      for (const email of emails) {
        const existing = merged.get(email.id);
        if (existing && messageContent(existing) !== messageContent(email)) {
          throw new Error(`Message ID ${email.id} already exists with different content. Nothing was imported.`);
        }
        if (!existing) merged.set(email.id, email);
      }
      const result = [...merged.values()];
      await this.deps.historyPort.save(clientId, result);
      return computeCoverage(result);
    });
  }

  async analyzeEmail(email: EmailContext, profile: ClientProfile): Promise<AnalysisResult> {
    const registered = await this.deps.profilePort.findByEmail(profile.email);
    if (!registered || registered.id !== profile.id || !this.ownsEmail(email, profile)) return { status: 'no-client' };
    const { emails } = await this.deps.historyPort.list(profile.id);
    if (email.direction === 'outgoing' && !emails.some((stored) => messageContent(stored) === messageContent(email))) {
      return { status: 'no-client' };
    }
    const allowedSources = [email, ...emails.filter((source) => source.id !== email.id && this.ownsEmail(source, profile))];
    const signature = await analysisSignature(profile, allowedSources, email.id, this.deps.analysisRevision ?? ANALYSIS_REVISION);
    const pendingKey = JSON.stringify([profile.id, email.id, signature]);
    const pending = this.pending.get(pendingKey);
    if (pending) return pending;
    const task = this.extractAndStore(email, profile, allowedSources, signature);
    this.pending.set(pendingKey, task);
    try { return await task; } finally { this.pending.delete(pendingKey); }
  }

  private ownsEmail(email: EmailContext, profile: ClientProfile): boolean {
    return email.direction === 'incoming' ? email.senderEmail === profile.email
      : email.source === 'demo-import' && email.recipientEmail === profile.email && email.senderEmail !== profile.email;
  }

  private async extractAndStore(email: EmailContext, profile: ClientProfile, allowedSources: EmailContext[], signature: string): Promise<AnalysisResult> {
    if (await this.deps.cachePort?.get(profile.id, email.id) === signature) {
      return { status: 'analyzed', clientId: profile.id, suggestions: [], cached: true };
    }
    const candidates = await this.deps.inferencePort.extract({
      email,
      profile,
      sources: allowedSources,
    });

    return this.withClientWrite(profile.id, async () => {
      const latest = await this.deps.profilePort.findByEmail(profile.email);
      if (!latest || latest.id !== profile.id || latest.email !== profile.email) {
        return { status: 'no-client' as const };
      }
      const { emails: currentHistory } = await this.deps.historyPort.list(profile.id);
      // Do not commit results for a source that changed while inference was pending.
      const current = currentHistory.find((stored) => stored.id === email.id);
      if (current && (messageContent(current) !== messageContent(email) || current.source !== email.source)) {
        return { status: 'analyzed' as const, clientId: profile.id, suggestions: [] };
      }
      const currentSources = [email, ...currentHistory.filter((source) => source.id !== email.id && this.ownsEmail(source, profile))];
      if (await analysisSignature(latest, currentSources, email.id, this.deps.analysisRevision ?? ANALYSIS_REVISION) !== signature) {
        return { status: 'analyzed' as const, clientId: profile.id, suggestions: [] };
      }
      const validSuggestions: ContextItem[] = [];
      let rejectedEvidence = false;
      for (const candidate of candidates) {
        if (!validateCandidateEvidence(candidate, allowedSources) || !validateCandidateEvidence(candidate, currentSources)) {
          rejectedEvidence = true;
          continue;
        }
        const duplicate = latest.items.some((existing) =>
          existing.kind === candidate.kind && existing.sourceEmailId === candidate.sourceEmailId
          && existing.sourceExcerpt === candidate.sourceExcerpt);
        if (!duplicate) validSuggestions.push({ ...createSuggestedItem(candidate), inference: candidate.inference ?? 'unknown' });
      }
      await this.deps.profilePort.save({ ...latest, items: [...latest.items, ...validSuggestions] });
      if (!rejectedEvidence) await this.deps.cachePort?.save(profile.id, email.id, signature);
      return { status: 'analyzed' as const, clientId: profile.id, suggestions: validSuggestions, cached: false };
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
