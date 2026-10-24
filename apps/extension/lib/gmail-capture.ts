import { isEmailContext, type EmailContext } from '@briefing/contracts';

function visible(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') return false;
    const style = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  }
  return true;
}

// Gmail's DOM is an adapter boundary. Missing identity/direction fails closed.
export function extractCurrentEmail(root: Document): EmailContext | null {
  const accountElement =
    root.querySelector('a[href*="accounts.google.com"][aria-label]') ??
    root.querySelector('[aria-label*="@"]') ??
    root.querySelector('a[href*="SignOutOptions"]') ??
    root.querySelector('[data-identifier]');
  const accountLabel =
    accountElement?.getAttribute('aria-label') ??
    accountElement?.getAttribute('data-identifier') ??
    '';
  const account = accountLabel.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  if (!account) return null;
  const bodies = Array.from(root.querySelectorAll('.a3s')).filter(visible);
  // Scan backwards from newest to find the latest visible incoming client message in the conversation.
  // Outgoing manager replies are skipped so the client context and agreements in the thread remain active.
  for (let i = bodies.length - 1; i >= 0; i--) {
    const bodyElement = bodies[i];
    const container = bodyElement?.closest('[data-message-id], [data-legacy-message-id]');
    if (!bodyElement || !container) continue;
    const sender = container.querySelector('.gD[email], .gD[data-hovercard-id]');
    const senderEmail = (sender?.getAttribute('email') ?? sender?.getAttribute('data-hovercard-id') ?? '').toLowerCase();
    // Current-message capture accepts incoming email only. Manager replies stay in explicit imports.
    if (!senderEmail || senderEmail === account) continue;
    const id = container.getAttribute('data-legacy-message-id') ?? container.getAttribute('data-message-id');
    if (!id) continue;
    const email: EmailContext = {
      id,
      senderEmail,
      subject: root.querySelector('h2.hP')?.textContent?.trim() ?? '',
      body: bodyElement.textContent ?? '',
      direction: 'incoming',
      source: 'gmail',
    };
    // Gmail's localized display dates are ambiguous; leave sentAt unknown.
    if (isEmailContext(email)) return email;
  }

  // Fallback: If earlier client messages are collapsed in the thread, find the latest incoming client container
  const allContainers = Array.from(root.querySelectorAll('[data-message-id], [data-legacy-message-id]'));
  for (let i = allContainers.length - 1; i >= 0; i--) {
    const container = allContainers[i];
    if (typeof container?.querySelector !== 'function') continue;
    const sender = container.querySelector('.gD[email], .gD[data-hovercard-id]');
    const senderEmail = (sender?.getAttribute('email') ?? sender?.getAttribute('data-hovercard-id') ?? '').toLowerCase();
    if (!senderEmail || senderEmail === account) continue;
    const bodyElement = container.querySelector('.a3s');
    const body = bodyElement?.textContent?.trim() ?? '';
    if (!body) continue;
    const id = container.getAttribute('data-legacy-message-id') ?? container.getAttribute('data-message-id');
    if (!id) continue;
    const email: EmailContext = {
      id,
      senderEmail,
      subject: root.querySelector('h2.hP')?.textContent?.trim() ?? '',
      body,
      direction: 'incoming',
      source: 'gmail',
    };
    if (isEmailContext(email)) return email;
  }

  return null;
}

export function captureFingerprint(email: EmailContext | null): string {
  return JSON.stringify(email);
}
