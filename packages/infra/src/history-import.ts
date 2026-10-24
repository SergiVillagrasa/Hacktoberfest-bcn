import { HISTORY_IMPORT_LIMITS, isHistoryImport, type HistoryImport } from '@briefing/contracts';

export function parseHistoryImport(text: string): HistoryImport {
  if (new TextEncoder().encode(text).length > HISTORY_IMPORT_LIMITS.bytes) {
    throw new Error('The file exceeds the 1 MB limit. Reduce the history and try again.');
  }
  let data: unknown;
  try { data = JSON.parse(text); } catch {
    throw new Error('The file is not valid JSON. Check the format and try again.');
  }
  if (typeof data === 'object' && data !== null && 'messages' in data && Array.isArray(data.messages)) {
    // Import transport always labels messages as imported, never as Gmail capture.
    data.messages = data.messages.map((email: unknown) =>
      typeof email === 'object' && email !== null ? { ...email, source: 'demo-import' } : email);
  }
  if (!isHistoryImport(data)) {
    throw new Error('Invalid format: include version: 1, clientEmail, managerEmail and 1 to 50 messages with id, senderEmail, subject, body and direction.');
  }
  return data;
}
