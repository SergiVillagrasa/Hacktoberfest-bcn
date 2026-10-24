import { afterEach, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import gmail from '../entrypoints/gmail.content';
import { captureOpenThread } from '../lib/gmail-capture';

vi.mock('wxt/browser', () => ({ browser: { runtime: {
  sendMessage: vi.fn().mockRejectedValue(new Error('panel closed')),
  onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
} } }));
vi.mock('../lib/gmail-capture', () => ({
  captureOpenThread: vi.fn(),
  extractExpandedThread: vi.fn(),
  captureFingerprint: (thread: unknown) => JSON.stringify(thread),
}));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('replays the current thread when a panel opens after the initial capture was lost', async () => {
  const thread = {
    version: 1,
    managerEmail: 'manager@example.test',
    threadId: 'https://mail.google.com/mail/u/0/#inbox/FMfcgzQ',
    messages: [{ id: 'stable-id', senderEmail: 'client@example.test', subject: '', body: 'Question', direction: 'incoming', source: 'gmail' }],
  } as const;
  vi.mocked(captureOpenThread).mockResolvedValue(thread as never);
  vi.stubGlobal('location', { href: 'https://mail.google.com/mail/u/0/#inbox/FMfcgzQ' });
  vi.stubGlobal('document', { body: {} });
  vi.stubGlobal('window', { location: { href: 'https://mail.google.com/mail/u/0/#inbox/FMfcgzQ' } });
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  gmail.main({ addEventListener: vi.fn(), onInvalidated: vi.fn() } as never);
  await Promise.resolve();
  const replay = vi.mocked(browser.runtime.onMessage.addListener).mock.calls[0]![0];
  const response = await replay({ type: 'capture/current' }, {} as never, vi.fn());
  expect(response).toMatchObject({ type: 'thread/captured', thread });
  vi.mocked(captureOpenThread).mockResolvedValue(null);
  expect(await replay({ type: 'capture/current' }, {} as never, vi.fn())).toMatchObject({ type: 'email/cleared' });
});
