import { useState, type FormEvent } from 'react';
import { HISTORY_IMPORT_LIMITS } from '@briefing/contracts';

type Props = {
  clientEmail: string;
  busy: boolean;
  onImport: (text: string) => Promise<void>;
};

export function HistoryImportForm({ clientEmail, busy, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [reading, setReading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || busy || reading) return;
    setError('');
    setComplete(false);
    setReading(true);
    try {
      if (file.size > HISTORY_IMPORT_LIMITS.bytes) throw new Error('The file exceeds the 1 MB limit.');
      await onImport(await file.text());
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import failed. Try again.');
    } finally { setReading(false); }
  }

  return (
    <details className="history-import">
      <summary>Import fictional history</summary>
      <form onSubmit={(event) => void submit(event)} className="import-form">
        <p>Manual import for <strong>{clientEmail}</strong>. Fictional data only.
          Messages are added to local history; the entire mailbox is not read.</p>
        <label htmlFor="history-file">JSON file (maximum 1 MB, 50 messages)</label>
        <input id="history-file" type="file" accept=".json,application/json"
          disabled={busy || reading} aria-describedby="history-format"
          onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); setComplete(false); }} />
        <p id="history-format">Include version: 1, clientEmail, managerEmail and messages.
          Each message needs id, senderEmail, subject, body and direction
          (incoming or outgoing). Manager replies need recipientEmail
          matching the client. sentAt is optional, in ISO format with a timezone.</p>
        <p>Import saves messages without creating confirmed facts. Then choose
          “Analyze history with Gemma4” to generate suggestions.</p>
        <button className="btn btn-primary" type="submit" disabled={!file || busy || reading}>
          {reading ? 'Importing…' : 'Import messages'}
        </button>
        {error && <p role="alert" className="action-error">{error}</p>}
        {complete && <p role="status">History imported. You can now analyze it with Gemma4.</p>}
      </form>
    </details>
  );
}
