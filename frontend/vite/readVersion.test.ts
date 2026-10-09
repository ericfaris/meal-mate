import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { readVersion } from './readVersion';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-web-version-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('readVersion', () => {
  it('reads version.json', () => {
    const file = path.join(tmp, 'v.json');
    fs.writeFileSync(file, JSON.stringify({ version: '1.4.0', buildNumber: 12 }));
    expect(readVersion(file, {})).toEqual({ version: '1.4.0', buildNumber: 12 });
  });

  // Regression: builds without stamped args (sentinel auto-deploy) shipped
  // as "dev" because the env var won over the file.
  it('prefers version.json over APP_VERSION=dev', () => {
    const file = path.join(tmp, 'w.json');
    fs.writeFileSync(file, JSON.stringify({ version: '1.5.0', buildNumber: 13 }));
    expect(readVersion(file, { APP_VERSION: 'dev', BUILD_NUMBER: '0' })).toEqual({
      version: '1.5.0',
      buildNumber: 13,
    });
  });

  it('falls back to env, then dev/0, without a readable file', () => {
    const missing = path.join(tmp, 'missing.json');
    expect(readVersion(missing, { APP_VERSION: '2.0.0', BUILD_NUMBER: '3' })).toEqual({
      version: '2.0.0',
      buildNumber: 3,
    });
    expect(readVersion(missing, {})).toEqual({ version: 'dev', buildNumber: 0 });
  });
});
