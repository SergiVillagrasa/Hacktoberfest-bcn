import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaInferenceAdapter } from './ollama';
import { SAMPLE_CLIENT, SAMPLE_CURRENT_EMAIL, SAMPLE_HISTORICAL_EMAILS } from './sample-data';

const input = {
  email: SAMPLE_CURRENT_EMAIL,
  profile: SAMPLE_CLIENT,
  sources: SAMPLE_HISTORICAL_EMAILS,
};

afterEach(() => vi.unstubAllGlobals());

describe('Ollama inference provenance', () => {
  it.each(['{broken json', '{}', 'null'])('labels malformed model output as fallback (%s)', async (content) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content } })));
    const adapter = new OllamaInferenceAdapter();

    const candidates = await adapter.extract(input);

    expect(candidates.length).toBeGreaterThan(0);
    expect(adapter.getLastInferenceMode()).toBe('offline-fallback');
    expect(candidates.every((item) => item.inference === 'offline-fallback')).toBe(true);
  });

  it('returns valid model candidates and requests bounded inference without thinking', async () => {
    const item = {
      kind: 'concern',
      text: 'Client concern',
      sourceEmailId: SAMPLE_CURRENT_EMAIL.id,
      sourceExcerpt: SAMPLE_CURRENT_EMAIL.body.slice(0, 30),
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      message: { content: JSON.stringify({ items: [item] }) },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new OllamaInferenceAdapter();

    expect(await adapter.extract(input)).toEqual([{ ...item, inference: 'ollama-live' }]);
    expect(adapter.getLastInferenceMode()).toBe('ollama-live');
    const request = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(request).toMatchObject({ model: 'qwen3:1.7b', think: false, stream: false });
    expect(request.options.num_predict).toBeGreaterThan(0);
    expect(request.options.num_predict).toBeLessThanOrEqual(512);
  });

  it('preserves a valid empty result as live inference', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content: '{"items":[]}' } })));
    const adapter = new OllamaInferenceAdapter();

    expect(await adapter.extract(input)).toEqual([]);
    expect(adapter.getLastInferenceMode()).toBe('ollama-live');
  });

  it('rejects malformed output when fallback is disabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content: 'invalid' } })));
    const adapter = new OllamaInferenceAdapter({ useFallbackOnOffline: false });

    await expect(adapter.extract(input)).rejects.toThrow('invalid JSON');
    expect(adapter.getLastInferenceMode()).not.toBe('ollama-live');
  });
});
