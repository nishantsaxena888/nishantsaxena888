import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL only auto-cleans under globals:true — with globals off (the
// vitest-style default) mounted trees must be removed between tests or
// `screen` queries hit stale DOM.
afterEach(cleanup);
