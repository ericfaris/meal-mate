import { URL } from 'url';

/**
 * Blocked IP ranges for SSRF protection.
 * Prevents fetching internal network resources, loopback, and cloud metadata endpoints.
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local / cloud metadata (AWS, GCP, Azure)
  /^0\./,                      // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./, // Carrier-grade NAT
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',  // GCP metadata
  'metadata',
];

/**
 * Validates that a URL is safe to fetch (not pointing to internal resources).
 * Returns an error message if blocked, or null if the URL is safe.
 */
export function validateExternalUrl(urlString: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return 'Invalid URL format';
  }

  // Only allow http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http and https URLs are allowed';
  }

  // Block known internal hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return 'This URL points to an internal resource and cannot be accessed';
  }

  // Block private/reserved IP ranges
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return 'This URL points to an internal resource and cannot be accessed';
    }
  }

  return null; // URL is safe
}
