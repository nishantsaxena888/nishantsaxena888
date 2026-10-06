// Platform env — React Native impl. Vite's import.meta.env doesn't exist
// under Metro, so the app registers its config once at boot:
//
//   import { setEnvConfig } from "./platform/env"; // resolves this file
//   setEnvConfig({ apiUrl: "https://api.example.com", client: "grocery", dev: __DEV__ });
//
// Nothing else in shared code changes — env()/apiUrl()/clientName() read
// the registered values.
import type { EnvConfig } from "./env";

let cfg: EnvConfig = {};

export const setEnvConfig = (next: EnvConfig) => {
  cfg = next || {};
};

export const env = (key: string): string | undefined => cfg[key];
export const isDev = (): boolean => Boolean(cfg.dev);
export const apiUrl = (): string | undefined => cfg.apiUrl;
export const clientName = (): string | undefined => cfg.client;
