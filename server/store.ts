import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export interface EventMapping {
  eventId: string;
  calendarId: string;
  hash: string;
  updatedAt: string;
}

export interface ServerData {
  google?: {
    tokens: string; // encrypted JSON {access_token, refresh_token, expiry}
    scopes: string[];
    calendarId?: string;
    calendarSummary?: string;
    calendarCreatedByApp?: boolean;
    connectedAt: string;
  };
  oauthState?: { value: string; mode: 'dedicated' | 'existing'; availability: boolean; createdAt: string };
  events: Record<string, EventMapping>;
}

/** Tiny JSON-file store with atomic writes. Suitable for a single-user personal server. */
export class JsonStore {
  private data: ServerData;
  constructor(private file: string | null) {
    this.data = { events: {} };
    if (file && existsSync(file)) {
      try {
        this.data = { events: {}, ...JSON.parse(readFileSync(file, 'utf8')) };
      } catch {
        this.data = { events: {} };
      }
    }
  }
  get(): ServerData {
    return this.data;
  }
  update(fn: (d: ServerData) => void) {
    fn(this.data);
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    renameSync(tmp, this.file);
  }
}
