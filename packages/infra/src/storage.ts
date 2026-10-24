import type {
  ClientProfile,
  EmailContext,
  HistoryCoverage,
} from '@briefing/contracts';
import type { AnalysisCachePort, HistoryPort, ProfilePort } from '@briefing/core';
import { computeCoverage } from '@briefing/core';

interface StorageBackend {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

class MemoryStorageBackend implements StorageBackend {
  private store = new Map<string, unknown>();

  async get(keys: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (this.store.has(key)) {
        result[key] = this.store.get(key);
      }
    }
    return result;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.store.set(key, value);
    }
  }
}

// Minimal interface for chrome.storage.local
interface ChromeStorageLocalLike {
  get(keys: string[], callback: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
}

class ChromeStorageBackend implements StorageBackend {
  private lastError(): string | undefined {
    const chromeApi = (globalThis as typeof globalThis & {
      chrome?: { runtime?: { lastError?: { message?: string } } };
    }).chrome;
    return chromeApi?.runtime?.lastError?.message;
  }

  private get localStore(): ChromeStorageLocalLike {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).chrome.storage.local as ChromeStorageLocalLike;
  }

  async get(keys: string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.localStore.get(keys, (res: Record<string, unknown>) => {
        const error = this.lastError();
        if (error) reject(new Error(error)); else resolve(res || {});
      });
    });
  }

  async set(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.localStore.set(items, () => {
        const error = this.lastError();
        if (error) reject(new Error(error)); else resolve();
      });
    });
  }
}

function resolveStorageBackend(): StorageBackend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof globalThis !== 'undefined' && (globalThis as any).chrome?.storage?.local) {
    return new ChromeStorageBackend();
  }
  return new MemoryStorageBackend();
}

export class LocalStorageProfilePort implements ProfilePort {
  constructor(private backend: StorageBackend = resolveStorageBackend()) {}

  async findByEmail(senderEmail: string): Promise<ClientProfile | undefined> {
    return this.readProfile(`profile:email:${senderEmail.toLowerCase()}`);
  }

  async findById(clientId: string): Promise<ClientProfile | undefined> {
    return this.readProfile(`profile:id:${clientId}`);
  }

  private async readProfile(key: string): Promise<ClientProfile | undefined> {
    const data = await this.backend.get([key]);
    const profile = (data[key] as ClientProfile) || undefined;
    if (!profile) return undefined;
    const migrationKey = `migration:live-only:profile:${profile.id}`;
    const migration = await this.backend.get([migrationKey]);
    if (migration[migrationKey] === true) return profile;
    // One-time cleanup of the old bundled answers. Future explicit imports may
    // legitimately reuse their IDs, so never treat an ID as permanently forbidden.
    const items = profile.items.filter((item) => item.inference === 'ollama-live'
      && !/^(m-rovira-0[1-4]|sergi-msg-0[1-3])$/.test(item.sourceEmailId));
    const cleaned = { ...profile, items, notes: '' };
    await this.backend.set({
      [`profile:email:${profile.email.toLowerCase()}`]: cleaned,
      [`profile:id:${profile.id}`]: cleaned,
      [migrationKey]: true,
    });
    return cleaned;
  }

  async save(profile: ClientProfile): Promise<void> {
    const emailKey = `profile:email:${profile.email.toLowerCase()}`;
    const idKey = `profile:id:${profile.id}`;
    await this.backend.set({
      [emailKey]: profile,
      [idKey]: profile,
    });
  }
}

export class LocalStorageHistoryPort implements HistoryPort {
  constructor(private backend: StorageBackend = resolveStorageBackend()) {}

  async list(clientId: string): Promise<{ emails: EmailContext[]; coverage: HistoryCoverage }> {
    const key = `history:${clientId}`;
    const migrationKey = `migration:live-only:history:${clientId}`;
    const data = await this.backend.get([key, migrationKey]);
    const stored = (data[key] as EmailContext[]) || [];
    const emails = data[migrationKey] === true ? stored : stored.filter((email) =>
      !/^m-rovira-0[1-4]$/.test(email.id) &&
      !(email.source === 'demo-import' && /^sergi-msg-0[1-3]$/.test(email.id)));
    if (data[migrationKey] !== true) {
      await this.backend.set({ [key]: emails, [migrationKey]: true });
    }
    return {
      emails,
      coverage: computeCoverage(emails),
    };
  }

  async save(clientId: string, emails: readonly EmailContext[]): Promise<void> {
    const key = `history:${clientId}`;
    await this.backend.set({
      [key]: [...emails],
    });
  }
}

export class LocalStorageAnalysisCachePort implements AnalysisCachePort {
  constructor(private backend: StorageBackend = resolveStorageBackend()) {}

  private key(clientId: string, emailId: string): string {
    return `analysis:v2:${JSON.stringify([clientId, emailId])}`;
  }

  async get(clientId: string, emailId: string): Promise<string | undefined> {
    const key = this.key(clientId, emailId);
    const data = await this.backend.get([key]);
    return typeof data[key] === 'string' ? data[key] : undefined;
  }

  async save(clientId: string, emailId: string, signature: string): Promise<void> {
    await this.backend.set({ [this.key(clientId, emailId)]: signature });
  }
}
