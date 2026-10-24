export type {
  ClientBriefing,
  ClientIdentity,
  ClientProfile,
  ContextCandidate,
  ContextItem,
  ContextKind,
  EmailContext,
  HistoryCoverage,
  HistoryImport,
  PanelState,
} from '@briefing/contracts';

import type {
  ClientBriefing,
  ClientProfile,
  ContextCandidate,
  ContextItem,
  EmailContext,
  HistoryCoverage,
  HistoryImport,
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
  findById?(clientId: string): Promise<ClientProfile | undefined>;
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

export interface AnalysisCachePort {
  get(clientId: string, emailId: string): Promise<string | undefined>;
  save(clientId: string, emailId: string, signature: string): Promise<void>;
}

export type AnalysisResult =
  | { status: 'no-client' }
  | { status: 'analyzed'; clientId: string; suggestions: ContextItem[]; cached?: boolean };

// Handlers invoke one core action per interaction; adapters implement injected ports.
export interface ClientContextUseCases {
  captureEmail(email: EmailContext): Promise<void>;
  importHistory(clientId: string, emails: readonly EmailContext[]): Promise<HistoryCoverage>;
  importGmailThread(data: HistoryImport): Promise<{ briefing: ClientBriefing; emails: EmailContext[] }>;
  importClientHistory(clientId: string, data: HistoryImport): Promise<{ briefing: ClientBriefing; emails: EmailContext[] }>;
  analyzeEmail(email: EmailContext, profile: ClientProfile): Promise<AnalysisResult>;
  getBriefing(senderEmail: string): Promise<ClientBriefing | undefined>;
  reviewItem(clientId: string, itemId: string, review: 'confirmed' | 'dismissed'): Promise<void>;
  resolveItem(clientId: string, itemId: string, resolution?: 'open' | 'resolved'): Promise<void>;
}

export * from './coverage';
export * from './evidence';
export * from './service';
