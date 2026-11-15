// The build's version label (set by vite.config.ts at build time), e.g. "v0.5 · 3f2a9c1".

declare const __APP_VERSION__: string;
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
