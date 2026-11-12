import fs from 'fs';

/**
 * Durable copy of the editorial store in Supabase (table public.site_state, RLS on, no public policies).
 * Render's free disk is wiped on every deploy; this keeps admin-created/edited articles alive.
 * Needs SUPABASE_SECRET_KEY (server only). Without it everything is a silent no-op.
 */
const URL_BASE = (process.env.SUPABASE_URL || 'https://nandwfborgwwcixqnyhr.supabase.co').replace(/\/$/, '');
const SECRET = process.env.SUPABASE_SECRET_KEY || '';
const KEY = 'editorial';

const headers = () => ({
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
});

export const remoteBackupEnabled = () => Boolean(SECRET);

/** Before the store loads: if the local file is missing or older than the remote copy, restore it. */
export async function restoreStoreFile(storeFile: string): Promise<void> {
  if (!SECRET) return;
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/site_state?key=eq.${KEY}&select=payload`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const remote = rows?.[0]?.payload;
    if (!remote || !Array.isArray(remote.articles)) return;
    let localSaved = '';
    if (fs.existsSync(storeFile)) {
      try { localSaved = JSON.parse(fs.readFileSync(storeFile, 'utf-8')).lastSavedAt || ''; } catch { /* corrupt: let remote win */ }
    }
    if (!localSaved || (remote.lastSavedAt && remote.lastSavedAt > localSaved)) {
      fs.writeFileSync(storeFile, JSON.stringify(remote, null, 2), 'utf-8');
      console.log('[RemoteBackup] Restored editorial store from Supabase');
    }
  } catch (e: any) {
    console.error('[RemoteBackup] restore skipped:', e?.message || e);
  }
}

let timer: NodeJS.Timeout | null = null;
let latest: any = null;

/** Debounced upload (3s) of the latest store snapshot. */
export function scheduleBackup(payload: any): void {
  if (!SECRET) return;
  latest = payload;
  if (timer) return;
  timer = setTimeout(async () => {
    timer = null;
    const body = latest;
    try {
      const res = await fetch(`${URL_BASE}/rest/v1/site_state?on_conflict=key`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ key: KEY, payload: body, saved_at: new Date().toISOString() }),
      });
      if (!res.ok) console.error('[RemoteBackup] upload failed', res.status);
    } catch (e: any) {
      console.error('[RemoteBackup] upload error:', e?.message || e);
    }
  }, 3000);
}
