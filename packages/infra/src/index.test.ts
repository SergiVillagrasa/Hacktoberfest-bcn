import { describe, expect, it } from 'vitest';
import {
  LocalStorageHistoryPort,
  LocalStorageProfilePort,
} from './index';
import { SAMPLE_CLIENT, SAMPLE_HISTORICAL_EMAILS } from './test-fixtures';

describe('LocalStorageProfilePort & HistoryPort', () => {
  it('saves and finds profile by email and id', async () => {
    const profilePort = new LocalStorageProfilePort();
    await profilePort.save(SAMPLE_CLIENT);

    const byEmail = await profilePort.findByEmail(SAMPLE_CLIENT.email);
    expect(byEmail).toBeDefined();
    expect(byEmail?.displayName).toBe(SAMPLE_CLIENT.displayName);

    const byId = await profilePort.findById(SAMPLE_CLIENT.id);
    expect(byId).toBeDefined();
    expect(byId?.id).toBe(SAMPLE_CLIENT.id);
  });

  it('saves and lists emails with computed history coverage', async () => {
    const historyPort = new LocalStorageHistoryPort();
    await historyPort.save(SAMPLE_CLIENT.id, SAMPLE_HISTORICAL_EMAILS);

    const { emails, coverage } = await historyPort.list(SAMPLE_CLIENT.id);
    expect(emails).toHaveLength(3);
    expect(coverage.recordedMessageCount).toBe(3);
    expect(coverage.importedMessageCount).toBe(3);
    expect(coverage.earliestSentAt).toBe('2026-10-15T09:30:00Z');
    expect(coverage.latestSentAt).toBe('2026-10-20T16:45:00Z');
  });
});

describe('legacy scripted-data cleanup', () => {
  it('removes scripted and fallback facts through both lookup keys while keeping reviewed model results', async () => {
    const port = new LocalStorageProfilePort();
    const base = {
      id: 'model-item', kind: 'goal' as const, text: 'A model result',
      sourceEmailId: 'captured-1', sourceExcerpt: 'A goal', review: 'confirmed' as const,
    };
    await port.save({ ...SAMPLE_CLIENT, items: [
      { ...base, inference: 'ollama-live' },
      { ...base, id: 'fallback-item', inference: 'offline-fallback' },
      { ...base, id: 'init-item-1' },
      { ...base, id: 'model-from-seed', sourceEmailId: 'sergi-msg-01', inference: 'ollama-live' },
    ] });
    expect((await port.findById(SAMPLE_CLIENT.id))?.items).toEqual([
      { ...base, inference: 'ollama-live' },
    ]);
    expect((await port.findByEmail(SAMPLE_CLIENT.email))?.items).toHaveLength(1);
  });

  it('deletes bundled history while preserving captured messages and explicit imports', async () => {
    const port = new LocalStorageHistoryPort();
    const email = SAMPLE_HISTORICAL_EMAILS[0]!;
    await port.save('client', [
      { ...email, id: 'm-rovira-01' },
      { ...email, id: 'sergi-msg-01' },
      { ...email, id: 'real-capture', source: 'gmail' },
      { ...email, id: 'explicit-import' },
    ]);
    const { emails } = await port.list('client');
    expect(emails.map((item) => item.id)).toEqual(['real-capture', 'explicit-import']);
    expect((await port.list('client')).emails).toEqual(emails);
  });
});

it('runs legacy cleanup once so a later explicit import may reuse the old fixture IDs', async () => {
  const history = new LocalStorageHistoryPort();
  await history.list('client');
  await history.save('client', [{ ...SAMPLE_HISTORICAL_EMAILS[0]!, id: 'sergi-msg-01' }]);
  expect((await history.list('client')).emails).toHaveLength(1);
});
