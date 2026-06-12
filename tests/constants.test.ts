import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  DEFAULT_OPENCODE_SETTINGS,
  DEFAULT_PROMPT_TEMPLATES,
  CHAT_SESSIONS_KEY,
  CURRENT_SESSION_KEY,
  VIEW_TYPE_XIAOYUAN_AI_CHAT,
} from "../src/constants";

describe("constants integrity", () => {
  it("DEFAULT_PROMPT_TEMPLATES has all 7 built-in templates", () => {
    expect(DEFAULT_PROMPT_TEMPLATES).toHaveLength(7);
    const ids = DEFAULT_PROMPT_TEMPLATES.map(t => t.id);
    expect(ids).toContain("polish");
    expect(ids).toContain("summarize");
    expect(ids).toContain("complete");
    expect(ids).toContain("expand");
    expect(ids).toContain("translate");
    expect(ids).toContain("continue");
  });

  it("all built-in templates have non-empty fields", () => {
    for (const tpl of DEFAULT_PROMPT_TEMPLATES) {
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.prompt.length).toBeGreaterThan(10);
      expect(tpl.icon).toBeTruthy();
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
    expect(DEFAULT_SETTINGS.skills).toBeInstanceOf(Array);
    expect(DEFAULT_SETTINGS.promptTemplates).toBeInstanceOf(Array);
    expect(DEFAULT_SETTINGS.promptTemplates.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_SETTINGS.maxTokens).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.temperature).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.chatHistoryPath).toBeTruthy();
    expect(typeof DEFAULT_SETTINGS.systemPrompt).toBe("string");
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