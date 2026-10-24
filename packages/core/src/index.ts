import type {
  ClientBriefing, ClientProfile, ContextCandidate, ContextItem, EmailContext, HistoryCoverage,
} from '@briefing/contracts';

// Exact matching is an application rule. Never fall back to the last client.
export function matchClient(senderEmail: string, profiles: readonly ClientProfile[]): ClientProfile | undefined {
  return profiles.find((profile) => profile.email === senderEmail);
}

export interface HistoryPort {
  list(clientId: string): Promise<{ emails: EmailContext[]; coverage: HistoryCoverage }>;
  save(clientId: string, emails: readonly EmailContext[]): Promise<void>;
}

export interface ProfilePort {
  findByEmail(senderEmail: string): Promise<ClientProfile | undefined>;
  save(profile: ClientProfile): Promise<void>;
}

// The model supplies candidates only; core assigns IDs, review state and validates evidence.
export interface InferencePort {
  extract(input: {
    email: EmailContext;
    profile: ClientProfile;
    sources: readonly EmailContext[];
  }): Promise<ContextCandidate[]>;
}

export type AnalysisResult =
  | { status: 'no-client' }
  | { status: 'analyzed'; clientId: string; suggestions: ContextItem[] };

// These are integration signatures, not implemented services.
// Handlers invoke one method per action. Core implementations use injected ports.
export interface ClientContextUseCases {
  captureEmail(email: EmailContext): Promise<void>;
  importHistory(clientId: string, emails: readonly EmailContext[]): Promise<HistoryCoverage>;
  analyzeEmail(email: EmailContext, profile: ClientProfile): Promise<AnalysisResult>;
  getBriefing(senderEmail: string): Promise<ClientBriefing | undefined>;
  reviewItem(clientId: string, itemId: string, review: 'confirmed' | 'dismissed'): Promise<void>;
  resolveItem(clientId: string, itemId: string): Promise<void>;
}
