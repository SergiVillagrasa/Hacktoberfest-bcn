import { describe, expect, it, vi } from 'vitest';
import type { ClientProfile, ContextCandidate, EmailContext, HistoryImport } from '@briefing/contracts';
import { ClientContextService, computeCoverage, type AnalysisCachePort, type HistoryPort, type ProfilePort } from './index';

const incoming: EmailContext = { id: 'in-1', senderEmail: 'client@example.test', subject: 'Question',
  body: 'Please explain the fee.', direction: 'incoming', source: 'demo-import' };
const outgoing: EmailContext = { id: 'out-1', senderEmail: 'manager@example.test', recipientEmail: incoming.senderEmail,
  subject: 'Reply', body: 'I will explain the fee tomorrow.', direction: 'outgoing', source: 'demo-import' };
const envelope: HistoryImport = { version: 1, clientEmail: incoming.senderEmail,
  managerEmail: outgoing.senderEmail, messages: [incoming, outgoing] };
function setup() {
  const profiles = new Map<string, ClientProfile>();
  profiles.set('client', { id: 'client', email: incoming.senderEmail, displayName: 'Client', notes: '', items: [] });
  const history = new Map<string, EmailContext[]>();
  const cache = new Map<string, string>();
  const profilePort: ProfilePort = {
    findByEmail: async (email) => structuredClone([...profiles.values()].find((profile) => profile.email === email)),
    findById: async (id) => structuredClone(profiles.get(id)),
    save: async (profile) => { profiles.set(profile.id, structuredClone(profile)); },
  };
  const historyPort: HistoryPort = {
    list: async (id) => { const emails = structuredClone(history.get(id) ?? []); return { emails, coverage: computeCoverage(emails) }; },
    save: async (id, emails) => { history.set(id, structuredClone([...emails])); },
  };
  const cachePort: AnalysisCachePort = {
    get: async (id, emailId) => cache.get(JSON.stringify([id, emailId])),
    save: async (id, emailId, signature) => { cache.set(JSON.stringify([id, emailId]), signature); },
  };
  const extract = vi.fn(async ({ email }: { email: EmailContext }): Promise<ContextCandidate[]> => [{
    kind: email.direction === 'outgoing' ? 'commitment' : 'concern', text: email.body,
    sourceEmailId: email.id, sourceExcerpt: email.body, inference: 'ollama-live',
  }]);
  const deps = { profilePort, historyPort, cachePort, inferencePort: { extract } };
  const service = new ClientContextService(deps);
  return { service, deps, extract, profiles, history, cache, profile: () => structuredClone(profiles.get('client')!) };
}

describe('explicit client history import', () => {
  it('merges manager replies, preserves captures, deduplicates imports and requires separate analysis', async () => {
    const { service, history, extract } = setup();
    await service.captureEmail({ ...incoming, id: 'gmail-1', source: 'gmail' });
    await service.importClientHistory('client', envelope);
    await service.importClientHistory('client', envelope);
    expect(history.get('client')).toHaveLength(3);
    expect(extract).not.toHaveBeenCalled();
    const result = await service.analyzeHistory('client');
    expect(result.analyzed).toBe(3);
    expect(result.briefing.items.find((item) => item.sourceEmailId === outgoing.id)).toMatchObject({
      review: 'suggested', kind: 'commitment', sourceExcerpt: outgoing.body,
    });
    expect(result.briefing.coverage.importedMessageCount).toBe(2);
  });

  it.each([
    { ...envelope, clientEmail: 'other@example.test' },
    { ...envelope, messages: [{ ...incoming, senderEmail: 'other@example.test' }] },
    { ...envelope, messages: [{ ...outgoing, recipientEmail: 'other@example.test' }] },
    { ...envelope, messages: [{ ...outgoing, senderEmail: 'other@example.test' }] },
    { ...envelope, messages: [{ ...outgoing, recipientEmail: undefined }] },
    { ...envelope, messages: [incoming, incoming] },
    { ...envelope, messages: [{ ...incoming, body: '' }] },
  ])('rejects invalid ownership or messages without partial writes', async (data) => {
    const { service, history } = setup();
    await expect(service.importClientHistory('client', data as HistoryImport)).rejects.toThrow();
    expect(history.size).toBe(0);
  });

  it('registers a client explicitly when importing a valid expanded thread without inference', async () => {
    const { service, extract, profiles } = setup();
    profiles.clear();
    const result = await service.importGmailThread(envelope);
    expect(result.emails).toHaveLength(2);
    expect(result.briefing.items).toEqual([]);
    expect(result.briefing.client.email).toBe(incoming.senderEmail);
    expect(extract).not.toHaveBeenCalled();
  });

  it('does not register a client for an invalid mixed-participant thread', async () => {
    const { service, profiles } = setup();
    profiles.clear();
    await expect(service.importGmailThread({ ...envelope, messages: [incoming, { ...outgoing, recipientEmail: 'other@example.test' }] })).rejects.toThrow();
    expect(profiles.size).toBe(0);
  });

  it('rejects a conflicting source ID atomically', async () => {
    const { service, history } = setup();
    await service.importClientHistory('client', envelope);
    const before = structuredClone(history.get('client'));
    await expect(service.importClientHistory('client', { ...envelope, messages: [
      { ...incoming, id: 'new' }, { ...outgoing, body: 'Changed promise' },
    ] })).rejects.toThrow('different content');
    expect(history.get('client')).toEqual(before);
  });
});

