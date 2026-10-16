/**
 * Public URL of the web app (the PWA), used to build links people tap, like
 * household invites. APP_URL overrides; production defaults to the lab host.
 */
export function getAppUrl(): string {
  const url =
    process.env.APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://mealmate.mooseflip.com' : 'http://localhost:8081');
  return url.replace(/\/+$/, '');
}

/**
 * Invite link that opens the app's Settings screen with the token
 * (frontend linking: `join/:token`). Replaces the old native-only
 * `mealmate://join/...` scheme, which does nothing in a browser.
 */
export function buildInviteUrl(token: string): string {
  return `${getAppUrl()}/join/${encodeURIComponent(token)}`;
}
