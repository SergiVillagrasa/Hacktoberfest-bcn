import { describe, expect, it } from 'vitest';
import { parseHistoryImport } from './history-import';
import { LocalStorageAnalysisCachePort } from './storage';
const data = { version: 1, clientEmail: 'client@example.test', managerEmail: 'manager@example.test', messages: [
  { id: 'one', senderEmail: 'client@example.test', subject: '', body: 'Question', direction: 'incoming' },
] };

describe('history import boundary', () => {
  it('labels input as imported without inventing dates or trimming excerpts', () => {
    const result = parseHistoryImport(JSON.stringify({ ...data, messages: [{ ...data.messages[0], body: '  Exact excerpt.  ', source: 'gmail' }] }));
    expect(result.messages[0]).toMatchObject({ source: 'demo-import', body: '  Exact excerpt.  ' });
    expect(result.messages[0]).not.toHaveProperty('sentAt');
  });
  it.each(['broken', '{}', JSON.stringify({ ...data, messages: [] }), JSON.stringify({ ...data, messages: Array(51).fill(data.messages[0]) }),
    JSON.stringify({ ...data, messages: [{ ...data.messages[0], sentAt: 'yesterday' }] }),
  ])('rejects malformed or unbounded history', (text) => {
    expect(() => parseHistoryImport(text)).toThrow();
  });
  it('rejects oversized input before parsing', () => {
    expect(() => parseHistoryImport(' '.repeat(1_000_001))).toThrow('1 MB');
  });
  it('persists cache entries separately per client and message', async () => {
    const records: Record<string, unknown> = {};
    const backend = { get: async () => ({ ...records }), set: async (items: Record<string, unknown>) => { Object.assign(records, items); } };
    await new LocalStorageAnalysisCachePort(backend).save('one', 'message', 'signature');
    const reopened = new LocalStorageAnalysisCachePort(backend);
    expect(await reopened.get('one', 'message')).toBe('signature');
    expect(await reopened.get('other', 'message')).toBeUndefined();
    expect(await reopened.get('one', 'other')).toBeUndefined();
  });
});

it('reports Chrome storage quota errors instead of claiming persistence succeeded', async () => {
  const { vi } = await import('vitest');
  vi.stubGlobal('chrome', {
    runtime: { lastError: { message: 'QUOTA_BYTES exceeded' } },
    storage: { local: { set: (_items: unknown, callback: () => void) => callback() } },
  });
  try {
    await expect(new LocalStorageAnalysisCachePort().save('client', 'message', 'signature')).rejects.toThrow('QUOTA_BYTES');
  } finally { vi.unstubAllGlobals(); }
});
