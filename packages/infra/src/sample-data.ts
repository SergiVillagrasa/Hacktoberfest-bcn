import type { ClientProfile, EmailContext } from '@briefing/contracts';

export const SAMPLE_CLIENT: ClientProfile = {
  id: 'client-montserrat',
  displayName: 'Montserrat Rovira',
  email: 'm.rovira@ficticiabarna.cat',
  notes: 'Clienta d\'empresa familiar de packaging. Negociant acord de finançament de maquinària i rebaixa de comissions.',
  items: [
    {
      id: 'init-item-1',
      kind: 'goal',
      text: 'Objectiu d\'adquirir maquinària verda i instal·lació solar abans de final d\'any',
      sourceEmailId: 'm-rovira-01',
      sourceExcerpt: 'volíem finançar la nova línia de packaging sostenible i les plaques solars abans d\'acabar l\'any',
      review: 'confirmed',
    },
    {
      id: 'init-item-2',
      kind: 'commitment',
      text: 'Compromís del gestor d\'aplicar bonificació del 0.20% en obertura centralitzant rebuts',
      sourceEmailId: 'm-rovira-02',
      sourceExcerpt: 'Em comprometo a aplicar-te la bonificació del 0.20% en la comissió d\'obertura si centralitzes els rebuts de l\'empresa',
      review: 'confirmed',
      resolution: 'open',
    },
  ],
};

export const SAMPLE_HISTORICAL_EMAILS: EmailContext[] = [
  {
    id: 'm-rovira-01',
    senderEmail: 'm.rovira@ficticiabarna.cat',
    subject: 'Pacte comercial: Finançament línia packaging ecològic',
    body: 'Hola Marc, tal com vam comentar a l\'oficina, volíem finançar la nova línia de packaging sostenible i les plaques solars abans d\'acabar l\'any. Ens preocupa molt l\'impacte de les comissions bancàries en el flux de caixa inicial.',
    sentAt: '2026-10-15T09:30:00Z',
    direction: 'incoming',
    source: 'demo-import',
  },
  {
    id: 'm-rovira-02',
    senderEmail: 'gestor.banc@bancdemo.cat',
    subject: 'Re: Pacte comercial: Finançament línia packaging ecològic',
    body: 'Apreciada Montserrat, he revisat la proposta d\'acord amb la direcció de riscos. Em comprometo a aplicar-te la bonificació del 0.20% en la comissió d\'obertura si centralitzes els rebuts de l\'empresa amb nosaltres. Espero la teva confirmació per preparar la pòlissa.',
    sentAt: '2026-10-17T11:15:00Z',
    direction: 'outgoing',
    source: 'demo-import',
  },
  {
    id: 'm-rovira-03',
    senderEmail: 'm.rovira@ficticiabarna.cat',
    subject: 'Re: Pacte comercial: Finançament línia packaging ecològic',
    body: 'Perfecte Marc, ja hem donat ordre d\'adreçar tota la facturació i rebuts a aquest compte. Podem revisar l\'esborrany del pacte de finançament la setmana vinent?',
    sentAt: '2026-10-20T16:45:00Z',
    direction: 'incoming',
    source: 'demo-import',
  },
];

export const SAMPLE_CURRENT_EMAIL: EmailContext = {
  id: 'm-rovira-04',
  senderEmail: 'm.rovira@ficticiabarna.cat',
  subject: 'Estat de la bonificació del pacte de finançament',
  body: 'Hola Marc, ja hem completat el traspàs dels rebuts. Recorda revisar si podem tancar l\'acord amb la comissió bonificada abans de dimarts, ja que hem de signar la comanda amb el proveïdor de maquinària.',
  sentAt: '2026-10-24T10:15:00Z',
  direction: 'incoming',
  source: 'gmail',
};

/**
 * Creates the client profile for the official test inbox conversation defined in docs/sergi/gmail-test-messages.md
 */
export function createClientProfileForTestInbox(clientEmail: string): ClientProfile {
  const normalizedEmail = clientEmail.trim().toLowerCase();
  return {
    id: `client-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    displayName: 'Client Fictici (Pla d\'Estalvi)',
    email: normalizedEmail,
    notes: 'Client particular en procés d\'estalvi per a entrada d\'habitatge. Sol·licita revisió de comissions de manteniment.',
    items: [
      {
        id: 'sergi-item-1',
        kind: 'goal',
        text: 'Objectiu d\'estalvi per a l\'entrada d\'un habitatge aquest any',
        sourceEmailId: 'sergi-msg-01',
        sourceExcerpt: 'This year I’m saving toward a home deposit.',
        review: 'confirmed',
      },
      {
        id: 'sergi-item-2',
        kind: 'preference',
        text: 'Canal de comunicació preferit: correu electrònic',
        sourceEmailId: 'sergi-msg-01',
        sourceExcerpt: 'Email is my preferred way to discuss account questions.',
        review: 'confirmed',
      },
      {
        id: 'sergi-item-3',
        kind: 'commitment',
        text: 'Compromís del gestor d\'enviar els passos per desglossar la comissió abans de divendres',
        sourceEmailId: 'sergi-msg-02',
        sourceExcerpt: 'I’ll send you the steps for finding the fee breakdown on your statement by Friday.',
        review: 'confirmed',
        resolution: 'open',
      },
      {
        id: 'sergi-item-4',
        kind: 'concern',
        text: 'Inquietud per comissió de manteniment mensual i dificultat per trobar el desglossament',
        sourceEmailId: 'sergi-msg-03',
        sourceExcerpt: 'I still can’t find the steps you mentioned in your last email.',
        review: 'confirmed',
        resolution: 'open',
      },
    ],
  };
}

/**
 * Creates the imported historical emails (1 to 3) defined in docs/sergi/gmail-test-messages.md
 */
export function createHistoricalEmailsForTestInbox(
  clientEmail: string,
  managerEmail = 'manager@bancdemo.cat'
): EmailContext[] {
  const normalizedClient = clientEmail.trim().toLowerCase();
  const normalizedManager = managerEmail.trim().toLowerCase();

  return [
    {
      id: 'sergi-msg-01',
      senderEmail: normalizedClient,
      subject: 'Comissions and savings plan',
      body: 'Hello, I noticed a monthly maintenance fee on my statement. Could you show me where I can review its breakdown? This year I’m saving toward a home deposit. Email is my preferred way to discuss account questions.',
      sentAt: '2026-10-21T09:15:00Z',
      direction: 'incoming',
      source: 'demo-import',
    },
    {
      id: 'sergi-msg-02',
      senderEmail: normalizedManager,
      subject: 'Re: Commissions and savings plan',
      body: 'I’ll send you the steps for finding the fee breakdown on your statement by Friday. I won’t make any changes to your account.',
      sentAt: '2026-10-22T11:30:00Z',
      direction: 'outgoing',
      source: 'demo-import',
    },
    {
      id: 'sergi-msg-03',
      senderEmail: normalizedClient,
      subject: 'Re: Commissions and savings plan',
      body: 'I still can’t find the steps you mentioned in your last email. Could you resend them? I’d prefer to keep the details in email.',
      sentAt: '2026-10-23T14:45:00Z',
      direction: 'incoming',
      source: 'demo-import',
    },
  ];
}

