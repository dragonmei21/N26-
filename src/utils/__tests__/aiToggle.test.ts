import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const AI_ENABLED_KEY = "aiEnabled";

// Minimal re-implementation of the helpers from Investments.tsx so we can
// test the persistence logic in isolation (no DOM/React needed).
function readAiEnabled(storage: Storage): boolean {
  try {
    const stored = storage.getItem(AI_ENABLED_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function writeAiEnabled(storage: Storage, value: boolean): void {
  storage.setItem(AI_ENABLED_KEY, String(value));
}

describe("AI toggle persistence", () => {
  let store: Record<string, string> = {};

  const mockStorage: Storage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };

  beforeEach(() => { store = {}; });

  it("defaults to true when localStorage is empty", () => {
    expect(readAiEnabled(mockStorage)).toBe(true);
  });

  it("reads false when localStorage contains 'false'", () => {
    mockStorage.setItem(AI_ENABLED_KEY, "false");
    expect(readAiEnabled(mockStorage)).toBe(false);
  });

  it("reads true when localStorage contains 'true'", () => {
    mockStorage.setItem(AI_ENABLED_KEY, "true");
    expect(readAiEnabled(mockStorage)).toBe(true);
  });

  it("persists false after toggle off", () => {
    writeAiEnabled(mockStorage, false);
    expect(readAiEnabled(mockStorage)).toBe(false);
  });

  it("persists true after toggle on", () => {
    writeAiEnabled(mockStorage, false);
    writeAiEnabled(mockStorage, true);
    expect(readAiEnabled(mockStorage)).toBe(true);
  });

  it("survives a simulated page reload (re-read from storage)", () => {
    writeAiEnabled(mockStorage, false);
    // Simulate reload: new component mounts and reads from storage
    const valueAfterReload = readAiEnabled(mockStorage);
    expect(valueAfterReload).toBe(false);
  });
});
