import fs from 'fs';

export interface VersionInfo {
  version: string;
  buildNumber: number;
}

/**
 * version.json is the source of truth: Dockerfile.web copies it to
 * /version.json (`../version.json` from /app), and locally it's the repo-root
 * file. APP_VERSION / BUILD_NUMBER env vars are only a fallback, so a plain
 * `docker compose up --build` (sentinel's auto-deploy) is stamped correctly.
 */
export function readVersion(versionFile: string, env: NodeJS.ProcessEnv = process.env): VersionInfo {
  try {
    const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    if (data.version) {
      return { version: String(data.version), buildNumber: Number(data.buildNumber) || 0 };
    }
  } catch {
    // missing or unreadable — fall back to env
  }
  return {
    version: env.APP_VERSION || 'dev',
    buildNumber: Number(env.BUILD_NUMBER) || 0,
  };
}
