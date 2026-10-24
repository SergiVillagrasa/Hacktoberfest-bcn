import { isGmailThreadPreview, type GmailThreadPreview } from '@briefing/contracts';
import { browser } from 'wxt/browser';

export type ThreadPreview = { tabId: number; data: GmailThreadPreview };
export async function requestThreadPreview(expectedTabId?: number): Promise<ThreadPreview> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || (expectedTabId !== undefined && tab.id !== expectedTabId)) {
    throw new Error('Select the same Gmail tab and preview the thread again.');
  }
  let response: unknown;
  try { response = await browser.tabs.sendMessage(tab.id, { type: 'capture/thread' }); }
  catch { throw new Error('Could not connect to Gmail. Reload its tab and preview again.'); }
  if (typeof response !== 'object' || response === null || !('type' in response)) throw new Error('Invalid thread preview response.');
  if (response.type === 'history/thread-error' && 'error' in response && typeof response.error === 'string') {
    throw new Error(response.error);
  }
  if (response.type !== 'history/thread-preview' || !('preview' in response) || !isGmailThreadPreview(response.preview)) {
    throw new Error('Invalid thread preview response.');
  }
  return { tabId: tab.id, data: response.preview };
}
