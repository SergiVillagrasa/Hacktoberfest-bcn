import { describe, expect, it } from 'vitest';
import type { ClientProfile, ContextCandidate, EmailContext } from '@briefing/contracts';
import { ClientContextService, computeCoverage, type InferencePort, type ProfilePort, type HistoryPort } from './index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const first: EmailContext = { id: 'one', senderEmail: 'client@example.test', subject: '', body: 'Please explain the fee.', source: 'gmail', direction: 'incoming' };
const second = { ...first, id: 'two', body: 'Please call me tomorrow.' };
function candidate(email: EmailContext): ContextCandidate {
  return { kind: 'concern', text: email.body, sourceEmailId: email.id, sourceExcerpt: email.body, inference: 'offline-fallback' };
}
function setup(inference: InferencePort) {
  let profile: ClientProfile = { id: 'client', email: first.senderEmail, displayName: 'Client', notes: '', items: [] };
  let emails: EmailContext[] = [];
  const profiles: ProfilePort = {
    findByEmail: async (email) => email === profile.email ? structuredClone(profile) : undefined,
    findById: async (id) => id === profile.id ? structuredClone(profile) : undefined,
    save: async (value) => { profile = structuredClone(value); },
  };
  const history: HistoryPort = {
    list: async () => ({ emails: structuredClone(emails), coverage: computeCoverage(emails) }),
    save: async (_, value) => { emails = structuredClone([...value]); },
  };
  const service = new ClientContextService({ profilePort: profiles, historyPort: history, inferencePort: inference });
  return { service, snapshot: () => structuredClone(profile), emails: () => emails };
}

describe('reviewed client state', () => {
  it('merges out-of-order analyses and preserves a review made during inference', async () => {
    const a = deferred<ContextCandidate[]>();
    const b = deferred<ContextCandidate[]>();
    const { service, snapshot } = setup({ extract: ({ email }) => email.id === first.id ? a.promise : b.promise });
    await Promise.all([service.captureEmail(first), service.captureEmail(second)]);
    const profile = snapshot();
    const pendingA = service.analyzeEmail(first, profile);
    const pendingB = service.analyzeEmail(second, profile);
    b.resolve([candidate(second)]);
    await pendingB;
    const saved = snapshot().items[0]!;
    await service.reviewItem(profile.id, saved.id, 'confirmed');
    a.resolve([candidate(first)]);
    await pendingA;
    expect(snapshot().items).toHaveLength(2);
    expect(snapshot().items.find((item) => item.id === saved.id)?.review).toBe('confirmed');
    expect(snapshot().items.every((item) => item.inference === 'offline-fallback')).toBe(true);
    expect((await service.getBriefing(first.senderEmail))?.items.every((item) => item.inference === 'offline-fallback')).toBe(true);
  });

  it('dismisses from active briefing, preserves storage and supports reopening', async () => {
    const { service, snapshot } = setup({ extract: async () => [candidate(first)] });
    await service.captureEmail(first);
    await service.analyzeEmail(first, snapshot());
    const item = snapshot().items[0]!;
    await service.resolveItem('client', item.id);
    expect(snapshot().items[0]?.resolution).toBe('resolved');
    await service.resolveItem('client', item.id, 'open');
    expect(snapshot().items[0]?.resolution).toBe('open');
    await service.reviewItem('client', item.id, 'dismissed');
    expect((await service.getBriefing(first.senderEmail))?.items).toEqual([]);
    expect(snapshot().items[0]?.review).toBe('dismissed');
  });

  it('updates a changed capture and rejects analysis of the old content', async () => {
    const pending = deferred<ContextCandidate[]>();
    const { service, snapshot, emails } = setup({ extract: () => pending.promise });
    await service.captureEmail(first);
    const analysis = service.analyzeEmail(first, snapshot());
    const changed = { ...first, body: 'The fee is explained now.' };
    await service.captureEmail(changed);
    pending.resolve([candidate(first)]);
    await analysis;
    expect(emails()).toEqual([changed]);
    expect(snapshot().items).toEqual([]);
  });
});
