import { afterEach, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import background from '../entrypoints/background';

// WXT's fake-browser does not implement Chrome's sidePanel namespace yet.
vi.mock('wxt/browser', () => ({
  browser: { sidePanel: { setPanelBehavior: vi.fn() } },
}));

afterEach(() => vi.restoreAllMocks());

it('enables opening the side panel from the toolbar action', () => {
  const configure = vi.spyOn(browser.sidePanel, 'setPanelBehavior').mockResolvedValue(undefined);
  background.main();
  expect(configure).toHaveBeenCalledWith({ openPanelOnActionClick: true });
});
