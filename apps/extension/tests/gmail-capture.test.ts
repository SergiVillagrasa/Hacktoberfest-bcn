import { describe, expect, it } from 'vitest';
import { captureFingerprint, extractCurrentEmail } from '../lib/gmail-capture';

function fixture(messages: { id?: string; sender: string; body: string }[], account = 'manager@example.test') {
  const bodies = messages.map((message) => ({
    textContent: message.body,
    parentElement: null,
    ownerDocument: { defaultView: null },
    hasAttribute: () => false,
    getAttribute: () => null,
    closest: () => ({
      getAttribute: (key: string) => key === 'data-message-id' ? message.id ?? null : null,
      querySelector: () => ({ getAttribute: (key: string) => key === 'email' ? message.sender : null }),
    }),
  }));
  return {
    querySelector: (selector: string) => selector === 'h2.hP' ? { textContent: 'Same conversation' } : { getAttribute: () => account },
    querySelectorAll: () => bodies,
  } as unknown as Document;
}

describe('visible Gmail message identity', () => {
  it('takes sender, source ID and body from the same last expanded message', () => {
    const email = extractCurrentEmail(fixture([
      { id: 'a', sender: 'first@example.test', body: 'First client' },
      { id: 'b', sender: 'second@example.test', body: 'Second client' },
    ]));
    expect(email).toMatchObject({ id: 'b', senderEmail: 'second@example.test', body: 'Second client', direction: 'incoming' });
    expect(email).not.toHaveProperty('sentAt');
  });

  it('does not attribute a manager reply to the client starting the thread', () => {
    const email = extractCurrentEmail(fixture([
      { id: 'a', sender: 'client@example.test', body: 'Client question' },
      { id: 'b', sender: 'manager@example.test', body: 'Manager answer' },
    ]));
    expect(email).toMatchObject({ id: 'a', senderEmail: 'client@example.test', body: 'Client question', direction: 'incoming' });
    expect(email?.body).not.toContain('Manager answer');
  });

  it('fails closed on outgoing threads with no incoming client message', () => {
    expect(extractCurrentEmail(fixture([
      { id: 'b', sender: 'manager@example.test', body: 'Manager answer' },
    ]))).toBeNull();
  });

  it('fails closed without a stable message ID or account identity', () => {
    expect(extractCurrentEmail(fixture([{ sender: 'client@example.test', body: 'Question' }]))).toBeNull();
    expect(extractCurrentEmail(fixture([{ id: 'a', sender: 'client@example.test', body: 'Question' }], ''))).toBeNull();
  });

  it('distinguishes messages and changed contents inside one conversation', () => {
    const a = extractCurrentEmail(fixture([{ id: 'a', sender: 'client@example.test', body: 'Question' }]));
    const b = extractCurrentEmail(fixture([{ id: 'b', sender: 'client@example.test', body: 'Question' }]));
    const changed = extractCurrentEmail(fixture([{ id: 'a', sender: 'client@example.test', body: 'Changed question' }]));
    expect(captureFingerprint(a)).not.toBe(captureFingerprint(b));
    expect(captureFingerprint(a)).not.toBe(captureFingerprint(changed));
  });
});
