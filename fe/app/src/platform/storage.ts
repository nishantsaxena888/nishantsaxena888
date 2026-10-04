// Platform storage — web/Electron default. Everything lives in
// storage-core; this module just installs localStorage as the backend
// when a DOM is present (it isn't, under tests/SSR → memory fallback).
import {
  setStorageBackend,
  memoryStorage,
} from "./storage-core";

if (typeof window !== "undefined" && window.localStorage) {
  setStorageBackend(window.localStorage);
} else {
  setStorageBackend(memoryStorage());
}

// Parity with storage.native.ts — web needs no hydration (localStorage
// is sync and installed above), so this is an immediate no-op. Keeping
// the same export means boot code compiles identically on both.
export const hydrateStorage = async (): Promise<void> => {};

export * from "./storage-core";
