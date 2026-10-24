import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CaptureMessage,
  ClientBriefing,
  ContextItem,
  EmailContext,
  PanelState,
} from '@briefing/contracts';
import { isCaptureMessage } from '@briefing/contracts';
import { ClientContextService } from '@briefing/core';
import {
  LocalStorageHistoryPort,
  LocalStorageProfilePort,
  OllamaInferenceAdapter,
  SAMPLE_CLIENT,
  SAMPLE_CURRENT_EMAIL,
  SAMPLE_HISTORICAL_EMAILS,
} from '@briefing/infra';
import '../../assets/panel.css';

export function App() {
  const profilePort = useMemo(() => new LocalStorageProfilePort(), []);
  const historyPort = useMemo(() => new LocalStorageHistoryPort(), []);
  const inferenceAdapter = useMemo(() => new OllamaInferenceAdapter({ useFallbackOnOffline: true }), []);
  const service = useMemo(
    () =>
      new ClientContextService({
        profilePort,
        historyPort,
        inferencePort: inferenceAdapter,
      }),
    [profilePort, historyPort, inferenceAdapter]
  );

  const [panelState, setPanelState] = useState<PanelState>({ status: 'empty' });
  const [activeEmail, setActiveEmail] = useState<EmailContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize sample data on mount
  useEffect(() => {
    async function initData() {
      const existing = await profilePort.findByEmail(SAMPLE_CLIENT.email);
      if (!existing) {
        await profilePort.save(SAMPLE_CLIENT);
        await historyPort.save(SAMPLE_CLIENT.id, SAMPLE_HISTORICAL_EMAILS);
      }
    }
    void initData();
  }, [profilePort, historyPort]);

  const processEmail = useCallback(
    async (email: EmailContext) => {
      setActiveEmail(email);
      setIsAnalyzing(true);
      setPanelState({ status: 'loading', requestId: email.id });

      try {
        const profile = await profilePort.findByEmail(email.senderEmail);
        if (!profile) {
          setPanelState({ status: 'no-client', senderEmail: email.senderEmail });
          setIsAnalyzing(false);
          return;
        }

        // Save visible message and run AI analysis
        await service.captureEmail(email);
        await service.analyzeEmail(email, profile);

        const briefing = await service.getBriefing(email.senderEmail);
        if (briefing) {
          setPanelState({ status: 'ready', requestId: email.id, briefing });
        } else {
          setPanelState({ status: 'no-client', senderEmail: email.senderEmail });
        }
      } catch (err) {
        setPanelState({
          status: 'unavailable',
          reason: err instanceof Error ? err.message : 'Error desconegut durant l\'anàlisi',
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [profilePort, service]
  );

  // Listen for Gmail messages from the content script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.runtime?.onMessage) return;

    function handleMessage(message: unknown) {
      if (!isCaptureMessage(message)) return;
      const capture = message as CaptureMessage;

      if (capture.type === 'email/cleared') {
        setActiveEmail(null);
        setPanelState({ status: 'empty' });
      } else if (capture.type === 'email/captured') {
        void processEmail(capture.email);
      }
    }

    chromeApi.runtime.onMessage.addListener(handleMessage);
    return () => {
      chromeApi.runtime.onMessage.removeListener(handleMessage);
    };
  }, [processEmail]);

  // Actions for manager review & resolution
  const handleReview = async (item: ContextItem, review: 'confirmed' | 'dismissed') => {
    if (panelState.status !== 'ready') return;
    await service.reviewItem(panelState.briefing.client.id, item.id, review);
    const updated = await service.getBriefing(panelState.briefing.client.email);
    if (updated) {
      setPanelState({ ...panelState, briefing: updated });
    }
  };

  const handleToggleResolve = async (item: ContextItem) => {
    if (panelState.status !== 'ready') return;
    await service.resolveItem(panelState.briefing.client.id, item.id);
    const updated = await service.getBriefing(panelState.briefing.client.email);
    if (updated) {
      setPanelState({ ...panelState, briefing: updated });
    }
  };

  // Quick buttons for demo presentation
  const handleSimulateAgreementEmail = () => {
    void processEmail(SAMPLE_CURRENT_EMAIL);
  };

  const handleSimulateUnknownEmail = () => {
    const unknownEmail: EmailContext = {
      id: `stranger-${Date.now()}`,
      senderEmail: 'proveidor.extern@desconegut.com',
      subject: 'Oferta de serveis de consultoria',
      body: 'Benvolgut gestor, li enviem la nostra proposta.',
      sentAt: new Date().toISOString(),
      direction: 'incoming',
      source: 'gmail',
    };
    void processEmail(unknownEmail);
  };

  const handleResetData = async () => {
    await profilePort.save(SAMPLE_CLIENT);
    await historyPort.save(SAMPLE_CLIENT.id, SAMPLE_HISTORICAL_EMAILS);
    if (activeEmail && activeEmail.senderEmail === SAMPLE_CLIENT.email) {
      void processEmail(activeEmail);
    } else {
      setPanelState({ status: 'empty' });
      setActiveEmail(null);
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

  return (
    <main>
      <header>
        <div className="brand-title">
          <h1>Assessor Bancari AI</h1>
          <span className="badge-live">Ollama Qwen3</span>
        </div>
        <p className="subtitle">Guia de context i pactes comercials en temps real</p>
      </header>

      {/* Demo helper toolbar */}
      <div className="demo-bar">
        <span className="demo-bar-title">Eines per a la Demo</span>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={handleSimulateAgreementEmail}>
            Simular correu del Pacte (Montserrat)
          </button>
          <button className="btn" onClick={handleSimulateUnknownEmail}>
            Simular desconegut
          </button>
          <button className="btn btn-sm" onClick={handleResetData}>
            Restablir dades
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="state-box">
          <h2>Analitzant amb model local...</h2>
          <p>Extraient observacions, pactes i evidències literals amb Qwen3:1.7B.</p>
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && panelState.status === 'empty' && (
        <div className="state-box">
          <h2>Cap missatge connectat</h2>
          <p>Obre un correu a Gmail o fes clic a &quot;Simular correu del Pacte&quot; per carregar el context.</p>
        </div>
      )}

      {/* Unknown Client State */}
      {!isAnalyzing && panelState.status === 'no-client' && (
        <div className="state-box">
          <h2>Remitent no registrat</h2>
          <p>
            El remitent <strong>{panelState.senderEmail}</strong> no correspon a cap client. Per
            seguretat i aïllament, no es revela informació d&apos;altres clients.
          </p>
        </div>
      )}

      {/* Error / Unavailable State */}
      {!isAnalyzing && panelState.status === 'unavailable' && (
        <div className="state-box">
          <h2>Servei no disponible</h2>
          <p>{panelState.reason}</p>
        </div>
      )}

      {/* Ready / Briefing State */}
      {!isAnalyzing && panelState.status === 'ready' && (
        <>
          {/* Client Identity & Coverage Card */}
          <div className="client-hero">
            <h2 className="client-name">{panelState.briefing.client.displayName}</h2>
            <div className="client-email">{panelState.briefing.client.email}</div>
            <p className="client-notes">
              Pacte de finançament de maquinària verda i bonificació de comissions
            </p>
            <div className="coverage-pills">
              <span className="pill">
                {panelState.briefing.coverage.recordedMessageCount} missatges registrats
              </span>
              <span className="pill">
                {panelState.briefing.coverage.importedMessageCount} de l&apos;historial
              </span>
              <span className="pill">Evidències 100% verificades</span>
            </div>
          </div>

          {/* Commitments & Agreements Section */}
          <section className="section-card">
            <h3 className="section-title">
              Pactes i Compromisos Pendents
              <span className="section-count">{commitments.length}</span>
            </h3>
            {commitments.length === 0 ? (
              <p className="status">No hi ha compromisos pendents registrats.</p>
            ) : (
              commitments.map((item) => (
                <div
                  key={item.id}
                  className={`item-card ${item.resolution === 'resolved' ? 'resolved' : ''}`}
                >
                  <div className="item-header">
                    <p className="item-text">{item.text}</p>
                    <span className="tag-badge tag-commitment">
                      {item.resolution === 'resolved' ? 'Resolt' : 'Obert'}
                    </span>
                  </div>

                  <div className="evidence-box">
                    &ldquo;{item.sourceExcerpt}&rdquo;
                    <div className="evidence-meta">
                      <span>Font: {item.sourceEmailId}</span>
                      <span>Estat: {item.review}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    {item.review === 'suggested' && (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReview(item, 'confirmed')}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleReview(item, 'dismissed')}
                        >
                          Descartar
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleResolve(item)}
                    >
                      {item.resolution === 'resolved' ? 'Reobrir' : 'Marcar com a resolt'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Concerns Section */}
          <section className="section-card">
            <h3 className="section-title">
              Inquietuds del Client
              <span className="section-count">{concerns.length}</span>
            </h3>
            {concerns.length === 0 ? (
              <p className="status">Cap inquietud detectada.</p>
            ) : (
              concerns.map((item) => (
                <div
                  key={item.id}
                  className={`item-card ${item.resolution === 'resolved' ? 'resolved' : ''}`}
                >
                  <div className="item-header">
                    <p className="item-text">{item.text}</p>
                    <span className="tag-badge tag-concern">
                      {item.resolution === 'resolved' ? 'Resolt' : 'Inquietud'}
                    </span>
                  </div>

                  <div className="evidence-box">
                    &ldquo;{item.sourceExcerpt}&rdquo;
                    <div className="evidence-meta">
                      <span>Font: {item.sourceEmailId}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleResolve(item)}
                    >
                      {item.resolution === 'resolved' ? 'Reobrir' : 'Marcar atesa'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Goals and Preferences Section */}
          <section className="section-card">
            <h3 className="section-title">
              Objectius i Preferències
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
                    <span>Font: {item.sourceEmailId}</span>
                  </div>
                </div>

                {item.review === 'suggested' && (
                  <div className="item-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleReview(item, 'confirmed')}
                    >
                      Confirmar
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleReview(item, 'dismissed')}
                    >
                      Descartar
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
              {showHistory ? 'Amagar historial de correus' : 'Veure fil històric complet'}
            </button>
          </div>

          {showHistory && (
            <section className="section-card">
              <h3 className="section-title">Historial de Missatges Intercanviats</h3>
              {SAMPLE_HISTORICAL_EMAILS.map((email) => (
                <div key={email.id} className="item-card">
                  <div className="item-header">
                    <strong>{email.subject}</strong>
                    <span className="tag-badge">
                      {email.direction === 'outgoing' ? 'Gestor' : 'Client'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {email.sentAt} · De: {email.senderEmail}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>{email.body}</p>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <footer>
        <span>Hacktoberfest Barcelona · Prototype</span>
        <span>Dades fictícies de demostració</span>
      </footer>
    </main>
  );
}
