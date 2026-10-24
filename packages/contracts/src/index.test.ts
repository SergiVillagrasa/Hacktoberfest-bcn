import { describe, expect, it } from 'vitest';
import { EMAIL_LIMITS, isCaptureMessage, isEmailContext } from './index';

// Boundary input only, not an imported demo inbox.
const email = {
  id: 'message-1', senderEmail: 'client@example.test', subject: '', body: 'Source text.',
  direction: 'incoming', source: 'gmail',
};

describe('email boundary', () => {
  it('preserves verbatim text and permits an unknown date and blank subject', () => {
    expect(isEmailContext({ ...email, body: '  Source text.\n' })).toBe(true);
  });

  it.each([
    null,
    { ...email, id: '' },
    { ...email, senderEmail: 'Name <client@example.test>' },
    { ...email, body: ' ' },
    { ...email, body: 'x'.repeat(EMAIL_LIMITS.body + 1) },
    { ...email, source: 'mailbox-sync' },
    { ...email, direction: 'unknown' },
    { ...email, sentAt: 'yesterday' },
    { ...email, sentAt: '2026-10-24' },
  ])('rejects malformed or unbounded input (%#)', (input) => {
    expect(isEmailContext(input)).toBe(false);
  });

  it('accepts labeled imported outgoing history and an explicit date', () => {
    expect(isEmailContext({
      ...email, source: 'demo-import', direction: 'outgoing', sentAt: '2026-10-24T10:00:00Z',
    })).toBe(true);
  });
});

describe('capture envelope', () => {
  it('requires request identity for both capture and navigation clearing', () => {
    expect(isCaptureMessage({ type: 'email/captured', requestId: 'r1', email })).toBe(true);
    expect(isCaptureMessage({ type: 'email/cleared', requestId: 'r2' })).toBe(true);
    expect(isCaptureMessage({ type: 'email/captured', email })).toBe(false);
    expect(isCaptureMessage({ type: 'email/cleared', requestId: '' })).toBe(false);
  });

  it('does not accept imported history or a service action as capture', () => {
    expect(isCaptureMessage({
      type: 'email/captured', requestId: 'r1', email: { ...email, source: 'demo-import' },
    })).toBe(false);
    expect(isCaptureMessage({ type: 'analysis/run', requestId: 'r1', email })).toBe(false);
  });
});


it('accepts bounded capture diagnostics and rejects arbitrary page-provided reasons', () => {
  expect(isCaptureMessage({ type: 'email/cleared', requestId: 'reason-1', reason: 'outgoing-message' })).toBe(true);
  expect(isCaptureMessage({ type: 'email/cleared', requestId: 'reason-2', reason: 'run-model' })).toBe(false);
});
