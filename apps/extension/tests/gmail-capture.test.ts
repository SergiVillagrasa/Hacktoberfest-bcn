import { describe, expect, it } from 'vitest';
import { captureFingerprint, extractCurrentEmail, inspectCurrentEmail, extractExpandedThread } from '../lib/gmail-capture';

function fixture(messages: { id?: string; sender: string; body: string; recipient?: string; hidden?: boolean }[], account = 'manager@example.test') {
  const bodies = messages.map((message) => ({
    textContent: message.body,
    parentElement: null,
    ownerDocument: { defaultView: null },
    hasAttribute: (attribute: string) => attribute === 'hidden' && message.hidden === true,
    getAttribute: () => null,
    closest: () => ({
      getAttribute: (key: string) => key === 'data-message-id' ? message.id ?? null : null,
      querySelector: () => ({ getAttribute: (key: string) => key === 'email' ? message.sender : null }),
      querySelectorAll: () => message.recipient ? [{ getAttribute: (key: string) => key === 'email' ? message.recipient : null }] : [],
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
    expect(extractCurrentEmail(fixture([
      { id: 'a', sender: 'client@example.test', body: 'Client question' },
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


describe('capture diagnostics', () => {
  it('explains that the expanded message is an outgoing reply without using an earlier client message', () => {
    expect(inspectCurrentEmail(fixture([
      { id: 'client', sender: 'client@example.test', body: 'Client question' },
      { id: 'manager', sender: 'manager@example.test', body: 'Manager reply' },
    ]))).toEqual({ email: null, reason: 'outgoing-message' });
  });
  it('distinguishes missing account identity from an unreadable source ID', () => {
    expect(inspectCurrentEmail(fixture([{ id: 'client', sender: 'client@example.test', body: 'Question' }], '')))
      .toEqual({ email: null, reason: 'account-unavailable' });
    expect(inspectCurrentEmail(fixture([{ sender: 'client@example.test', body: 'Question' }])))
      .toEqual({ email: null, reason: 'message-unreadable' });
  });
});


describe('explicit expanded-thread preview', () => {
  it('preserves incoming and outgoing message identities and excludes collapsed bodies', () => {
    const result = extractExpandedThread(fixture([
      { id: 'in', sender: 'client@example.test', body: 'Exact client question.' },
      { id: 'out', sender: 'manager@example.test', recipient: 'client@example.test', body: 'Exact manager promise.' },
      { id: 'hidden', sender: 'other@example.test', body: 'Collapsed body', hidden: true },
    ]));
    expect(result.managerEmail).toBe('manager@example.test');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]).toMatchObject({ id: 'in', direction: 'incoming', source: 'demo-import', body: 'Exact client question.' });
    expect(result.messages[1]).toMatchObject({ id: 'out', direction: 'outgoing', recipientEmail: 'client@example.test', body: 'Exact manager promise.' });
  });
  it('refuses to guess the recipient of a manager reply', () => {
    expect(() => extractExpandedThread(fixture([{ id: 'out', sender: 'manager@example.test', body: 'A promise' }])))
      .toThrow('exactly one visible recipient');
  });
  it('rejects missing account identity and oversized threads', () => {
    expect(() => extractExpandedThread(fixture([], ''))).toThrow('account');
    expect(() => extractExpandedThread(fixture(Array.from({ length: 51 }, (_, index) => ({ id: String(index), sender: 'client@example.test', body: 'Message' })))))
      .toThrow('50');
  });
});
