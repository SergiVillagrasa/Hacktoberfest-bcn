import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type {
  CaptureMessage,
  ContextItem,
  EmailContext,
  PanelState,
  HistoryImport,
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
import { GmailThreadImport } from '../../components/history/GmailThreadImport';
import { HistoryImportForm } from '../../components/history/HistoryImportForm';
import { SelectionGuard } from '../../lib/selection-guard';

export function App() {
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

  // Listen for Gmail messages from the content script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.runtime?.onMessage) return;

    function handleMessage(message: unknown, sender?: { id?: string; url?: string; tab?: { active?: boolean } }) {
      if (sender && (sender.id !== browser.runtime.id || !sender.url?.startsWith('https://mail.google.com/') || !sender.tab?.active)) return;
      if (!isCaptureMessage(message)) return;
      const capture = message as CaptureMessage;

      if (capture.type === 'email/cleared') {
        selection.begin();
        setEngineStatus('idle');
        setActionMessage('');
        setAnalysisCached(false);
        setHistoryBusy(false);
        setClientHistory([]);
        setShowHistory(false);
        setIsAnalyzing(false);
        setActiveEmail(null);
        setPanelState({ status: 'empty', ...(capture.reason ? { reason: capture.reason } : {}) });
      } else if (capture.type === 'email/captured') {
        void processEmail(capture.email, capture.requestId);
      }
    }

    chromeApi.runtime.onMessage.addListener(handleMessage);
    const generation = selection.snapshot();
    void browser.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab?.id === undefined) throw new Error('No active Gmail tab');
      const replay: unknown = await browser.tabs.sendMessage(tab.id, { type: 'capture/current' });
      if (!isCaptureMessage(replay)) throw new Error('Invalid capture response');
      if (selection.isCurrent(generation)) handleMessage(replay);
    }).catch(() => {
      if (selection.isCurrent(generation)) setPanelState({ status: 'empty', reason: 'capture-disconnected' });
    });
    return () => {
      selection.begin();
      chromeApi.runtime.onMessage.removeListener(handleMessage);
    };
  }, [processEmail, selection, captureAttempt]);

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
    if (selection.isCurrent(generation) && activeEmail) {
      void processEmail(activeEmail);
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

  const handleThreadImport = async (data: HistoryImport) => {
    const generation = selection.snapshot();
    const result = await service.importGmailThread(data);
    if (selection.isCurrent(generation)) {
      setPanelState({ status: 'ready', requestId: crypto.randomUUID(), briefing: result.briefing });
      setClientHistory(result.emails);
      setEngineStatus('idle');
      setAnalysisCached(false);
      setActionMessage('Thread imported as fictional history. Analyze it to generate suggestions.');
    }
  };

  const handleAnalyzeHistory = async () => {
    if (panelState.status !== 'ready' || historyBusy) return;
    const generation = selection.snapshot();
    setHistoryBusy(true);
    setActionMessage('Analyzing recorded messages with Gemma4…');
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

  const commitments = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter((i) => i.kind === 'commitment');
  }, [panelState]);

  const concerns = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter((i) => i.kind === 'concern');
  }, [panelState]);

  const goalsAndPreferences = useMemo(() => {
    if (panelState.status !== 'ready') return [];
    return panelState.briefing.items.filter(
      (i) => i.kind === 'goal' || i.kind === 'preference' || i.kind === 'communication_signal'
    );
  }, [panelState]);

  const captureReason = panelState.status === 'empty' ? panelState.reason : undefined;
  const captureGuidance = captureReason === 'outgoing-message'
    ? { title: 'Manager reply open', text: 'This is an outgoing reply. Use “Preview expanded thread” to import this reply together with the expanded client messages, or collapse it to analyze a single incoming message.' }
    : captureReason === 'account-unavailable'
      ? { title: 'Gmail account could not be identified', text: 'Reload Gmail and retry capture. Account identity is needed to distinguish incoming messages from your replies.' }
      : captureReason === 'message-unreadable'
        ? { title: 'The open message could not be read', text: 'Expand the incoming client message and retry. If this continues, reload Gmail. Collapsed messages and other conversations are not read.' }
        : captureReason === 'capture-disconnected'
          ? { title: 'Reconnect to Gmail', text: 'Select the Gmail tab. If you reloaded the extension, reload Gmail too, then reopen the panel from the extension icon.' }
          : { title: 'No message open', text: 'Expand a fictional incoming message in Gmail. The assistant will retrieve context only for its matching client.' };

  return (
    <main>
      <header>
        <div className="brand-title">
          <h1>Client Briefing AI</h1>
          <div className="engine-status-badge-wrapper">
            {isAnalyzing ? (
              <span className="badge-engine analyzing" title="Processing email with local AI...">
                <span className="pulse-spinner" /> Analyzing…
              </span>
            ) : analysisCached ? (
              <span className="badge-engine idle">Saved Gemma4 analysis</span>
            ) : engineStatus === 'ollama-live' ? (
              <span className="badge-engine live" title="Local AI connected to Ollama (http://127.0.0.1:11434)">
                ● Ollama Gemma4
              </span>
            ) : (
              <span className="badge-engine idle">
                ○ No new inference
              </span>
            )}
          </div>
        </div>
        <p className="subtitle">Evidence-backed context from fictional client messages</p>

        <div className="active-email-banner">
          {activeEmail ? (
            <>
              <span className="live-dot online" />
              <div className="active-email-info">
                <strong>{activeEmail.subject}</strong>
                <span>From: {activeEmail.senderEmail}</span>
              </div>
            </>
          ) : (
            <>
              <span className="live-dot waiting" />
              <span className="active-email-info">{panelState.status === 'ready' ? 'Imported thread history' : captureGuidance.title}</span>
            </>
          )}
        </div>
      </header>

      <GmailThreadImport key={selection.snapshot()} disabled={isAnalyzing || historyBusy}
        {...(panelState.status === 'ready' ? { clientEmail: panelState.briefing.client.email } : {})}
        onImport={handleThreadImport} />

      {/* Loading state */}
      {isAnalyzing && (
        <div className="state-box">
          <div className="analysis-spinner" />
          <h2>Analyzing with the local model…</h2>
          <p>Extracting observations and source evidence from the current message with local AI.</p>
          <span className="analysis-hint">Using local Ollama Gemma4</span>
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && panelState.status === 'empty' && (
        <div className="state-box">
          <h2>{captureGuidance.title}</h2>
          <p>{captureGuidance.text}</p>
          <button className="btn" onClick={() => setCaptureAttempt((attempt) => attempt + 1)}>
            Retry message capture
          </button>
        </div>
      )}

      {/* Unknown Client State */}
      {!isAnalyzing && panelState.status === 'no-client' && (
        <div className="state-box">
          <h2>Unregistered sender</h2>
          <p>
            The sender <strong>{panelState.senderEmail}</strong> has no registered client record.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
            No other client’s information is shown.
          </p>
          <div style={{ marginTop: '14px' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleBindClientManually(panelState.senderEmail)}
            >
              Register client with empty history
            </button>
          </div>
        </div>
      )}

      {/* Error / Unavailable State */}
      {!isAnalyzing && panelState.status === 'unavailable' && (
        <div className="state-box">
          <h2>Service unavailable</h2>
          <p>{panelState.reason}</p>
          <p>Check Ollama and try again. No substitute answers are generated.</p>
          {activeEmail && <button className="btn" onClick={() => void processEmail(activeEmail)}>Try again</button>}
        </div>
      )}

      {/* Ready / Briefing State */}
      {!isAnalyzing && panelState.status === 'ready' && (
        <>
          {/* Active Engine Notice Banner */}
          {engineStatus === 'ollama-live' && (
            <div className="engine-banner banner-live">
              <span className="engine-banner-icon">🟢</span>
              <div className="engine-banner-text">
                <strong>Live Gemma4 result:</strong> New observations come from the local model. Review their interpretation before confirming.
              </div>
            </div>
          )}

          {/* Client Identity & Coverage Card */}
          <div className="client-hero">
            <h2 className="client-name">{panelState.briefing.client.displayName}</h2>
            <div className="client-email">{panelState.briefing.client.email}</div>
            <p className="client-notes">Context extracted from recorded messages</p>
            <div className="coverage-pills">
              <span className="pill">
                {panelState.briefing.coverage.recordedMessageCount} recorded messages
              </span>
              <span className="pill">
                {panelState.briefing.coverage.importedMessageCount} explicitly imported
              </span>
              <span className="pill">Exact quotations; interpretations require review</span>
            </div>
          </div>

          <section className="history-tools" aria-label="Local history">
            <p><strong>Partial history.</strong> Only messages opened in Gmail or manually imported
              are recorded. The mailbox is not synchronized. A missing recorded reply
              does not prove that no reply was sent.</p>
            <p>{clientHistory.filter((email) => !email.sentAt).length} messages with unknown dates.
              {panelState.briefing.coverage.earliestSentAt && <> Known dates: {panelState.briefing.coverage.earliestSentAt} – {panelState.briefing.coverage.latestSentAt}.</>}</p>
            <HistoryImportForm key={panelState.briefing.client.id} clientEmail={panelState.briefing.client.email}
              busy={historyBusy} onImport={handleImport} />
            <button className="btn" disabled={historyBusy || clientHistory.length === 0}
              onClick={() => void handleAnalyzeHistory()}>
              {historyBusy ? 'Analyzing history…' : 'Analyze history with Gemma4'}
            </button>
            {actionMessage && <p role="status">{actionMessage}</p>}
            {activeEmail && <button className="btn" disabled={historyBusy}
              onClick={() => void processEmail(activeEmail)}>Reopen current message</button>}
          </section>

          {/* Commitments & Agreements Section */}
          <section className="section-card">
            <h3 className="section-title">
              Commitments
              <span className="section-count">{commitments.length}</span>
            </h3>
            {commitments.length === 0 ? (
              <p className="status">No commitments recorded.</p>
            ) : (
              commitments.map((item) => (
                <div
                  key={item.id}
                  className={`item-card ${item.resolution === 'resolved' ? 'resolved' : ''}`}
                >
                  <div className="item-header">
                    <p className="item-text">{item.text}</p>
                    <span className="tag-badge tag-commitment">
                      {item.resolution === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                  </div>

                  <div className="evidence-box">
                    &ldquo;{item.sourceExcerpt}&rdquo;
                    <div className="evidence-meta">
                      <span>Source: {item.sourceEmailId}</span>
                      <span>Review: {item.review}</span>
                      {item.review === 'suggested' ? (
                        <span className={`origin-badge ${item.inference === 'ollama-live' ? 'origin-live' : 'origin-fallback'}`}>
                          {item.inference === 'ollama-live' ? 'Suggested by Gemma4' : 'Origin not recorded'}
                        </span>
                      ) : (
                        <span className="origin-badge" style={{ background: '#e2e8f0', color: '#475569' }}>
                          Reviewed by manager
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="item-actions">
                    {item.review === 'suggested' && (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReview(item, 'confirmed')}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleReview(item, 'dismissed')}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleResolve(item)}
                    >
                      {item.resolution === 'resolved' ? 'Reopen' : 'Mark resolved'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Concerns Section */}
          <section className="section-card">
            <h3 className="section-title">
              Client concerns
              <span className="section-count">{concerns.length}</span>
            </h3>
            {concerns.length === 0 ? (
              <p className="status">No concerns recorded.</p>
            ) : (
              concerns.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <p className="item-text">{item.text}</p>
                    <span className="tag-badge tag-concern">Concern</span>
                  </div>

                  <div className="evidence-box">
                    &ldquo;{item.sourceExcerpt}&rdquo;
                    <div className="evidence-meta">
                      <span>Source: {item.sourceEmailId}</span>
                      {item.review === 'suggested' ? (
                        <span className={`origin-badge ${item.inference === 'ollama-live' ? 'origin-live' : 'origin-fallback'}`}>
                          {item.inference === 'ollama-live' ? 'Suggested by Gemma4' : 'Origin not recorded'}
                        </span>
                      ) : (
                        <span className="origin-badge" style={{ background: '#e2e8f0', color: '#475569' }}>
                          Reviewed by manager
                        </span>
                      )}
                    </div>
                  </div>

                  {item.review === 'suggested' && (
                    <div className="item-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleReview(item, 'confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleReview(item, 'dismissed')}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Goals & Preferences Section */}
          <section className="section-card">
            <h3 className="section-title">
              Goals, preferences and recent signals
              <span className="section-count">{goalsAndPreferences.length}</span>
            </h3>
            {goalsAndPreferences.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <p className="item-text">{item.text}</p>
                  <span className={`tag-badge tag-${item.kind}`}>{item.kind}</span>
                </div>

                <div className="evidence-box">
                  &ldquo;{item.sourceExcerpt}&rdquo;
                  <div className="evidence-meta">
                    <span>Source: {item.sourceEmailId}</span>
                    {item.review === 'suggested' ? (
                      <span className={`origin-badge ${item.inference === 'ollama-live' ? 'origin-live' : 'origin-fallback'}`}>
                        {item.inference === 'ollama-live' ? 'Suggested by Gemma4' : 'Origin not recorded'}
                      </span>
                    ) : (
                      <span className="origin-badge" style={{ background: '#e2e8f0', color: '#475569' }}>
                        Reviewed by manager
                      </span>
                    )}
                  </div>
                </div>

                {item.review === 'suggested' && (
                  <div className="item-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleReview(item, 'confirmed')}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleReview(item, 'dismissed')}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Collapsible history view */}
          <div className="btn-group">
            <button
              className="btn btn-sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide recorded messages' : 'View recorded messages'}
            </button>
          </div>

          {showHistory && (
            <section className="section-card">
              <h3 className="section-title">Recorded messages</h3>
              {clientHistory.map((email) => (
                <div key={email.id} className="item-card">
                  <div className="item-header">
                    <strong>{email.subject}</strong>
                    <span className="tag-badge">
                      {email.direction === 'outgoing' ? 'Manager' : 'Client'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {email.sentAt ?? 'Unknown date'} · From: {email.senderEmail}
                    {email.recipientEmail && <> · To: {email.recipientEmail}</>}
                    <div>{email.source === 'demo-import' ? 'Manually imported (fictional)' : 'Captured from the open Gmail message'}</div>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>{email.body}</p>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <footer>
        <span>Hacktoberfest Barcelona</span>
        <span>Local Client Assistant</span>
      </footer>
    </main>
  );
}
