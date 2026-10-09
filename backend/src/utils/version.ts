import fs from 'fs';
import path from 'path';

export interface VersionInfo {
  version: string;
  buildNumber: number;
}

// version.json is the source of truth. The Docker image copies it to
// /app/version.json (compiled code runs from /app/dist/utils); in local dev
// it is the repo-root file (code runs from backend/src/utils).
const DEFAULT_CANDIDATES = [
  path.resolve(__dirname, '../../version.json'),
  path.resolve(__dirname, '../../../version.json'),
];

/**
 * Resolve the app version: the first readable version.json wins, then the
 * APP_VERSION / BUILD_NUMBER env vars, then 'dev' / 0. Reading the file
 * (rather than trusting build args) keeps every build route correctly
 * stamped, including sentinel's plain `docker compose up --build`.
 */
export function readVersionInfo(
  candidates: string[] = DEFAULT_CANDIDATES,
  env: NodeJS.ProcessEnv = process.env
): VersionInfo {
  for (const file of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data.version) {
        return { version: String(data.version), buildNumber: Number(data.buildNumber) || 0 };
      }
    } catch {
      // missing or unreadable — try the next candidate
    }
  }
  return {
    version: env.APP_VERSION || 'dev',
    buildNumber: parseInt(env.BUILD_NUMBER || '0', 10) || 0,
  };
}
