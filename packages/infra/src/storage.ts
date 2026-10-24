import type {
  ClientProfile,
  EmailContext,
  HistoryCoverage,
} from '@briefing/contracts';
import type { HistoryPort, ProfilePort } from '@briefing/core';
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
  private get localStore(): ChromeStorageLocalLike {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).chrome.storage.local as ChromeStorageLocalLike;
  }

  async get(keys: string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      this.localStore.get(keys, (res: Record<string, unknown>) => resolve(res || {}));
    });
  }

  async set(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      this.localStore.set(items, () => resolve());
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
    const key = `profile:email:${senderEmail.toLowerCase()}`;
    const data = await this.backend.get([key]);
    return (data[key] as ClientProfile) || undefined;
  }

  async findById(clientId: string): Promise<ClientProfile | undefined> {
    const key = `profile:id:${clientId}`;
    const data = await this.backend.get([key]);
    return (data[key] as ClientProfile) || undefined;
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
    const data = await this.backend.get([key]);
    const emails = (data[key] as EmailContext[]) || [];
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
