import { buildInviteUrl, getAppUrl } from '../utils/appUrl';

describe('invite links', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; });

  // Regression: invites used the native-app scheme mealmate://, which a
  // browser can't open, so "invite with a link" didn't work on the PWA.
  it('points at the web app in production', () => {
    delete process.env.APP_URL;
    process.env.NODE_ENV = 'production';
    expect(buildInviteUrl('abc.def.ghi')).toBe('https://mealmate.mooseflip.com/join/abc.def.ghi');
  });

  it('honors APP_URL and trims trailing slashes', () => {
    process.env.APP_URL = 'https://example.test/';
    expect(getAppUrl()).toBe('https://example.test');
    expect(buildInviteUrl('t')).toBe('https://example.test/join/t');
  });

  it('defaults to the Vite dev server outside production', () => {
    delete process.env.APP_URL;
    process.env.NODE_ENV = 'development';
    expect(buildInviteUrl('t')).toBe('http://localhost:8081/join/t');
  });
});
