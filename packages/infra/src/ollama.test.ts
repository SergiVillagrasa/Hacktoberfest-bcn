import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaInferenceAdapter } from './ollama';
import { SAMPLE_CLIENT, SAMPLE_CURRENT_EMAIL, SAMPLE_HISTORICAL_EMAILS } from './test-fixtures';

const input = {
  email: SAMPLE_CURRENT_EMAIL,
  profile: SAMPLE_CLIENT,
  sources: SAMPLE_HISTORICAL_EMAILS,
};

afterEach(() => vi.unstubAllGlobals());

describe('Ollama inference provenance', () => {
  it.each(['{broken json', '{}', 'null', '{"items":[{}]}', '{"items":[null]}'])('rejects malformed model output (%s)', async (content) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content } })));
    const adapter = new OllamaInferenceAdapter();
    await expect(adapter.extract(input)).rejects.toThrow();
    expect(adapter.getLastInferenceMode()).toBe('idle');
  });

  it('propagates a connection failure without returning scripted observations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
    const adapter = new OllamaInferenceAdapter();
    await expect(adapter.extract(input)).rejects.toThrow('Connection refused');
    expect(adapter.getLastInferenceMode()).toBe('idle');
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
    expect(request).toMatchObject({ model: 'gemma4:e4b', think: false, stream: false });
    expect(request.format.properties.items.items.properties.sourceEmailId.enum).toEqual([SAMPLE_CURRENT_EMAIL.id]);
    expect(request.options.num_predict).toBeGreaterThan(0);
    expect(request.options.num_predict).toBeLessThanOrEqual(512);
  });

  it('preserves a valid empty result as live inference', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content: '{"items":[]}' } })));
    const adapter = new OllamaInferenceAdapter();

    expect(await adapter.extract(input)).toEqual([]);
    expect(adapter.getLastInferenceMode()).toBe('ollama-live');
  });

  it('rejects malformed output without substituting observations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: { content: 'invalid' } })));
    const adapter = new OllamaInferenceAdapter();

    await expect(adapter.extract(input)).rejects.toThrow('invalid JSON');
    expect(adapter.getLastInferenceMode()).not.toBe('ollama-live');
  });
});
