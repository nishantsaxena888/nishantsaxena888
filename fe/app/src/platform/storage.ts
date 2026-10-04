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

export * from "./storage-core";
