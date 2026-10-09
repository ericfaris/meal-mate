// App version, injected at build time by vite.config.ts (from APP_VERSION /
// BUILD_NUMBER build args, falling back to the repo-root version.json).
export const APP_VERSION: string = __APP_VERSION__;
export const BUILD_NUMBER: number = __BUILD_NUMBER__;
