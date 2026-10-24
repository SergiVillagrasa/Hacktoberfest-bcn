import { HISTORY_IMPORT_LIMITS, isEmailContext, isGmailThreadPreview, type GmailThreadPreview, type CapturedThread, type CaptureClearReason, type EmailContext } from '@briefing/contracts';

function visible(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') return false;
    const style = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  }
  return true;
}

export type CaptureInspection = { email: EmailContext; reason?: never }
  | { email: null; reason?: CaptureClearReason };

// Gmail's DOM is an adapter boundary. Missing identity/direction fails closed.
export function inspectCurrentEmail(root: Document): CaptureInspection {
  const accountLabel = root.querySelector('a[href*="accounts.google.com"][aria-label]')?.getAttribute('aria-label') ?? '';
  const account = accountLabel.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  if (!account) return { email: null, reason: 'account-unavailable' };
  const bodies = Array.from(root.querySelectorAll('.a3s')).filter(visible);
  const bodyElement = bodies[bodies.length - 1];
  const container = bodyElement?.closest('[data-message-id], [data-legacy-message-id]');
  if (!bodyElement) return { email: null };
  if (!container) return { email: null, reason: 'message-unreadable' };
  const sender = container.querySelector('.gD[email], .gD[data-hovercard-id]');
  const senderEmail = (sender?.getAttribute('email') ?? sender?.getAttribute('data-hovercard-id') ?? '').toLowerCase();
  // Current-message capture accepts incoming email only. Manager replies stay in explicit imports.
  if (!senderEmail) return { email: null, reason: 'message-unreadable' };
  if (senderEmail === account) return { email: null, reason: 'outgoing-message' };
  const id = container.getAttribute('data-legacy-message-id') ?? container.getAttribute('data-message-id');
  if (!id) return { email: null, reason: 'message-unreadable' };
  const email: EmailContext = {
    id,
    senderEmail,
    subject: root.querySelector('h2.hP')?.textContent?.trim() ?? '',
    body: bodyElement.textContent ?? '',
    direction: 'incoming',
    source: 'gmail',
  };
  // Gmail's localized display dates are ambiguous; leave sentAt unknown.
  return isEmailContext(email) ? { email } : { email: null, reason: 'message-unreadable' };
}

export function extractCurrentEmail(root: Document): EmailContext | null {
  return inspectCurrentEmail(root).email;
}

export function captureFingerprint(email: EmailContext | null): string {
  return JSON.stringify(email);
}


// Shared DOM reader for explicit imports and automatic thread capture.
export function extractExpandedThread(root: Document, source: EmailContext['source'] = 'demo-import'): GmailThreadPreview {
  const label = root.querySelector('a[href*="accounts.google.com"][aria-label]')?.getAttribute('aria-label') ?? '';
  const managerEmail = label.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  if (!managerEmail) throw new Error('Gmail account could not be identified. Reload Gmail and retry.');
  const bodies = Array.from(root.querySelectorAll('.a3s')).filter(visible);
  if (!bodies.length) throw new Error('Expand the fictional messages you want to import first.');
  if (bodies.length > HISTORY_IMPORT_LIMITS.messages) throw new Error('Import at most 50 expanded messages at a time.');
  const messages: EmailContext[] = [];
  const seen = new Set<string>();
  for (const body of bodies) {
    const container = body.closest('[data-message-id], [data-legacy-message-id]');
    const id = container?.getAttribute('data-legacy-message-id') ?? container?.getAttribute('data-message-id');
    const sender = container?.querySelector('.gD[email], .gD[data-hovercard-id]');
    const senderEmail = (sender?.getAttribute('email') ?? sender?.getAttribute('data-hovercard-id') ?? '').toLowerCase();
    if (!id || !senderEmail) throw new Error('An expanded message is missing its sender or stable ID. Reload Gmail and retry.');
    if (seen.has(id)) continue;
    seen.add(id);
    const outgoing = senderEmail === managerEmail;
    let recipientEmail: string | undefined;
    if (outgoing) {
      const recipients = new Set(Array.from(container!.querySelectorAll('.g2[email], .g2[data-hovercard-id]'))
        .map((recipient) => (recipient.getAttribute('email') ?? recipient.getAttribute('data-hovercard-id') ?? '').toLowerCase())
        .filter((address) => address && address !== managerEmail));
      if (recipients.size !== 1) throw new Error('A manager reply needs exactly one visible recipient. Open its recipient details in Gmail and retry capture.');
      recipientEmail = [...recipients][0]!;
    }
    const email: EmailContext = {
      id, senderEmail, ...(recipientEmail ? { recipientEmail } : {}),
      subject: root.querySelector('h2.hP')?.textContent?.trim() ?? '',
      body: body.textContent ?? '', direction: outgoing ? 'outgoing' : 'incoming', source,
    };
    if (!isEmailContext(email)) throw new Error('An expanded message is malformed or exceeds the capture limits.');
    messages.push(email);
  }
  const result = { version: 1 as const, managerEmail, messages };
  if ((source === 'demo-import' && !isGmailThreadPreview(result)) || new TextEncoder().encode(JSON.stringify(result)).length > HISTORY_IMPORT_LIMITS.bytes) {
    throw new Error('The expanded thread exceeds the 1 MB import limit.');
  }
  return result;
}


export async function captureOpenThread(root: Document, isCurrent: () => boolean): Promise<CapturedThread | null> {
  const subjects = Array.from(root.querySelectorAll('h2.hP')).filter(visible);
  if (!subjects.length) return null;
  if (subjects.length !== 1) throw new Error('Multiple Gmail conversations are visible. Open one thread before capture.');
  const clicked = new Set<Element>();
  const deadline = Date.now() + 5000;
  let settleUntil = 0;
  while (isCurrent()) {
    const scope = subjects[0]!.closest('[role="main"]') ?? root;
    const expandAll = Array.from(scope.querySelectorAll<HTMLElement>(
      '[aria-label="Expand all"], [data-tooltip="Expand all"], [aria-label="Desplega-ho tot"], [data-tooltip="Desplega-ho tot"], [aria-label="Mostrar todo"], [data-tooltip="Mostrar todo"], [aria-label="Expandir todo"], .adx[role="button"]',
    )).find((control) => visible(control) && !control.closest('.a3s') && control.tagName !== 'A' && !clicked.has(control));
    if (expandAll) {
      clicked.add(expandAll);
      expandAll.click();
      settleUntil = Date.now() + 500;
    }
    const containers = Array.from(root.querySelectorAll('[data-message-id], [data-legacy-message-id]'))
      .filter((container) => visible(container) && !container.closest('.a3s'));
    if (containers.length > HISTORY_IMPORT_LIMITS.messages) throw new Error('The current thread exceeds the 50-message capture limit.');
    const collapsed = containers.filter((container) => {
      const body = container.querySelector('.a3s');
      return !body || !visible(body);
    });
    if (containers.length && !collapsed.length && Date.now() >= settleUntil) {
      const thread = extractExpandedThread(root, 'gmail');
      return { ...thread, threadId: root.location.href };
    }
    for (const container of collapsed) {
      // Only message headers can be clicked; message contents are never executed.
      const header = container.querySelector<HTMLElement>('.gE, .gH, [role="button"][aria-expanded="false"]');
      if (header && visible(header) && !header.closest('.a3s') && header.tagName !== 'A' && !clicked.has(header)) {
        clicked.add(header);
        header.click();
      }
    }
    if (Date.now() >= deadline) throw new Error('Some messages in this Gmail thread could not be expanded. Expand them in Gmail and retry capture.');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
}
