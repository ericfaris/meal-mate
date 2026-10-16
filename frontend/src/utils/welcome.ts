/**
 * First-visit routing to the marketing page (public/welcome/index.html).
 *
 * A signed-out visitor landing on `/` for the first time is sent to
 * `/welcome/` once. Its buttons link back to `/?start`, which marks the page
 * as seen. Signed-in users, deep links (/join/:token, /grocery/:id) and
 * anyone who has seen it before go straight to the app.
 */
export const WELCOME_PATH = '/welcome/';
export const WELCOME_SEEN_KEY = 'mm_welcome_seen';
const TOKEN_KEY = 'auth_token'; // services/storage

interface Env {
  pathname: string;
  search: string;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
}

export function shouldRedirectToWelcome({ pathname, search, storage }: Env): boolean {
  const params = new URLSearchParams(search);
  const read = (k: string) => {
    try { return storage?.getItem(k) ?? null; } catch { return null; }
  };
  if (params.has('start')) {
    try { storage?.setItem(WELCOME_SEEN_KEY, '1'); } catch { /* private mode: fine */ }
    return false;
  }
  if (pathname !== '/') return false;
  if (read(TOKEN_KEY)) return false;
  if (read(WELCOME_SEEN_KEY)) return false;
  // Without storage we can't remember the visit; don't risk a redirect loop.
  return storage !== null;
}

/** Call once before the app renders. Returns true when it navigated away. */
export function redirectToWelcomeIfFirstVisit(win: Window = window): boolean {
  let storage: Storage | null = null;
  try { storage = win.localStorage; } catch { storage = null; }
  const go = shouldRedirectToWelcome({ pathname: win.location.pathname, search: win.location.search, storage });
  if (go) {
    try { storage?.setItem(WELCOME_SEEN_KEY, '1'); } catch { /* ignore */ }
    win.location.replace(WELCOME_PATH);
  } else if (new URLSearchParams(win.location.search).has('start')) {
    // Recorded above; tidy the address bar.
    try { win.history.replaceState(null, '', win.location.pathname + win.location.hash); } catch { /* ignore */ }
  }
  return go;
}
