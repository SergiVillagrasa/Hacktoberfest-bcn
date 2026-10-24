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

export class ClientContextService implements ClientContextUseCases {
  constructor(private readonly deps: ServiceDependencies) {}

  async captureEmail(email: EmailContext): Promise<void> {
    const profile = await this.deps.profilePort.findByEmail(email.senderEmail);
    if (!profile) return;

    const { emails } = await this.deps.historyPort.list(profile.id);
    if (emails.some((e) => e.id === email.id)) return;

    const updated = [email, ...emails];
    await this.deps.historyPort.save(profile.id, updated);
  }

  async importHistory(clientId: string, emails: readonly EmailContext[]): Promise<HistoryCoverage> {
    const coverage = computeCoverage(emails);
    await this.deps.historyPort.save(clientId, emails);
    return coverage;
  }

  async analyzeEmail(email: EmailContext, profile: ClientProfile): Promise<AnalysisResult> {
    // Client isolation check: exact sender email match
    if (email.direction === 'incoming' && email.senderEmail !== profile.email) {
      return { status: 'no-client' };
    }

    // Optimization: If this email has already been analyzed and produced items, return cached analysis immediately
    if (profile.items.some((item) => item.sourceEmailId === email.id)) {
      return {
        status: 'analyzed',
        clientId: profile.id,
        suggestions: [],
      };
    }

    const { emails } = await this.deps.historyPort.list(profile.id);
    // Combine currently open email and recorded history as allowed sources
    const allowedSources = [email, ...emails.filter((e) => e.id !== email.id)];

    const candidates = await this.deps.inferencePort.extract({
      email,
      profile,
      sources: allowedSources,
    });

    const validSuggestions: ContextItem[] = [];
    for (const candidate of candidates) {
      if (validateCandidateEvidence(candidate, allowedSources)) {
        // Prevent exact duplicate items
        const isDuplicate = profile.items.some(
          (existing: ContextItem) =>
            existing.kind === candidate.kind &&
            existing.sourceEmailId === candidate.sourceEmailId &&
            existing.sourceExcerpt === candidate.sourceExcerpt
        );
        if (!isDuplicate) {
          validSuggestions.push(createSuggestedItem(candidate));
        }
      }
    }

    const updatedProfile: ClientProfile = {
      ...profile,
      items: [...profile.items, ...validSuggestions],
    };

    await this.deps.profilePort.save(updatedProfile);

    return {
      status: 'analyzed',
      clientId: profile.id,
      suggestions: validSuggestions,
    };
  }

  async getBriefing(senderEmail: string): Promise<ClientBriefing | undefined> {
    const profile = await this.deps.profilePort.findByEmail(senderEmail);
    if (!profile) return undefined;

    const { coverage } = await this.deps.historyPort.list(profile.id);

    return {
      client: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      },
      coverage,
      items: profile.items,
    };
  }

  async reviewItem(
    clientId: string,
    itemId: string,
    review: 'confirmed' | 'dismissed'
  ): Promise<void> {
    const profile = await this.findProfileById(clientId);
    if (!profile) return;

    const updatedItems = profile.items.map((item: ContextItem) =>
      item.id === itemId ? { ...item, review } : item
    );

    await this.deps.profilePort.save({
      ...profile,
      items: updatedItems,
    });
  }

  async resolveItem(clientId: string, itemId: string): Promise<void> {
    const profile = await this.findProfileById(clientId);
    if (!profile) return;

    const updatedItems = profile.items.map((item: ContextItem) =>
      item.id === itemId ? { ...item, resolution: 'resolved' as const } : item
    );

    await this.deps.profilePort.save({
      ...profile,
      items: updatedItems,
    });
  }

  private async findProfileById(clientId: string): Promise<ClientProfile | undefined> {
    if (this.deps.profilePort.findById) {
      return this.deps.profilePort.findById(clientId);
    }
    return undefined;
  }
}
