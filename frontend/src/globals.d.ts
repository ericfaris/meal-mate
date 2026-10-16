/// <reference types="vite/client" />
// Build-time constants injected by vite.config.ts `define`.
declare const __APP_VERSION__: string;
declare const __BUILD_NUMBER__: number;

declare module '*.png' {
  const url: string;
  export default url;
}

// react-native-web ships no typings; it implements the react-native API, so
// reuse those types for the platform shim (src/platform/reactNative.tsx).
declare module 'react-native-web' {
  export * from 'react-native';
}
