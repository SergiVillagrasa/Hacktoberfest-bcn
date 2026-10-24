import { expect, it } from 'vitest';
import { SelectionGuard } from '../lib/selection-guard';

it.each(['ready', 'error', 'review', 'loading-cleanup'])('rejects a stale %s completion after navigating away', async (completion) => {
  const guard = new SelectionGuard();
  let finish!: () => void;
  const wait = new Promise<void>((resolve) => { finish = resolve; });
  const previous = guard.begin();
  let visible = 'loading';
  const pending = wait.then(() => { if (guard.isCurrent(previous)) visible = completion; });
  guard.begin();
  visible = 'unknown sender';
  finish();
  await pending;
  expect(visible).toBe('unknown sender');
});
