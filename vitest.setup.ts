// Registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...)
// with Vitest's expect.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans up when Vitest globals are enabled. This
// project imports `describe`/`it`/`expect` explicitly instead, so unmounting
// has to be wired up manually — without it, renders accumulate across tests
// in the same file and queries fail with "found multiple elements".
afterEach(() => {
  cleanup();
});
