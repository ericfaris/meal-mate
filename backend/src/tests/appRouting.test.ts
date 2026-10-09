/**
 * Express 5 smoke test: public routes respond, unknown routes hit the 404
 * handler, and auth-guarded routes with path params reject without a token.
 */

import fs from 'fs';
import path from 'path';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { createApp } from '../app';

let server: Server;
let base: string;

beforeAll((done) => {
  server = createApp().listen(0, () => {
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

it('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  expect(res.status).toBe(200);
  expect((await res.json()).status).toBe('ok');
});

it('GET /api/version reports version.json', async () => {
  const res = await fetch(`${base}/api/version`);
  expect(res.status).toBe(200);
  const body = await res.json();
  const root = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../version.json'), 'utf8'));
  expect(body.version).toBe(root.version);
  expect(body.buildNumber).toBe(root.buildNumber);
});

it('unknown routes return 404 from the fallback handler', async () => {
  const res = await fetch(`${base}/api/does-not-exist`);
  expect(res.status).toBe(404);
});

it('param routes behind auth reject unauthenticated requests', async () => {
  const res = await fetch(`${base}/api/grocery-lists/abc/items/0`, { method: 'PUT' });
  expect(res.status).toBe(401);
});
