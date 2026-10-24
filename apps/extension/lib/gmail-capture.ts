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
  const bodyElement = bodies[bodies.length - 1];
  const container = bodyElement?.closest('[data-message-id], [data-legacy-message-id]');
  if (!bodyElement || !container) return null;
  const sender = container.querySelector('.gD[email], .gD[data-hovercard-id]');
  const senderEmail = (sender?.getAttribute('email') ?? sender?.getAttribute('data-hovercard-id') ?? '').toLowerCase();
  // Current-message capture accepts incoming email only. Manager replies stay in explicit imports.
  if (!senderEmail || senderEmail === account) return null;
  const id = container.getAttribute('data-legacy-message-id') ?? container.getAttribute('data-message-id');
  if (!id) return null;
  const email: EmailContext = {
    id,
    senderEmail,
    subject: root.querySelector('h2.hP')?.textContent?.trim() ?? '',
    body: bodyElement.textContent ?? '',
    direction: 'incoming',
    source: 'gmail',
  };
  // Gmail's localized display dates are ambiguous; leave sentAt unknown.
  return isEmailContext(email) ? email : null;
}

export function captureFingerprint(email: EmailContext | null): string {
  return JSON.stringify(email);
}
