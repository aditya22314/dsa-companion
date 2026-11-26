import { useEffect, useState } from 'react';
import { api, type Health } from './api';

const OFFLINE: Health = { ok: false, googleConfigured: false, aiConfigured: false, aiModel: null };
let cached: Promise<Health> | null = null;

/** Server features. Falls back to "offline" when the app runs without the backend. */
export function useHealth(): Health & { loading: boolean } {
  const [h, setH] = useState<Health & { loading: boolean }>({ ...OFFLINE, loading: true });
  useEffect(() => {
    cached ??= api.health().catch(() => OFFLINE);
    let live = true;
    cached.then((v) => live && setH({ ...v, loading: false }));
    return () => {
      live = false;
    };
  }, []);
  return h;
}
