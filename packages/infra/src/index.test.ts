import { describe, expect, it } from 'vitest';
import {
  LocalStorageHistoryPort,
  LocalStorageProfilePort,
  OllamaInferenceAdapter,
  SAMPLE_CLIENT,
  SAMPLE_CURRENT_EMAIL,
  SAMPLE_HISTORICAL_EMAILS,
} from './index';

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

describe('OllamaInferenceAdapter', () => {
  it('extracts observations with exact excerpts in fallback mode', async () => {
    // When Ollama daemon is offline or in test runner, fallback extracts verbatim excerpts
    const adapter = new OllamaInferenceAdapter({
      baseUrl: 'http://127.0.0.1:9999', // Port without Ollama to test fallback
      timeoutMs: 500,
      useFallbackOnOffline: true,
    });

    const candidates = await adapter.extract({
      email: SAMPLE_CURRENT_EMAIL,
      profile: SAMPLE_CLIENT,
      sources: SAMPLE_HISTORICAL_EMAILS,
    });

    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(['concern', 'commitment', 'goal', 'preference', 'communication_signal']).toContain(
        c.kind
      );
      expect(c.sourceExcerpt.length).toBeGreaterThan(0);
      // Check that excerpt really exists in one of the emails
      const allEmails = [SAMPLE_CURRENT_EMAIL, ...SAMPLE_HISTORICAL_EMAILS];
      const match = allEmails.find((e) => e.id === c.sourceEmailId);
      expect(match).toBeDefined();
      expect(match?.body.includes(c.sourceExcerpt)).toBe(true);
    }
  });
});
