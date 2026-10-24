export type EmailContext = {
  id: string;
  senderEmail: string;
  recipientEmail?: string;
  subject: string;
  body: string;
  sentAt?: string;
  direction: 'incoming' | 'outgoing';
  source: 'gmail' | 'demo-import';
};

export type SourceEvidence = { sourceEmailId: string; sourceExcerpt: string };
export type ContextKind =
  | 'concern' | 'commitment' | 'goal' | 'preference' | 'communication_signal';
export type ContextCandidate = SourceEvidence & { kind: ContextKind; text: string; inference?: InferenceMode };
export type InferenceMode = 'ollama-live' | 'offline-fallback' | 'unknown';
export type ContextItem = ContextCandidate & {
  id: string;
  review: 'suggested' | 'confirmed' | 'dismissed';
  resolution?: 'open' | 'resolved';
};
export type ClientIdentity = { id: string; email: string; displayName: string };
export type ClientProfile = ClientIdentity & { notes: string; items: ContextItem[] };
export type HistoryCoverage = {
  completeness: 'partial' | 'unknown';
  recordedMessageCount: number;
  importedMessageCount: number;
  earliestSentAt?: string;
  latestSentAt?: string;
};
export type ClientBriefing = {
  client: ClientIdentity;
  coverage: HistoryCoverage;
  items: ContextItem[];
};
export type CaptureClearReason = 'outgoing-message' | 'account-unavailable' | 'message-unreadable';

export type PanelState =
  | { status: 'empty'; reason?: CaptureClearReason | 'capture-disconnected' }
  | { status: 'loading'; requestId: string }
  | { status: 'no-client'; senderEmail: string }
  | { status: 'unavailable'; reason: string }
  | { status: 'ready'; requestId: string; briefing: ClientBriefing };

// Capture is data only. It cannot request profile access or invoke inference.
// Each navigation, including clearing a message, gets a new requestId.
export type CaptureMessage =
  | { type: 'thread/captured'; requestId: string; thread: CapturedThread }
  | { type: 'capture/error'; requestId: string; reason: string }
  | { type: 'email/captured'; requestId: string; email: EmailContext }
  | { type: 'email/cleared'; requestId: string; reason?: CaptureClearReason };

export const HISTORY_IMPORT_LIMITS = { bytes: 1_000_000, messages: 50 } as const;
export type HistoryImport = {
  version: 1;
  clientEmail: string;
  managerEmail: string;
  messages: EmailContext[];
};

export type GmailThreadPreview = Omit<HistoryImport, 'clientEmail'>;

export type CapturedThread = GmailThreadPreview & { threadId: string };

export function isCapturedThread(value: unknown): value is CapturedThread {
  return record(value) && value.version === 1 && bounded(value.threadId, 2000)
    && typeof value.managerEmail === 'string' && validAddress(value.managerEmail)
    && Array.isArray(value.messages) && value.messages.length > 0
    && value.messages.length <= HISTORY_IMPORT_LIMITS.messages
    && value.messages.every((email) => isEmailContext(email) && email.source === 'gmail')
    && new TextEncoder().encode(JSON.stringify(value)).length <= HISTORY_IMPORT_LIMITS.bytes;
}

export function isGmailThreadPreview(value: unknown): value is GmailThreadPreview {
  return record(value) && value.version === 1
    && typeof value.managerEmail === 'string' && validAddress(value.managerEmail)
    && Array.isArray(value.messages) && value.messages.length > 0
    && value.messages.length <= HISTORY_IMPORT_LIMITS.messages
    && value.messages.every((email) => isEmailContext(email) && email.source === 'demo-import');
}

export function isHistoryImport(value: unknown): value is HistoryImport {
  return record(value) && value.version === 1
    && typeof value.clientEmail === 'string' && validAddress(value.clientEmail)
    && typeof value.managerEmail === 'string' && validAddress(value.managerEmail)
    && Array.isArray(value.messages) && value.messages.length > 0
    && value.messages.length <= HISTORY_IMPORT_LIMITS.messages
    && value.messages.every((email) => isEmailContext(email) && email.source === 'demo-import');
}

function validAddress(value: string): boolean {
  return value.length <= 320 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

export const EMAIL_LIMITS = { id: 256, address: 320, subject: 1_000, body: 100_000 } as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bounded(value: unknown, max: number, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);
}

export function isEmailContext(value: unknown): value is EmailContext {
  if (!record(value)) return false;
  return bounded(value.id, EMAIL_LIMITS.id)
    && bounded(value.senderEmail, EMAIL_LIMITS.address)
    && validAddress(value.senderEmail)
    && (value.recipientEmail === undefined || (typeof value.recipientEmail === 'string' && validAddress(value.recipientEmail)))
    && bounded(value.subject, EMAIL_LIMITS.subject, true)
    && bounded(value.body, EMAIL_LIMITS.body)
    && (value.sentAt === undefined || (
      bounded(value.sentAt, 40)
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value.sentAt)
      && Number.isFinite(Date.parse(value.sentAt))
    ))
    && (value.direction === 'incoming' || value.direction === 'outgoing')
    && (value.source === 'gmail' || value.source === 'demo-import');
}

export function isCaptureMessage(value: unknown): value is CaptureMessage {
  if (!record(value) || !bounded(value.requestId, EMAIL_LIMITS.id)) return false;
  if (value.type === 'thread/captured') return isCapturedThread(value.thread);
  if (value.type === 'capture/error') return bounded(value.reason, 1000);
  if (value.type === 'email/cleared') return value.reason === undefined
    || value.reason === 'outgoing-message' || value.reason === 'account-unavailable' || value.reason === 'message-unreadable';
  return value.type === 'email/captured'
    && isEmailContext(value.email)
    && value.email.source === 'gmail'
    && value.email.direction === 'incoming';
}
