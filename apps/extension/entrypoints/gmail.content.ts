import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import type { CaptureMessage, EmailContext } from '@briefing/contracts';
import { isEmailContext } from '@briefing/contracts';

export default defineContentScript({
  matches: ['https://mail.google.com/*'],
  main() {
    let lastCapturedId: string | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function extractCurrentEmail(): EmailContext | null {
      // Find subject from standard Gmail header
      const subjectEl = document.querySelector('h2.hP');
      const subject =
        subjectEl?.textContent?.trim() ||
        document.title.replace(' - Gmail', '').trim() ||
        'Sense assumpte';

      // Find sender email address
      const senderEl =
        document.querySelector('span[email]') || document.querySelector('[data-hovercard-id]');
      let senderEmail =
        senderEl?.getAttribute('email') || senderEl?.getAttribute('data-hovercard-id') || '';

      if (!senderEmail) {
        // Fallback to text matching in header
        const possibleHeaders = document.querySelectorAll('.gD, .zF, .yW span');
        for (const el of possibleHeaders) {
          const text = el.getAttribute('email') || el.textContent || '';
          const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (match) {
            senderEmail = match[0];
            break;
          }
        }
      }

      if (!senderEmail || !senderEmail.includes('@')) {
        return null;
      }

      // Find email body container
      const bodyElements = document.querySelectorAll('.a3s.aiL, .ii.gt');
      const lastBodyEl = bodyElements[bodyElements.length - 1];
      const body = lastBodyEl?.textContent?.trim() || '';

      if (body.length === 0) {
        return null;
      }

      // Derive message ID from thread URL hash or attributes
      const id = window.location.hash.replace('#', '') || `gmail-${senderEmail}-${body.slice(0, 20)}`;

      const email: EmailContext = {
        id: id.slice(0, 255),
        senderEmail: senderEmail.toLowerCase().slice(0, 319),
        subject: subject.slice(0, 999),
        body: body.slice(0, 99_000),
        sentAt: new Date().toISOString(),
        direction: 'incoming',
        source: 'gmail',
      };

      return isEmailContext(email) ? email : null;
    }

    function scanPage() {
      const email = extractCurrentEmail();

      if (!email) {
        if (lastCapturedId !== null) {
          lastCapturedId = null;
          const clearedMsg: CaptureMessage = {
            type: 'email/cleared',
            requestId: `req-${Date.now()}`,
          };
          void browser.runtime.sendMessage(clearedMsg).catch(() => {});
        }
        return;
      }

      if (email.id === lastCapturedId) {
        return;
      }

      lastCapturedId = email.id;
      const capturedMsg: CaptureMessage = {
        type: 'email/captured',
        requestId: `req-${Date.now()}`,
        email,
      };

      void browser.runtime.sendMessage(capturedMsg).catch(() => {});
    }

    function onDomMutation() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanPage, 400);
    }

    const observer = new MutationObserver(onDomMutation);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    setTimeout(scanPage, 1000);
  },
});
