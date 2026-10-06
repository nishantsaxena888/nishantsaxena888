// Platform env — one seam for build-time config so shared code never
// touches `import.meta.env` (Vite-only; RN/Electron don't have it).
//
//   Web/Electron   — import.meta.env.* (Vite injects at build)
//   React Native   — env.native.ts: the app calls setEnvConfig() at boot
//                    with {apiUrl, client, dev} — nothing else changes.
export interface EnvConfig {
  apiUrl?: string;
  client?: string;
  dev?: boolean;
  [key: string]: any;
}

export const env = (key: string): string | undefined =>
  (import.meta as any).env?.[key];

export const isDev = (): boolean => Boolean((import.meta as any).env?.DEV);
export const apiUrl = (): string | undefined => env("VITE_API_URL") ?? env("VITE_API_BASE_URL");
export const clientName = (): string | undefined => env("VITE_CLIENT");

// Parity with env.native.ts — env is build-time on web so this is a
// no-op; the shared boot sequence can call it unconditionally.
export const setEnvConfig = (_cfg: EnvConfig): void => {};
