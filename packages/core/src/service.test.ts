import { describe, expect, it, vi } from 'vitest';
import type {
  ClientProfile,
  ContextCandidate,
  EmailContext,
} from '@briefing/contracts';
import {
  ClientContextService,
  computeCoverage,
  validateCandidateEvidence,
  type HistoryPort,
  type InferencePort,
  type ProfilePort,
} from './index';

describe('Evidence validation', () => {
  const sourceEmail: EmailContext = {
    id: 'email-1',
    senderEmail: 'client@example.com',
    subject: 'Acuerdo de comisiones y plazo de amortización',
    body: 'Hola Marc, según lo hablado en la reunión, acordamos una comisión del 0.25% y amortización a 20 años.',
    sentAt: '2026-10-20T10:00:00Z',
    direction: 'incoming',
    source: 'demo-import',
  };

  it('accepts exact substring match from allowed sources', () => {
    const candidate: ContextCandidate = {
      kind: 'commitment',
      text: 'Comisión acordada del 0.25%',
      sourceEmailId: 'email-1',
      sourceExcerpt: 'comisión del 0.25%',
    };

    expect(validateCandidateEvidence(candidate, [sourceEmail])).toBe(true);
  });

  it('rejects candidate if excerpt is not in the source email body', () => {
    const candidate: ContextCandidate = {
      kind: 'commitment',
      text: 'Comisión acordada del 0.10%',
      sourceEmailId: 'email-1',
      sourceExcerpt: 'comisión del 0.10%',
    };

    expect(validateCandidateEvidence(candidate, [sourceEmail])).toBe(false);
  });

  it('rejects candidate if sourceEmailId belongs to another client', () => {
    const candidate: ContextCandidate = {
      kind: 'commitment',
      text: 'Comisión acordada',
      sourceEmailId: 'other-email-99',
      sourceExcerpt: 'comisión del 0.25%',
    };

    expect(validateCandidateEvidence(candidate, [sourceEmail])).toBe(false);
  });
});

describe('ClientContextService', () => {
  const profile: ClientProfile = {
    id: 'client-1',
    email: 'client@example.com',
    displayName: 'Pau Garcia',
    notes: 'Pacto comercial acordado',
    items: [],
  };

  const currentEmail: EmailContext = {
    id: 'email-current',
    senderEmail: 'client@example.com',
    subject: 'Duda con el tipo de interés',
    body: 'Hola Marc, me preocupa si el tipo de interés subirá el próximo mes.',
    sentAt: '2026-10-24T11:00:00Z',
    direction: 'incoming',
    source: 'gmail',
  };

  function createMockPorts() {
    let savedProfile = { ...profile };
    let savedHistory: EmailContext[] = [];

    const historyPort: HistoryPort = {
      list: vi.fn(async () => ({
        emails: savedHistory,
        coverage: computeCoverage(savedHistory),
      })),
      save: vi.fn(async (_id, emails) => {
        savedHistory = [...emails];
      }),
    };

    const profilePort: ProfilePort = {
      findByEmail: vi.fn(async (email) => (email === savedProfile.email ? savedProfile : undefined)),
      findById: vi.fn(async (id) => (id === savedProfile.id ? savedProfile : undefined)),
      save: vi.fn(async (p) => {
        savedProfile = { ...p };
      }),
    };

    const inferencePort: InferencePort = {
      extract: vi.fn(async () => [
        {
          kind: 'concern' as const,
          text: 'Preocupación por la subida del tipo de interés',
          sourceEmailId: 'email-current',
          sourceExcerpt: 'me preocupa si el tipo de interés subirá',
        },
      ]),
    };

    return { historyPort, profilePort, inferencePort, getProfile: () => savedProfile };
  }

  it('extracts suggestions with validated evidence and updates profile', async () => {
    const { historyPort, profilePort, inferencePort, getProfile } = createMockPorts();
    const service = new ClientContextService({ historyPort, profilePort, inferencePort });

    const result = await service.analyzeEmail(currentEmail, profile);
    expect(result.status).toBe('analyzed');
    if (result.status === 'analyzed') {
      expect(result.suggestions).toHaveLength(1);
      const first = result.suggestions[0];
      expect(first).toBeDefined();
      if (first) {
        expect(first.kind).toBe('concern');
        expect(first.review).toBe('suggested');
        expect(first.resolution).toBe('open');
        expect(first.sourceExcerpt).toBe('me preocupa si el tipo de interés subirá');
      }
    }

    expect(getProfile().items).toHaveLength(1);
  });

  it('rejects analysis if email does not match client profile (client isolation)', async () => {
    const { historyPort, profilePort, inferencePort } = createMockPorts();
    const service = new ClientContextService({ historyPort, profilePort, inferencePort });

    const strangerEmail: EmailContext = {
      ...currentEmail,
      senderEmail: 'stranger@example.com',
    };

    const result = await service.analyzeEmail(strangerEmail, profile);
    expect(result.status).toBe('no-client');
    expect(inferencePort.extract).not.toHaveBeenCalled();
  });

  it('allows manager to review and confirm or dismiss items', async () => {
    const { historyPort, profilePort, inferencePort, getProfile } = createMockPorts();
    const service = new ClientContextService({ historyPort, profilePort, inferencePort });

    const result = await service.analyzeEmail(currentEmail, profile);
    if (result.status !== 'analyzed') throw new Error('Expected analyzed');
    const first = result.suggestions[0];
    if (!first) throw new Error('Expected suggestion');
    const itemId = first.id;

    await service.reviewItem(profile.id, itemId, 'confirmed');
    expect(getProfile().items[0]?.review).toBe('confirmed');

    await service.resolveItem(profile.id, itemId);
    expect(getProfile().items[0]?.resolution).toBe('resolved');
  });

  it('generates briefing with client identity, history coverage, and items', async () => {
    const { historyPort, profilePort, inferencePort } = createMockPorts();
    const service = new ClientContextService({ historyPort, profilePort, inferencePort });

    await service.importHistory(profile.id, [
      {
        id: 'hist-1',
        senderEmail: profile.email,
        subject: 'Acuerdo inicial',
        body: 'Confirmamos la reunión.',
        sentAt: '2026-10-10T09:00:00Z',
        direction: 'incoming',
        source: 'demo-import',
      },
    ]);

    await service.analyzeEmail(currentEmail, profile);

    const briefing = await service.getBriefing(profile.email);
    expect(briefing).toBeDefined();
    expect(briefing?.client.email).toBe(profile.email);
    expect(briefing?.coverage.recordedMessageCount).toBe(1);
    expect(briefing?.coverage.importedMessageCount).toBe(1);
    expect(briefing?.items).toHaveLength(1);
  });
});
