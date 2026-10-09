/// <reference types="vite/client" />
// Build-time constants injected by vite.config.ts `define`.
declare const __APP_VERSION__: string;
declare const __BUILD_NUMBER__: number;

declare module '*.png' {
  const url: string;
  export default url;
}