describe('successful-analysis cache', () => {
  it('persists across service instances and preserves reviews and resolution', async () => {
    const { service, deps, extract, profile } = setup();
    await service.importClientHistory('client', envelope);
    await service.analyzeHistory('client');
    const item = profile().items.find((item) => item.kind === 'commitment')!;
    await service.reviewItem('client', item.id, 'dismissed');
    await service.resolveItem('client', item.id, 'resolved');
    const reopened = new ClientContextService(deps);
    expect((await reopened.analyzeHistory('client')).cached).toBe(2);
    expect(extract).toHaveBeenCalledTimes(2);
    expect(profile().items.find((stored) => stored.id === item.id)).toMatchObject({ review: 'dismissed', resolution: 'resolved' });
  });

  it('invalidates for changed message, history and analysis revision', async () => {
    const { service, deps, extract, profile } = setup();
    const email = { ...incoming, source: 'gmail' as const };
    await service.openEmail(email);
    expect((await service.openEmail(email))?.cached).toBe(true);
    await service.openEmail({ ...email, body: 'A changed question.' });
    await service.importClientHistory('client', { ...envelope, messages: [outgoing] });
    await service.analyzeEmail({ ...email, body: 'A changed question.' }, profile());
    await new ClientContextService({ ...deps, analysisRevision: 'new-prompt' }).analyzeEmail({ ...email, body: 'A changed question.' }, profile());
    expect(extract).toHaveBeenCalledTimes(4);
  });

  it('caches a valid empty result and retries failures', async () => {
    const { service, extract } = setup();
    extract.mockRejectedValueOnce(new Error('Offline'));
    await expect(service.openEmail(incoming)).rejects.toThrow('Offline');
    extract.mockResolvedValue([]);
    await service.openEmail(incoming);
    expect((await service.openEmail(incoming))?.cached).toBe(true);
    expect(extract).toHaveBeenCalledTimes(2);
  });

  it('accepts identical messages after storage changes object key order', async () => {
    const { service, history, profile, extract } = setup();
    const reordered = Object.fromEntries(Object.entries(incoming).reverse()) as EmailContext;
    history.set('client', [reordered]);
    const result = await service.analyzeEmail(incoming, profile());
    expect(result.status === 'analyzed' && result.suggestions).toHaveLength(1);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('retries observations with unsupported evidence instead of caching them', async () => {
    const { service, extract } = setup();
    extract.mockResolvedValue([{ kind: 'concern', text: 'Unsupported', sourceEmailId: incoming.id,
      sourceExcerpt: 'Not in the message', inference: 'ollama-live' }]);
    await service.openEmail(incoming);
    expect((await service.openEmail(incoming))?.cached).toBe(false);
    expect(extract).toHaveBeenCalledTimes(2);
  });

  it('coalesces overlapping requests for the same snapshot', async () => {
    const { service, extract, profile } = setup();
    let release!: (value: ContextCandidate[]) => void;
    extract.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const a = service.analyzeEmail(incoming, profile());
    const b = service.analyzeEmail(incoming, profile());
    await vi.waitFor(() => expect(extract).toHaveBeenCalledTimes(1));
    release([]);
    await Promise.all([a, b]);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('never uses another client’s cache or analyzes an unimported manager reply', async () => {
    const { service, extract, profile, profiles } = setup();
    await service.openEmail(incoming);
    expect(await service.analyzeEmail(outgoing, profile())).toEqual({ status: 'no-client' });
    profiles.set('other', { ...profile(), id: 'other', email: 'other@example.test', items: [] });
    await service.openEmail({ ...incoming, senderEmail: 'other@example.test' });
    expect(extract).toHaveBeenCalledTimes(2);
  });

  it('does not commit or cache inference when history changes in flight', async () => {
    const { service, extract, profile, cache } = setup();
    let release!: (value: ContextCandidate[]) => void;
    extract.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const pending = service.analyzeEmail(incoming, profile());
    await vi.waitFor(() => expect(extract).toHaveBeenCalledTimes(1));
    await service.importClientHistory('client', envelope);
    release([{ kind: 'concern', text: incoming.body, sourceEmailId: incoming.id, sourceExcerpt: incoming.body }]);
    await pending;
    expect(profile().items).toEqual([]);
    expect(cache.size).toBe(0);
  });
});


describe('automatic open-thread context', () => {
  const thread = { version: 1 as const, threadId: 'https://mail.google.com/#inbox/thread', managerEmail: outgoing.senderEmail,
    messages: [incoming, outgoing].map((email) => ({ ...email, source: 'gmail' as const })) };

  it('stores both directions, analyzes once, and preserves reviewed results on reopen', async () => {
    const { service, history, extract, profile } = setup();
    const first = await service.openThread(thread);
    expect(first.status).toBe('ready');
    expect(history.get('client')).toHaveLength(2);
    expect(history.get('client')?.every((email) => email.source === 'gmail')).toBe(true);
    const promise = profile().items.find((item) => item.kind === 'commitment')!;
    await service.reviewItem('client', promise.id, 'confirmed');
    const second = await service.openThread(thread);
    expect(second.status === 'ready' && second.cached).toBe(2);
    expect(extract).toHaveBeenCalledTimes(2);
    expect(profile().items.find((item) => item.id === promise.id)?.review).toBe('confirmed');
    expect(history.get('client')).toHaveLength(2);
  });

  it('updates changed captures without adding a second copy', async () => {
    const { service, history, extract } = setup();
    await service.openThread(thread);
    await service.openThread({ ...thread, messages: thread.messages.map((email) => email.id === incoming.id ? { ...email, body: 'Changed question' } : email) });
    expect(history.get('client')).toHaveLength(2);
    expect(history.get('client')?.find((email) => email.id === incoming.id)?.body).toBe('Changed question');
    expect(extract).toHaveBeenCalledTimes(4);
  });

  it('does not save or infer an unknown client until registration', async () => {
    const { service, profiles, history, extract } = setup();
    profiles.clear();
    expect(await service.openThread(thread)).toEqual({ status: 'no-client', senderEmail: incoming.senderEmail });
    expect(history.size).toBe(0);
    expect(extract).not.toHaveBeenCalled();
    await service.registerClient(incoming.senderEmail);
    expect((await service.openThread(thread)).status).toBe('ready');
  });

  it('rejects mixed participants and missing recipients before saving', async () => {
    const { service, history, extract } = setup();
    await expect(service.openThread({ ...thread, messages: [...thread.messages, { ...thread.messages[0]!, id: 'other', senderEmail: 'other@example.test' }] })).rejects.toThrow('multiple external');
    await expect(service.openThread({ ...thread, messages: [{ ...thread.messages[1]!, recipientEmail: undefined }] } as never)).rejects.toThrow('recipient');
    expect(history.size).toBe(0);
    expect(extract).not.toHaveBeenCalled();
  });

  it('keeps captured history and exposes errors when Ollama is offline, then retries', async () => {
    const { service, history, extract } = setup();
    extract.mockRejectedValueOnce(new Error('Offline'));
    const result = await service.openThread(thread);
    expect(result.status === 'ready' && result.analysisError).toBe('Offline');
    expect(history.get('client')).toHaveLength(2);
    expect((await service.openThread(thread)).status).toBe('ready');
    expect(extract).toHaveBeenCalledTimes(3);
  });
});
