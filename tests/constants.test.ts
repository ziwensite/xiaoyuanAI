import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  DEFAULT_OPENCODE_SETTINGS,
  OPERATIONS,
  OPERATION_PROMPTS,
  OPERATION_LABELS,
  OPERATION_ICONS,
  CHAT_SESSIONS_KEY,
  CURRENT_SESSION_KEY,
  VIEW_TYPE_XIAOYUAN_AI_CHAT,
} from "../src/constants";
import type { Operation } from "../src/types";

describe("constants integrity", () => {
  it("OPERATIONS contains all defined operations", () => {
    const expected: Operation[] = ["polish", "summarize", "complete", "expand", "translate", "continue"];
    expect([...OPERATIONS].sort()).toEqual([...expected].sort());
  });

  it("OPERATION_PROMPTS covers all operations", () => {
    for (const op of OPERATIONS) {
      expect(OPERATION_PROMPTS[op]).toBeDefined();
      expect(OPERATION_PROMPTS[op]).toBeTruthy();
    }
  });

  it("OPERATION_LABELS covers all operations", () => {
    for (const op of OPERATIONS) {
      expect(OPERATION_LABELS[op]).toBeDefined();
      expect(OPERATION_LABELS[op]).toBeTruthy();
    }
  });

  it("OPERATION_ICONS covers all operations", () => {
    for (const op of OPERATIONS) {
      expect(OPERATION_ICONS[op]).toBeDefined();
      expect(OPERATION_ICONS[op]).toBeTruthy();
    }
  });

  it("OPERATIONS, PROMPTS, LABELS, ICONS have matching keys", () => {
    const promptKeys = Object.keys(OPERATION_PROMPTS).sort();
    const labelKeys = Object.keys(OPERATION_LABELS).sort();
    const iconKeys = Object.keys(OPERATION_ICONS).sort();
    const opKeys = [...OPERATIONS].sort();

    expect(promptKeys).toEqual(opKeys);
    expect(labelKeys).toEqual(opKeys);
    expect(iconKeys).toEqual(opKeys);
  });

  it("no operation maps to empty prompt", () => {
    for (const op of OPERATIONS) {
      expect(OPERATION_PROMPTS[op].length).toBeGreaterThan(10);
    }
  });

  it("DEFAULT_OPENCODE_SETTINGS has all required fields", () => {
    expect(DEFAULT_OPENCODE_SETTINGS.cliPath).toBe("opencode");
    expect(DEFAULT_OPENCODE_SETTINGS.autoStart).toBe(false);
    expect(DEFAULT_OPENCODE_SETTINGS.hostname).toBe("127.0.0.1");
    expect(DEFAULT_OPENCODE_SETTINGS.port).toBe(16226);
    expect(DEFAULT_OPENCODE_SETTINGS.model).toBe("");
    expect(DEFAULT_OPENCODE_SETTINGS.agent).toBe("build");
  });

  it("DEFAULT_SETTINGS has all required fields", () => {
    expect(DEFAULT_SETTINGS.execMode).toMatch(/^(api|cli)$/);
    expect(DEFAULT_SETTINGS.opencode).toBeDefined();
    expect(DEFAULT_SETTINGS.apiProviders).toBeInstanceOf(Array);
    expect(DEFAULT_SETTINGS.apiProviders.length).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_SETTINGS.mcpServers).toBeInstanceOf(Array);
    expect(DEFAULT_SETTINGS.skills).toBeInstanceOf(Array);
    expect(DEFAULT_SETTINGS.maxTokens).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.temperature).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.chatHistoryPath).toBeTruthy();
    expect(DEFAULT_SETTINGS.systemPrompt).toBeTruthy();
  });

  it("chat history path constants are non-empty", () => {
    expect(CHAT_SESSIONS_KEY).toBeTruthy();
    expect(CURRENT_SESSION_KEY).toBeTruthy();
    expect(VIEW_TYPE_XIAOYUAN_AI_CHAT).toBeTruthy();
    expect(typeof CHAT_SESSIONS_KEY).toBe("string");
    expect(typeof VIEW_TYPE_XIAOYUAN_AI_CHAT).toBe("string");
  });

  it("default API provider has a valid model", () => {
    const provider = DEFAULT_SETTINGS.apiProviders[0];
    expect(provider.id).toBeTruthy();
    expect(provider.name).toBeTruthy();
    expect(provider.baseUrl).toContain("http");
    expect(provider.model).toBeTruthy();
  });
});