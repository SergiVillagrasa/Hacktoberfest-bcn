import { expect, it } from 'vitest';
import type { ClientProfile } from '@briefing/contracts';
import { matchClient } from './index';

const profiles: ClientProfile[] = [
  { id: 'a', email: 'a@example.test', displayName: 'A', notes: '', items: [] },
  { id: 'b', email: 'b@example.test', displayName: 'B', notes: '', items: [] },
];

it('selects only the profile with an exact sender-email match', () => {
  expect(matchClient('b@example.test', profiles)?.id).toBe('b');
  expect(matchClient('unknown@example.test', profiles)).toBeUndefined();
  expect(matchClient('A@example.test', profiles)).toBeUndefined();
  expect(matchClient(' a@example.test', profiles)).toBeUndefined();
  expect(matchClient('a@example.test', [])).toBeUndefined();
});
