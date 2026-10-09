/**
 * version.json is the source of truth for /api/version, so every build route
 * (lab-deploy.sh, sentinel's plain `docker compose up --build`, local dev)
 * reports the real version instead of 'dev'.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { readVersionInfo } from '../utils/version';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-version-'));
const write = (name: string, body: string) => {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, body);
  return file;
};

afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

it('reads version and build number from version.json', () => {
  const file = write('a.json', JSON.stringify({ version: '1.2.3', buildNumber: 42 }));
  expect(readVersionInfo([file], {})).toEqual({ version: '1.2.3', buildNumber: 42 });
});

// Regression: compose passed APP_VERSION=dev when built without build args,
// and that used to win.
it('prefers version.json over APP_VERSION/BUILD_NUMBER env', () => {
  const file = write('b.json', JSON.stringify({ version: '2.0.0', buildNumber: 7 }));
  expect(readVersionInfo([file], { APP_VERSION: 'dev', BUILD_NUMBER: '0' })).toEqual({
    version: '2.0.0',
    buildNumber: 7,
  });
});

it('skips missing or corrupt candidates', () => {
  const bad = write('c.json', '{not json');
  const good = write('d.json', JSON.stringify({ version: '3.1.0', buildNumber: 9 }));
  expect(readVersionInfo([path.join(tmp, 'missing.json'), bad, good], {})).toEqual({
    version: '3.1.0',
    buildNumber: 9,
  });
});

it('falls back to env, then dev/0, when no file is found', () => {
  const none = [path.join(tmp, 'missing.json')];
  expect(readVersionInfo(none, { APP_VERSION: '9.9.9', BUILD_NUMBER: '5' })).toEqual({
    version: '9.9.9',
    buildNumber: 5,
  });
  expect(readVersionInfo(none, {})).toEqual({ version: 'dev', buildNumber: 0 });
});

it('default lookup finds the repo-root version.json in local dev', () => {
  const root = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../version.json'), 'utf8'));
  expect(readVersionInfo()).toEqual({ version: root.version, buildNumber: root.buildNumber });
});
