import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import type { CaptureMessage } from '@briefing/contracts';
import { captureOpenThread, extractExpandedThread } from '../lib/gmail-capture';

export default defineContentScript({
  matches: ['https://mail.google.com/*'],
  main(ctx) {
    let lastFingerprint: string | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let navigation = 0;
    let disposed = false;
    let pending: { url: string; promise: Promise<CaptureMessage> } | undefined;

    function capture(): Promise<CaptureMessage> {
      const url = typeof location !== 'undefined' ? location.href : (typeof window !== 'undefined' && window.location ? window.location.href : '');
      if (pending?.url === url) return pending.promise;
      const generation = navigation;
      const current = () => !disposed && generation === navigation && (typeof location !== 'undefined' ? location.href : (typeof window !== 'undefined' && window.location ? window.location.href : '')) === url;
      const promise = (async (): Promise<CaptureMessage> => {
        const requestId = crypto.randomUUID();
        try {
          const thread = await captureOpenThread(document, current);
          return thread && current() ? { type: 'thread/captured', requestId, thread } : { type: 'email/cleared', requestId };
        } catch (error) {
          return current() ? { type: 'capture/error', requestId, reason: error instanceof Error ? error.message : 'Thread capture failed.' }
            : { type: 'email/cleared', requestId };
        }
      })();
      pending = { url, promise };
      void promise.finally(() => { if (pending?.promise === promise) pending = undefined; });
      return promise;
    }

    async function scanPage() {
      const generation = navigation;
      const message = await capture();
      if (disposed || generation !== navigation) return;
      const fingerprint = JSON.stringify({ ...message, requestId: '' });
      if (fingerprint === lastFingerprint) return;
      try {
        await browser.runtime.sendMessage(message);
        if (generation === navigation) lastFingerprint = fingerprint;
      } catch { /* A new panel requests the current thread on startup. */ }
    }
    const replay = (message: unknown) => {
      if (typeof message !== 'object' || message === null || !('type' in message)) return;
      if (message.type === 'capture/thread') {
        try { return Promise.resolve({ type: 'history/thread-preview', preview: extractExpandedThread(document) }); }
        catch (error) { return Promise.resolve({ type: 'history/thread-error', error: error instanceof Error ? error.message : 'Thread preview failed.' }); }
      }
      if (message.type === 'capture/current') return capture();
    };
    browser.runtime.onMessage.addListener(replay);
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void scanPage(), 400);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    ctx.addEventListener(window, 'hashchange', () => {
      navigation++;
      lastFingerprint = undefined;
      void browser.runtime.sendMessage({ type: 'email/cleared', requestId: crypto.randomUUID() }).catch(() => {});
      void scanPage();
    });
    void scanPage();
    ctx.onInvalidated(() => {
      disposed = true;
      navigation++;
      observer.disconnect();
      clearTimeout(debounceTimer);
      browser.runtime.onMessage.removeListener(replay);
    });
  },
});
