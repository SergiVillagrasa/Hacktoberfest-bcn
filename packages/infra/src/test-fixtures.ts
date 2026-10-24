import type { ClientProfile, EmailContext } from '@briefing/contracts';

export const SAMPLE_CLIENT: ClientProfile = {
  id: 'client-montserrat',
  displayName: 'Montserrat Rovira',
  email: 'm.rovira@ficticiabarna.cat',
  notes: 'Clienta d\'empresa familiar de packaging. Negociant acord de finançament de maquinària i rebaixa de comissions.',
  items: [],
};

export const SAMPLE_HISTORICAL_EMAILS: EmailContext[] = [
  {
    id: 'fixture-email-01',
    senderEmail: 'm.rovira@ficticiabarna.cat',
    subject: 'Pacte comercial: Finançament línia packaging ecològic',
    body: 'Hola Marc, tal com vam comentar a l\'oficina, volíem finançar la nova línia de packaging sostenible i les plaques solars abans d\'acabar l\'any. Ens preocupa molt l\'impacte de les comissions bancàries en el flux de caixa inicial.',
    sentAt: '2026-10-15T09:30:00Z',
    direction: 'incoming',
    source: 'demo-import',
  },
  {
    id: 'fixture-email-02',
    senderEmail: 'gestor.banc@bancdemo.cat',
    subject: 'Re: Pacte comercial: Finançament línia packaging ecològic',
    body: 'Apreciada Montserrat, he revisat la proposta d\'acord amb la direcció de riscos. Em comprometo a aplicar-te la bonificació del 0.20% en la comissió d\'obertura si centralitzes els rebuts de l\'empresa amb nosaltres. Espero la teva confirmació per preparar la pòlissa.',
    sentAt: '2026-10-17T11:15:00Z',
    direction: 'outgoing',
    source: 'demo-import',
  },
  {
    id: 'fixture-email-03',
    senderEmail: 'm.rovira@ficticiabarna.cat',
    subject: 'Re: Pacte comercial: Finançament línia packaging ecològic',
    body: 'Perfecte Marc, ja hem donat ordre d\'adreçar tota la facturació i rebuts a aquest compte. Podem revisar l\'esborrany del pacte de finançament la setmana vinent?',
    sentAt: '2026-10-20T16:45:00Z',
    direction: 'incoming',
    source: 'demo-import',
  },
];

export const SAMPLE_CURRENT_EMAIL: EmailContext = {
  id: 'fixture-email-04',
  senderEmail: 'm.rovira@ficticiabarna.cat',
  subject: 'Estat de la bonificació del pacte de finançament',
  body: 'Hola Marc, ja hem completat el traspàs dels rebuts. Recorda revisar si podem tancar l\'acord amb la comissió bonificada abans de dimarts, ja que hem de signar la comanda amb el proveïdor de maquinària.',
  sentAt: '2026-10-24T10:15:00Z',
  direction: 'incoming',
  source: 'gmail',
};

