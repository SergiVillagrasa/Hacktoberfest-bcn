import { useState, type FormEvent } from 'react';
import type { HistoryImport } from '@briefing/contracts';
import { requestThreadPreview, type ThreadPreview } from '../../lib/thread-preview';

type Props = { clientEmail?: string; disabled: boolean; onImport: (data: HistoryImport) => Promise<void> };

export function GmailThreadImport({ clientEmail = '', disabled, onImport }: Props) {
  const [preview, setPreview] = useState<ThreadPreview | null>(null);
  const [client, setClient] = useState(clientEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  async function load() {
    setBusy(true); setError(''); setComplete(false); setPreview(null);
    try { setPreview(await requestThreadPreview()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Thread preview failed.'); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!preview || busy || disabled) return;
    setBusy(true); setError('');
    try {
      const current = await requestThreadPreview(preview.tabId);
      if (JSON.stringify(current.data) !== JSON.stringify(preview.data)) {
        setPreview(null);
        throw new Error('The expanded thread changed. Preview it again before importing.');
      }
      await onImport({ ...current.data, clientEmail: client.trim().toLowerCase() });
      setPreview(null); setComplete(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Thread import failed.'); }
    finally { setBusy(false); }
  }

  const clients = preview ? [...new Set(preview.data.messages.flatMap((message) =>
    message.direction === 'incoming' ? [message.senderEmail] : message.recipientEmail ? [message.recipientEmail] : []))] : [];
  return (
    <section className="history-tools" aria-label="Gmail thread import">
      <h2 className="section-title">Import expanded Gmail thread</h2>
      <p>Expand the fictional messages you want to include, then preview them.
        This reads expanded messages in the current thread only, including your replies.</p>
      <button className="btn" disabled={busy || disabled} onClick={() => void load()}>
        {busy ? 'Reading thread…' : 'Preview expanded thread'}
      </button>
      {preview && <form className="import-form" onSubmit={(event) => void save(event)}>
        <p>{preview.data.messages.length} expanded messages: {preview.data.messages.filter((message) => message.direction === 'outgoing').length} manager replies.
          Manager account: {preview.data.managerEmail}. Dates remain unknown unless recorded separately.</p>
        <label htmlFor="thread-client">Client email for this fictional thread</label>
        <input id="thread-client" type="email" required list="thread-clients" value={client}
          disabled={busy || disabled} onChange={(event) => setClient(event.target.value)} />
        <datalist id="thread-clients">{clients.map((email) => <option key={email} value={email} />)}</datalist>
        <ul>{preview.data.messages.map((message) => <li key={message.id}>
          {message.direction === 'outgoing' ? 'Manager reply' : 'Incoming'}: {message.senderEmail}
          {message.recipientEmail && <> → {message.recipientEmail}</>} — {message.subject}
        </li>)}</ul>
        <p>Import marks these as manually imported fictional history. It creates no confirmed facts.
          All messages must belong to the selected client and manager.</p>
        <button className="btn btn-primary" type="submit" disabled={busy || disabled || !client}>
          Import expanded messages
        </button>
      </form>}
      {error && <p role="alert" className="action-error">{error}</p>}
      {complete && <p role="status">Thread imported. Choose “Analyze history with Qwen3” to generate suggestions.</p>}
    </section>
  );
}
