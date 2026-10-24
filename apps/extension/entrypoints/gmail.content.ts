import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import type { CaptureMessage } from '@briefing/contracts';
import { captureFingerprint, extractCurrentEmail } from '../lib/gmail-capture';

export default defineContentScript({
  matches: ['https://mail.google.com/*'],
  main(ctx) {
    let lastFingerprint: string | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    function capture(): CaptureMessage {
      const email = extractCurrentEmail(document);
      const requestId = crypto.randomUUID();
      return email ? { type: 'email/captured', requestId, email } : { type: 'email/cleared', requestId };
    }
    function scanPage() {
      const message = capture();
      const fingerprint = captureFingerprint(message.type === 'email/captured' ? message.email : null);
      if (fingerprint === lastFingerprint) return;
      // Mark delivered only after send succeeds; a missing panel can retry or request replay.
      void browser.runtime.sendMessage(message).then(() => { lastFingerprint = fingerprint; }).catch(() => {});
    }
    const replay = (message: unknown) => {
      if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'capture/current') {
        return Promise.resolve(capture());
      }
    };
    browser.runtime.onMessage.addListener(replay);
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanPage, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    ctx.addEventListener(window, 'hashchange', scanPage);
    scanPage();
    ctx.onInvalidated(() => {
      observer.disconnect();
      clearTimeout(debounceTimer);
      browser.runtime.onMessage.removeListener(replay);
    });
  },
});
