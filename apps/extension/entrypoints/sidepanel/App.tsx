import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type {
  CaptureMessage,
  ContextItem,
  EmailContext,
  PanelState,
  CapturedThread,
} from '@briefing/contracts';
import { isCaptureMessage } from '@briefing/contracts';
import { ClientContextService } from '@briefing/core';
import {
  LocalStorageHistoryPort,
  LocalStorageAnalysisCachePort,
  parseHistoryImport,
  LocalStorageProfilePort,
  OllamaInferenceAdapter,
  type InferenceEngineStatus,
} from '@briefing/infra';
import '../../assets/panel.css';
import { browser } from 'wxt/browser';
import { HistoryImportForm } from '../../components/history/HistoryImportForm';
import { ContextIcon } from '../../components/briefing/ContextIcon';
import { SelectionGuard } from '../../lib/selection-guard';

function ContextRow({
  item,
  onReview,
  onToggleResolve,
}: {
  item: ContextItem;
  onReview: (item: ContextItem, review: 'confirmed' | 'dismissed') => void;
  onToggleResolve: (item: ContextItem) => void;
}) {
  const kindLabel = item.kind === 'communication_signal'
    ? 'Communication signal'
    : item.kind.charAt(0).toUpperCase() + item.kind.slice(1);
  const reviewLabel = item.review === 'suggested' ? 'Needs review' : 'Confirmed';

  return (
    <details className={`context-item kind-${item.kind} review-${item.review}`}>
      <summary>
        <span className="context-kind-icon"><ContextIcon kind={item.kind} /></span>
        <span className="context-summary-copy">
          <span className="context-item-text">{item.text}</span>
          <span className="context-item-meta">
            {kindLabel}
            <span className={`review-state is-${item.review}`}>
              {item.review === 'confirmed' && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg>}
              {reviewLabel}
            </span>
            {item.resolution === 'resolved' && <> <span aria-hidden="true">·</span> Resolved</>}
          </span>
        </span>
        <svg className="context-chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </summary>
      <div className="context-detail">
        <div className="source-evidence">
          <span className="evidence-label">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5H3v6h4c0 2-1 3-3 4m13-10h-5v6h4c0 2-1 3-3 4" /></svg>
            Source excerpt
          </span>
          <blockquote>“{item.sourceExcerpt}”</blockquote>
        </div>
        <p className="context-source">
          Source message: <code>{item.sourceEmailId}</code>
          {item.review === 'suggested' && (
            <span className="context-origin">
              {item.inference === 'ollama-live'
                ? 'Suggested by local Qwen3'
                : item.inference === 'offline-fallback'
                  ? 'Static fallback'
                  : 'Suggestion origin not recorded'}
            </span>
          )}
        </p>
        <div className="context-actions">
          {item.review === 'suggested' && (
            <>
              <button className="btn btn-primary" onClick={() => onReview(item, 'confirmed')}>
                Confirm
              </button>
              <button className="btn" onClick={() => onReview(item, 'dismissed')}>
                Dismiss
              </button>
            </>
          )}
          {(item.kind === 'concern' || item.kind === 'commitment') && (
            <button className="btn" onClick={() => onToggleResolve(item)}>
              {item.resolution === 'resolved' ? 'Reopen' : 'Mark resolved'}
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

export function App() {
  const activeTabId = useRef<number | undefined>(undefined);
  const panelWindowId = useRef<number | undefined>(undefined);
  const selection = useRef(new SelectionGuard()).current;
  const profilePort = useMemo(() => new LocalStorageProfilePort(), []);
  const historyPort = useMemo(() => new LocalStorageHistoryPort(), []);
  const cachePort = useMemo(() => new LocalStorageAnalysisCachePort(), []);
  const inferenceAdapter = useMemo(
    () => new OllamaInferenceAdapter(),
    []
  );
  const service = useMemo(
    () =>
      new ClientContextService({
        profilePort,
        historyPort,
        inferencePort: inferenceAdapter,
        cachePort,
      }),
    [profilePort, historyPort, inferenceAdapter, cachePort]
  );

  const [captureAttempt, setCaptureAttempt] = useState(0);
  const [panelState, setPanelState] = useState<PanelState>({ status: 'empty' });
  const activeThread = useRef<CapturedThread | null>(null);
  const [activeEmail, setActiveEmail] = useState<EmailContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<EmailContext[]>([]);
  const [actionMessage, setActionMessage] = useState('');
  const [analysisCached, setAnalysisCached] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [engineStatus, setEngineStatus] = useState<InferenceEngineStatus>('idle');

  const processEmail = useCallback(
    async (email: EmailContext, requestId: string = crypto.randomUUID()) => {
      const generation = selection.begin();
      const current = () => selection.isCurrent(generation);
      setClientHistory([]);
      setActionMessage('');
      setAnalysisCached(false);
      setHistoryBusy(false);
      setEngineStatus('idle');
      setShowHistory(false);
      setActiveEmail(email);
      setIsAnalyzing(true);
      setPanelState({ status: 'loading', requestId });

      try {
        const result = await service.openEmail(email);
        if (!current()) return;
        if (result) {
          setPanelState({ status: 'ready', requestId, briefing: result.briefing });
          setClientHistory(result.emails);
          setAnalysisCached(result.cached);
          setEngineStatus(result.cached ? 'idle' : inferenceAdapter.getLastInferenceMode());
        } else {
          setPanelState({ status: 'no-client', senderEmail: email.senderEmail });
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'Unknown analysis error';
        const saved = await service.readClient(email.senderEmail).catch(() => undefined);
        if (!current()) return;
        if (saved) {
          setPanelState({ status: 'ready', requestId, briefing: saved.briefing });
          setClientHistory(saved.emails);
          setActionMessage(`Analysis unavailable. ${reason}. Check Ollama and try again. No substitute answers were generated.`);
        } else setPanelState({ status: 'unavailable', reason });
      } finally {
        if (current()) setIsAnalyzing(false);
      }
    },
    [inferenceAdapter, service, selection]
  );

  const processThread = useCallback(async (thread: CapturedThread, requestId: string = crypto.randomUUID()) => {
    const generation = selection.begin();
    activeThread.current = thread;
    setPanelState({ status: 'loading', requestId });
    setActiveEmail(null);
    setClientHistory([]);
    setShowHistory(false);
    setActionMessage('');
    setHistoryBusy(false);
    setAnalysisCached(false);
    setEngineStatus('idle');
    setIsAnalyzing(true);
    try {
      const result = await service.openThread(thread);
      if (!selection.isCurrent(generation)) return;
      if (result.status === 'no-client') {
        setPanelState(result);
      } else {
        setPanelState({ status: 'ready', requestId, briefing: result.briefing });
        setClientHistory(result.emails);
        setAnalysisCached(!result.analysisError && result.analyzed === 0 && result.cached > 0);
        setEngineStatus(result.analyzed > 0 ? 'ollama-live' : 'idle');
        setActionMessage(result.analysisError
          ? `Thread saved. Analysis incomplete: ${result.analysisError}. Retry after checking Ollama.`
          : `Thread saved automatically. ${result.analyzed} new analyses; ${result.cached} reused from cache.`);
      }
    } catch (error) {
      if (selection.isCurrent(generation)) setPanelState({ status: 'unavailable', reason: error instanceof Error ? error.message : 'Thread processing failed.' });
    } finally {
      if (selection.isCurrent(generation)) setIsAnalyzing(false);
    }
  }, [service, selection]);

  // Listen for Gmail messages from the content script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.runtime?.onMessage) return;

    function handleMessage(message: unknown, sender?: { id?: string; url?: string; tab?: { active?: boolean; id?: number } }) {
      if (sender && (sender.id !== browser.runtime.id || !sender.url?.startsWith('https://mail.google.com/') || !sender.tab?.active || sender.tab.id !== activeTabId.current)) return;
      if (!isCaptureMessage(message)) return;
      const capture = message as CaptureMessage;

      if (capture.type === 'email/cleared') {
        selection.begin();
        activeThread.current = null;
        setEngineStatus('idle');
        setActionMessage('');
        setAnalysisCached(false);
        setHistoryBusy(false);
        setClientHistory([]);
        setShowHistory(false);
        setIsAnalyzing(false);
        setActiveEmail(null);
        setPanelState({ status: 'empty', ...(capture.reason ? { reason: capture.reason } : {}) });
      } else if (capture.type === 'thread/captured') {
        void processThread(capture.thread, capture.requestId);
      } else if (capture.type === 'capture/error') {
        selection.begin();
        activeThread.current = null;
        setActiveEmail(null);
        setClientHistory([]);
        setIsAnalyzing(false);
        setHistoryBusy(false);
        setEngineStatus('idle');
        setAnalysisCached(false);
        setPanelState({ status: 'unavailable', reason: capture.reason });
      } else if (capture.type === 'email/captured') {
        void processEmail(capture.email, capture.requestId);
      }
    }

    chromeApi.runtime.onMessage.addListener(handleMessage);
    const onTabActivated = (info: { tabId: number; windowId: number }) => {
      if (panelWindowId.current !== undefined && info.windowId !== panelWindowId.current) return;
      activeTabId.current = info.tabId;
      selection.begin();
      activeThread.current = null;
      setActiveEmail(null);
      setClientHistory([]);
      setIsAnalyzing(false);
      setHistoryBusy(false);
      setPanelState({ status: 'empty' });
      setCaptureAttempt((attempt) => attempt + 1);
    };
    browser.tabs.onActivated.addListener(onTabActivated);
    const generation = selection.snapshot();
    void browser.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab?.id === undefined) throw new Error('No active Gmail tab');
      activeTabId.current = tab.id;
      panelWindowId.current = tab.windowId;
      const replay: unknown = await browser.tabs.sendMessage(tab.id, { type: 'capture/current' });
      if (!isCaptureMessage(replay)) throw new Error('Invalid capture response');
      if (selection.isCurrent(generation)) handleMessage(replay);
    }).catch(() => {
      if (selection.isCurrent(generation)) setPanelState({ status: 'empty', reason: 'capture-disconnected' });
    });
    return () => {
      selection.begin();
      chromeApi.runtime.onMessage.removeListener(handleMessage);
      browser.tabs.onActivated.removeListener(onTabActivated);
    };
  }, [processEmail, processThread, selection, captureAttempt]);

  // Actions for manager review & resolution
  const handleReview = async (item: ContextItem, review: 'confirmed' | 'dismissed') => {
    if (panelState.status !== 'ready') return;
    const generation = selection.snapshot();
    await service.reviewItem(panelState.briefing.client.id, item.id, review);
    const updated = await service.getBriefing(panelState.briefing.client.email);
    if (selection.isCurrent(generation) && updated) {
      setPanelState({ status: 'ready', requestId: panelState.requestId, briefing: updated });
    }
  };

  const handleToggleResolve = async (item: ContextItem) => {
    if (panelState.status !== 'ready') return;
    const generation = selection.snapshot();
    await service.resolveItem(panelState.briefing.client.id, item.id, item.resolution === 'resolved' ? 'open' : 'resolved');
    const updated = await service.getBriefing(panelState.briefing.client.email);
    if (selection.isCurrent(generation) && updated) {
      setPanelState({ status: 'ready', requestId: panelState.requestId, briefing: updated });
    }
  };

  const handleBindClientManually = async (emailAddress: string) => {
    const generation = selection.snapshot();
    await service.registerClient(emailAddress);
    if (selection.isCurrent(generation)) {
      if (activeThread.current) void processThread(activeThread.current);
      else if (activeEmail) void processEmail(activeEmail);
    }
  };

  const handleImport = async (text: string) => {
    if (panelState.status !== 'ready') throw new Error('Select a client before importing.');
    const generation = selection.snapshot();
    const data = parseHistoryImport(text);
    const updated = await service.importClientHistory(panelState.briefing.client.id, data);
    if (selection.isCurrent(generation) && updated) {
      setPanelState({ ...panelState, briefing: updated.briefing });
      setClientHistory(updated.emails);
      setAnalysisCached(false);
      setEngineStatus('idle');
    }
  };

  const handleAnalyzeHistory = async () => {
    if (panelState.status !== 'ready' || historyBusy) return;
    const generation = selection.snapshot();
    setHistoryBusy(true);
    setActionMessage('Analyzing recorded messages with Qwen3…');
    try {
      const result = await service.analyzeHistory(panelState.briefing.client.id);
      if (selection.isCurrent(generation)) {
        setPanelState({ ...panelState, briefing: result.briefing });
        setAnalysisCached(result.analyzed === 0);
        setEngineStatus(result.analyzed > 0 ? 'ollama-live' : 'idle');
        setActionMessage(`${result.analyzed} new analyses; ${result.cached} reused from cache.`);
      }
    } catch (error) {
      const updated = await service.readClient(panelState.briefing.client.email);
      if (selection.isCurrent(generation)) {
        if (updated) setPanelState({ ...panelState, briefing: updated.briefing });
        setActionMessage(`Analysis incomplete. Previously saved results are preserved. ${error instanceof Error ? error.message : 'Try again.'}`);
      }
    } finally {
      if (selection.isCurrent(generation)) setHistoryBusy(false);
    }
  };

  const attentionItems = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter((item) =>
      (item.kind === 'concern' || item.kind === 'commitment') && item.resolution !== 'resolved'
    );
  }, [panelState]);

  const resolvedItems = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter((item) =>
      (item.kind === 'concern' || item.kind === 'commitment') && item.resolution === 'resolved'
    );
  }, [panelState]);

  const otherContext = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter(
      (item) => item.kind === 'goal' || item.kind === 'preference' || item.kind === 'communication_signal'
    );
  }, [panelState]);

  const captureReason = panelState.status === 'empty' ? panelState.reason : undefined;
  const captureGuidance = captureReason === 'outgoing-message'
    ? { title: 'Manager reply open', text: 'The open thread includes manager replies. Retry capture if it has not loaded.' }
    : captureReason === 'account-unavailable'
      ? { title: 'Gmail account unavailable', text: 'Reload Gmail, then retry capture.' }
      : captureReason === 'message-unreadable'
        ? { title: 'Message could not be read', text: 'Expand the client message and retry. Only the open thread is read.' }
        : captureReason === 'capture-disconnected'
          ? { title: 'Reconnect to Gmail', text: 'Reload Gmail, then reopen this panel from the extension icon.' }
          : { title: 'No message open', text: 'Open a fictional client message in Gmail to see its recorded context.' };

  const attentionPreview = attentionItems.slice(0, 3);
  const moreAttention = attentionItems.slice(3);
  const contextPreview = otherContext.slice(0, 3);
  const moreContext = otherContext.slice(3);

  return (
    <main className="briefing-app">
      <header className="app-header">
        <div className="app-title-row">
          <div className="app-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 5h12v14H6zM9 9h6M9 12h6M9 15h3" /></svg>
          </div>
          <h1>Client brief</h1>
          <span className={`engine-status ${engineStatus === 'ollama-live' ? 'is-live' : ''}`}>
            <span className="status-dot" aria-hidden="true" />
            {isAnalyzing ? 'Analyzing' : engineStatus === 'ollama-live' ? 'Qwen3 · local' : analysisCached ? 'Saved analysis' : 'Local'}
          </span>
        </div>
        <div className="active-email-banner">
          {activeEmail ? (
            <>
              <span className="active-indicator" aria-hidden="true" />
              <div className="active-email-info">
                <strong>{activeEmail.subject}</strong>
                <span>{activeEmail.senderEmail}</span>
              </div>
            </>
          ) : (
            <>
              <span className={`active-indicator ${panelState.status === 'ready' ? '' : 'is-waiting'}`} aria-hidden="true" />
              <span className="active-email-info">{panelState.status === 'ready' ? 'Current Gmail thread' : captureGuidance.title}</span>
            </>
          )}
        </div>
      </header>

      {isAnalyzing && (
        <section className="state-panel" aria-live="polite">
          <div className="analysis-spinner" aria-hidden="true" />
          <h2>Preparing the brief</h2>
          <p>Checking the open thread with local AI.</p>
          <span className="analysis-hint">Ollama · Qwen3</span>
        </section>
      )}

      {!isAnalyzing && panelState.status === 'empty' && (
        <section className="state-panel">
          <div className="state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 6.5h16v12H4zM4 8l8 5 8-5" /></svg>
          </div>
          <h2>{captureGuidance.title}</h2>
          <p>{captureGuidance.text}</p>
          <button className="btn btn-primary" onClick={() => setCaptureAttempt((attempt) => attempt + 1)}>
            Retry capture
          </button>
        </section>
      )}

      {!isAnalyzing && panelState.status === 'no-client' && (
        <section className="state-panel">
          <div className="state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.4 3.1-5 7-5s6.4 1.6 7 5" /></svg>
          </div>
          <h2>No client record</h2>
          <p>No history is shown for <strong>{panelState.senderEmail}</strong>.</p>
          <button className="btn btn-primary" onClick={() => handleBindClientManually(panelState.senderEmail)}>
            Create empty client record
          </button>
        </section>
      )}

      {!isAnalyzing && panelState.status === 'unavailable' && (
        <section className="state-panel state-panel-error">
          <div className="state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3zM12 9v5m0 3v.1" /></svg>
          </div>
          <h2>Brief unavailable</h2>
          <p>{panelState.reason}</p>
          <p>Check Gmail capture and local Ollama, then retry.</p>
          <div className="button-row">
            <button className="btn" onClick={() => setCaptureAttempt((attempt) => attempt + 1)}>Retry capture</button>
            {activeEmail && <button className="btn btn-primary" onClick={() => void processEmail(activeEmail)}>Try again</button>}
          </div>
        </section>
      )}

      {!isAnalyzing && panelState.status === 'ready' && (
        <>
          {actionMessage && <p role="status" className="action-notice">{actionMessage}</p>}

          <section className="client-summary" aria-labelledby="client-heading">
            <h2 id="client-heading">{panelState.briefing.client.displayName}</h2>
            <p className="client-email">{panelState.briefing.client.email}</p>
            <div className="coverage-line">
              <span className="coverage-count">{panelState.briefing.coverage.recordedMessageCount} recorded messages</span>
              <span className="coverage-divider" aria-hidden="true">·</span>
              <span>{panelState.briefing.coverage.completeness === 'partial' ? 'Partial history' : 'Coverage unknown'}</span>
            </div>
            <p className="coverage-note">{panelState.briefing.coverage.importedMessageCount} imported · Only captured threads and imports are included.</p>
          </section>

          {engineStatus === 'ollama-live' && (
            <p className="model-note" role="status">
              New suggestions from local Qwen3 <span aria-hidden="true">·</span> Review before confirming
            </p>
          )}

          <section className="brief-section" aria-labelledby="attention-heading">
            <div className="section-heading">
              <h2 id="attention-heading">Needs attention</h2>
              <span className="section-count">{attentionItems.length}</span>
            </div>
            <p className="section-caption">Concerns and open commitments</p>
            {attentionItems.length === 0 ? (
              <p className="empty-list-note">No open concerns or commitments in recorded messages.</p>
            ) : (
              <div className="context-list">
                {attentionPreview.map((item) => <ContextRow key={item.id} item={item} onReview={handleReview} onToggleResolve={handleToggleResolve} />)}
                {moreAttention.length > 0 && (
                  <details className="more-items">
                    <summary>Show {moreAttention.length} more</summary>
                    <div className="context-list">
                      {moreAttention.map((item) => <ContextRow key={item.id} item={item} onReview={handleReview} onToggleResolve={handleToggleResolve} />)}
                    </div>
                  </details>
                )}
              </div>
            )}
            {resolvedItems.length > 0 && (
              <details className="resolved-items">
                <summary>Resolved <span>{resolvedItems.length}</span></summary>
                <div className="context-list">
                  {resolvedItems.map((item) => <ContextRow key={item.id} item={item} onReview={handleReview} onToggleResolve={handleToggleResolve} />)}
                </div>
              </details>
            )}
          </section>

          <section className="brief-section secondary-section" aria-labelledby="context-heading">
            <div className="section-heading">
              <h2 id="context-heading">More context</h2>
              <span className="section-count">{otherContext.length}</span>
            </div>
            <p className="section-caption">Goals, preferences and recent signals</p>
            {otherContext.length === 0 ? (
              <p className="empty-list-note">No goals, preferences, or signals recorded.</p>
            ) : (
              <div className="context-list">
                {contextPreview.map((item) => <ContextRow key={item.id} item={item} onReview={handleReview} onToggleResolve={handleToggleResolve} />)}
                {moreContext.length > 0 && (
                  <details className="more-items">
                    <summary>Show {moreContext.length} more</summary>
                    <div className="context-list">
                      {moreContext.map((item) => <ContextRow key={item.id} item={item} onReview={handleReview} onToggleResolve={handleToggleResolve} />)}
                    </div>
                  </details>
                )}
              </div>
            )}
          </section>

          <button className="history-toggle" aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}>
            <span>History & tools</span>
            <span className="history-toggle-meta">{clientHistory.length} messages</span>
            <svg className={showHistory ? 'is-open' : ''} viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
          </button>

          {showHistory && (
            <section className="history-panel" aria-label="History and tools">
              <p className="history-limit">History is partial; the mailbox is not synchronized. A missing reply in recorded messages does not prove none was sent.</p>
              <p className="history-dates">
                {clientHistory.filter((email) => !email.sentAt).length} messages have unknown dates
                {panelState.briefing.coverage.earliestSentAt && <> · {panelState.briefing.coverage.earliestSentAt} – {panelState.briefing.coverage.latestSentAt}</>}
              </p>
              <HistoryImportForm key={panelState.briefing.client.id} clientEmail={panelState.briefing.client.email} busy={historyBusy} onImport={handleImport} />
              <button className="btn" disabled={historyBusy || clientHistory.length === 0} onClick={() => void handleAnalyzeHistory()}>
                {historyBusy ? 'Analyzing history…' : 'Analyze history with Qwen3'}
              </button>
              {activeThread.current && <button className="btn" disabled={historyBusy} onClick={() => setCaptureAttempt((attempt) => attempt + 1)}>Retry thread capture</button>}
              {activeEmail && <button className="btn" disabled={historyBusy} onClick={() => void processEmail(activeEmail)}>Reanalyze current message</button>}
              <div className="recorded-messages">
                <h3>Recorded messages</h3>
                {clientHistory.length === 0 ? <p>No messages recorded.</p> : clientHistory.map((email) => (
                  <details className="recorded-message" key={email.id}>
                    <summary>
                      <span className={`message-direction is-${email.direction}`}>
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d={email.direction === 'outgoing' ? 'M5 15 15 5M6 5h9v9' : 'M15 5 5 15M5 6v9h9'} /></svg>
                        <span className="sr-only">{email.direction === 'outgoing' ? 'Manager reply:' : 'Client message:'}</span>
                      </span>
                      <span className="message-summary-copy">{email.subject}</span>
                      <span className="message-date">{email.sentAt ?? 'Date unknown'}</span>
                    </summary>
                    <p className="message-origin">{email.direction === 'outgoing' ? 'Manager reply' : 'Client message'} · {email.source === 'demo-import' ? 'Imported fictional history' : 'Captured from open Gmail thread'}</p>
                    <p className="message-body">{email.body}</p>
                    <p className="message-address">From {email.senderEmail}{email.recipientEmail && <> · To {email.recipientEmail}</>}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="app-footer">Local processing <span aria-hidden="true">·</span> Manager-reviewed context</footer>
    </main>
  );
}
